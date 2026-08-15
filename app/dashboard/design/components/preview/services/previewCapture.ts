import { toBlob, toCanvas, toPng } from "html-to-image";
import { EXPORT_MOCKUP_AREA } from "../../canvas/constants";
import type { PreviewSide, PreviewSideData } from "../types/preview";
import { TARGET_PRINT_DPI } from "../../canvas/engine/dpi";
import { fetchEditorFonts } from "../../toolbar/data";
import { getFontByFamily, loadEditorFont } from "../../data/fonts";
import { resolveElementImageSrc } from "@/shared/rendering/imageSource";
import { FONT_ITEMS, EXTRA_STICKER_ITEMS, SHAPES, STICKER_ITEMS } from "../../data";

console.warn("[PREVIEW DIAGNOSTIC] module loaded");

const CHECKOUT_PREVIEW_SIZE = 384;
const CHECKOUT_PREVIEW_PIXEL_RATIO = 1;
const CHECKOUT_PREVIEW_QUALITY = 0.72;
const CHECKOUT_PREVIEW_TIMEOUT_MS = 35_000;
const CHECKOUT_PREVIEW_IMAGE_WAIT_TIMEOUT_MS = 10_000;

const CAPTURE_HIDDEN_SELECTORS = [
  "[data-element-control]",
  "[data-resize-handle]",
  "[data-warning-frame]",
  "[data-editor-only]",
  "[data-selection-frame]",
  "[data-gelato-dropzone]",
  "[data-production-hidden]",
  "[data-lost-elements-overlay]",
  "[data-lost-element-marker]",
];

function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function positiveNumber(value: unknown, fallback: number) {
  const parsed = number(value, fallback);
  return parsed > 0 ? parsed : fallback;
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function isPageTransitioning() {
  return document.hidden || document.visibilityState === "hidden" || !document.body?.isConnected;
}

function ensureCaptureStillAlive(node: HTMLElement) {
  if (!node.isConnected || isPageTransitioning()) {
    throw new Error("Preview capture aborted during page transition");
  }
}

async function waitForStableCaptureState(
  node: HTMLElement,
  expectedIds: string[],
  timeoutMs = 10_000,
) {
  const startedAt = performance.now();
  let stableFrames = 0;
  let previousSignature = "";

  while (performance.now() - startedAt < timeoutMs) {
    const rect = node.getBoundingClientRect();
    const renderedIds = Array.from(
      node.querySelectorAll<HTMLElement>("[data-design-element-id]"),
    ).map((item) => String(item.dataset.designElementId || ""));
    const images = Array.from(node.querySelectorAll<HTMLImageElement>("img"));
    const decodedImages = images.filter(
      (image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0,
    ).length;
    const missingIds = expectedIds.filter((id) => !renderedIds.includes(id));
    const signature = [
      rect.left.toFixed(1),
      rect.top.toFixed(1),
      rect.width.toFixed(1),
      rect.height.toFixed(1),
      renderedIds.length,
      images.length,
      decodedImages,
    ].join("|");

    const ready =
      rect.width > 0 &&
      rect.height > 0 &&
      missingIds.length === 0 &&
      decodedImages === images.length;

    if (ready && signature === previousSignature) stableFrames += 1;
    else stableFrames = ready ? 1 : 0;

    previousSignature = signature;
    if (stableFrames >= 4) return;
    await nextFrame();
  }

  throw new Error("Checkout preview layout/resources did not become stable in time");
}

const isDevelopment = process.env.NODE_ENV !== "production";

function devLog(...args: unknown[]) {
  if (isDevelopment) {
    console.warn(...args);
  }
}

async function waitForFonts() {
  await document.fonts?.ready?.catch?.(() => undefined);
}

function normalizeFamily(value: string) {
  return value.trim().replace(/^['"]|['"]$/g, "");
}

function isLikelyImageUrl(url: string) {
  return /^(data:|blob:|https?:\/\/)/i.test(url) || /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(url);
}

function isHtmlRouteUrl(url: string) {
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.origin === window.location.origin && !isLikelyImageUrl(parsed.href);
  } catch {
    return false;
  }
}

function isUsableImageSource(value: string | null | undefined) {
  const source = String(value || "").trim();
  if (!source) return false;
  if (/^(about:blank|javascript:)/i.test(source)) return false;

  try {
    const resolved = new URL(source, window.location.href);
    const currentPage = new URL(window.location.href);

    if (resolved.href === currentPage.href) return false;
    if (resolved.origin === currentPage.origin && isHtmlRouteUrl(resolved.href)) {
      return false;
    }

    return isLikelyImageUrl(resolved.href);
  } catch {
    return isLikelyImageUrl(source);
  }
}

const SYSTEM_FONT_FAMILIES = new Set([
  "arial",
  "sans-serif",
  "serif",
  "monospace",
  "system-ui",
  "inter",
  "inherit",
  "initial",
]);

function normalizeFontFamilyName(value: string) {
  return normalizeFamily(value);
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image blob"));
    reader.readAsDataURL(blob);
  });
}

function firstFontFamily(value: string) {
  return normalizeFamily(String(value || "").split(",")[0] || "");
}

async function prepareCaptureResources(container: HTMLElement) {
  const fontsCatalog = await fetchEditorFonts().catch(() => []);
  const fontFamilies = new Set<string>();
  const usedImages: string[] = [];
  const unresolved: Array<Record<string, unknown>> = [];
  const restoreCallbacks: Array<() => void> = [];

  const nodes = [container, ...Array.from(container.querySelectorAll<HTMLElement>("*"))];
  for (const node of nodes) {
    const style = window.getComputedStyle(node);
    const family = firstFontFamily(style.fontFamily || "");
    if (family && !SYSTEM_FONT_FAMILIES.has(family.toLowerCase()) && !family.startsWith("var(")) {
      fontFamilies.add(family);
    }
  }

  const loadedFonts: string[] = [];
  for (const family of fontFamilies) {
    const font =
      fontsCatalog.find((item) => String(item?.family || "").toLowerCase() === family.toLowerCase()) ??
      getFontByFamily(family);

    try {
      if (font) {
        await loadEditorFont(font.family);
      }
      await document.fonts.load(`400 16px "${family}"`).catch(() => undefined);
      await document.fonts.load(`700 16px "${family}"`).catch(() => undefined);
      if (document.fonts.check(`16px "${family}"`)) loadedFonts.push(family);
      else unresolved.push({ type: "font", fontFamily: family, reason: "font_not_loaded" });
    } catch (error) {
      unresolved.push({
        type: "font",
        fontFamily: family,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const images = Array.from(container.querySelectorAll<HTMLImageElement>("img"));
  for (const image of images) {
    const elementNode = image.closest<HTMLElement>("[data-design-element-id]");
    const resolvedSrc = String(image.currentSrc || image.src || image.getAttribute("src") || "").trim();

    if (!resolvedSrc) {
      unresolved.push({
        type: "image",
        elementId: elementNode?.dataset.designElementId ?? null,
        reason: "missing_src",
      });
      continue;
    }
    if (isHtmlRouteUrl(resolvedSrc)) {
      unresolved.push({
        type: "image",
        elementId: elementNode?.dataset.designElementId ?? null,
        src: resolvedSrc.slice(0, 180),
        reason: "html_route_used_as_image",
      });
      continue;
    }

    usedImages.push(resolvedSrc);
    image.loading = "eager";
    image.decoding = "sync";

    // The live editor DOM is the source of truth. A decoded image is already
    // safe to capture and must not be rejected because a second CORS fetch fails.
    if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
      continue;
    }

    try {
      await Promise.race([
        image.decode(),
        delay(CHECKOUT_PREVIEW_IMAGE_WAIT_TIMEOUT_MS).then(() => {
          throw new Error("image_decode_timeout");
        }),
      ]);
    } catch (error) {
      if (!(image.complete && image.naturalWidth > 0 && image.naturalHeight > 0)) {
        unresolved.push({
          type: "image",
          elementId: elementNode?.dataset.designElementId ?? null,
          src: resolvedSrc.slice(0, 180),
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  await document.fonts.ready.catch(() => undefined);
  await nextFrame();
  await nextFrame();

  return {
    loadedFonts,
    usedImages,
    unresolved,
    cleanup() {
      for (const restore of restoreCallbacks.reverse()) restore();
    },
  };
}

function getNodeChain(node: HTMLElement | null) {
  const chain: Array<Record<string, unknown>> = [];
  let current: HTMLElement | null = node;

  while (current) {
    const style = window.getComputedStyle(current);
    const rect = current.getBoundingClientRect();
    chain.push({
      tagName: current.tagName,
      className: current.className,
      position: style.position,
      width: rect.width,
      height: rect.height,
      transform: style.transform,
      transformOrigin: style.transformOrigin,
      overflow: style.overflow,
      clipPath: style.clipPath,
      mask: style.maskImage || style.mask,
      scale: style.scale,
    });

    if (current.tagName === "BODY") break;
    current = current.parentElement;
  }

  return chain;
}

function getCatalogResolution(element: any, fontsCatalog: any[], stickersCatalog: any[], shapesCatalog: any[]) {
  const requestedId = String(element?.assetId || element?.stickerId || element?.shapeId || element?.fontFamily || "");
  const fontHit = fontsCatalog.find((item) => String(item?.id || item?.family || "").toLowerCase() === requestedId.toLowerCase());
  const stickerHit = stickersCatalog.find((item) => String(item?.id || item?.value || item?.label || "").toLowerCase() === requestedId.toLowerCase());
  const shapeHit = shapesCatalog.find((item) => String(item?.id || item?.value || item?.label || "").toLowerCase() === requestedId.toLowerCase());

  return {
    elementId: element?.id ?? null,
    type: element?.type ?? null,
    requestedId,
    foundInFontsCatalog: Boolean(fontHit),
    foundInStickersCatalog: Boolean(stickerHit),
    foundInShapesCatalog: Boolean(shapeHit),
    resolvedCatalogUrl: fontHit?.previewWebpUrl || fontHit?.preview_webp_url || stickerHit?.svg || shapeHit?.svg || null,
  };
}

function getStickerCatalog() {
  return [...STICKER_ITEMS, ...EXTRA_STICKER_ITEMS];
}

function getAbsoluteUrl(src: string) {
  try {
    return new URL(src, window.location.href).toString();
  } catch {
    return src;
  }
}

async function diagnoseImageUrl(url: string) {
  const absoluteUrl = getAbsoluteUrl(url);
  let status: number | null = null;
  let contentType: string | null = null;
  let size: number | null = null;
  let corsAvailable: boolean | null = null;

  try {
    const response = await fetch(absoluteUrl, { method: "GET", mode: "cors" });
    status = response.status;
    contentType = response.headers.get("content-type");
    const blob = await response.blob();
    size = blob.size;
    corsAvailable = true;
  } catch {
    corsAvailable = false;
  }

  const parsed = (() => {
    try {
      return new URL(absoluteUrl);
    } catch {
      return null;
    }
  })();

  return {
    url: absoluteUrl,
    hostname: parsed?.hostname ?? null,
    pathname: parsed?.pathname ?? null,
    status,
    contentType,
    corsAvailable,
    size,
  };
}

function collectFontFamilies(container: HTMLElement) {
  const families = new Set<string>();
  const nodes = [container, ...Array.from(container.querySelectorAll("*"))];

  nodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const family = window.getComputedStyle(node).fontFamily || "";
    family
      .split(",")
      .map(normalizeFontFamilyName)
      .filter(Boolean)
      .forEach((name) => {
        const key = name.toLowerCase();
        if (!SYSTEM_FONT_FAMILIES.has(key) && !key.startsWith("var(")) {
          families.add(name);
        }
      });
  });

  return Array.from(families);
}

async function ensureRuntimeGoogleFonts(container: HTMLElement) {
  const families = collectFontFamilies(container);
  if (!families.length) return;

  await Promise.all(
    families.map(
      (family) =>
        new Promise<void>((resolve) => {
          const id = `ryfio-google-font-${family.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
          if (document.getElementById(id)) {
            resolve();
            return;
          }

          const link = document.createElement("link");
          link.id = id;
          link.rel = "stylesheet";
          link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}&display=swap`;
          link.onload = () => resolve();
          link.onerror = () => resolve();
          document.head.appendChild(link);
        }),
    ),
  );

  await Promise.all(
    families.map((family) =>
      document.fonts?.load?.(`16px "${family}"`).catch(() => undefined),
    ),
  );
}

function waitForImages(container: HTMLElement, strict = false) {
  const images = Array.from(container.querySelectorAll("img"));
  if (!images.length) return Promise.resolve();

  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve, reject) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          if (img.complete && strict) {
            reject(new Error(`Production asset failed to load: ${img.currentSrc || img.src}`));
            return;
          }

          const done = (event?: Event) => {
            img.removeEventListener("load", done);
            img.removeEventListener("error", done);
            if (strict && event?.type === "error") {
              reject(new Error(`Production asset failed to load: ${img.currentSrc || img.src}`));
              return;
            }
            resolve();
          };

          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        }),
    ),
  ).then(() => undefined);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error(`${label} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);
}


function normalizeCaptureFailure(error: unknown): Error {
  if (error instanceof Error) return error;

  if (error instanceof Event) {
    const target = error.target;
    if (target instanceof HTMLImageElement) {
      return new Error(
        `Image capture failed: src=${target.currentSrc || target.getAttribute("src") || "unknown"}, ` +
          `complete=${target.complete}, naturalWidth=${target.naturalWidth}, ` +
          `naturalHeight=${target.naturalHeight}`,
      );
    }
    return new Error(`Capture event failed: type=${error.type || "unknown"}`);
  }

  return new Error(String(error));
}

async function stabilizeLiveImagesForCapture(container: HTMLElement) {
  const images = Array.from(container.querySelectorAll<HTMLImageElement>("img"));
  const restorers: Array<() => void> = [];
  const preloaders: HTMLImageElement[] = [];

  for (const image of images) {
    const original = {
      src: image.getAttribute("src"),
      srcset: image.getAttribute("srcset"),
      sizes: image.getAttribute("sizes"),
      loading: image.getAttribute("loading"),
      decoding: image.getAttribute("decoding"),
    };

    const currentSrc = String(image.currentSrc || "").trim();
    const explicitSrc = String(image.getAttribute("src") || "").trim();
    const stableSrc = isUsableImageSource(currentSrc)
      ? currentSrc
      : isUsableImageSource(explicitSrc)
        ? explicitSrc
        : "";

    // Empty/missing image sources are exposed by the browser as the current
    // editor page URL. html-to-image then tries to decode that HTML page as an
    // image. Remove those invalid image nodes from the capture tree entirely
    // and restore them after capture.
    if (!stableSrc) {
      const parent = image.parentNode;
      if (parent) {
        const placeholder = document.createElement("span");
        const rect = image.getBoundingClientRect();
        const computed = window.getComputedStyle(image);
        placeholder.setAttribute("data-preview-invalid-image-placeholder", "true");
        placeholder.style.display = computed.display === "none" ? "none" : "inline-block";
        placeholder.style.width = `${Math.max(0, rect.width)}px`;
        placeholder.style.height = `${Math.max(0, rect.height)}px`;
        placeholder.style.opacity = "0";
        placeholder.style.pointerEvents = "none";
        parent.replaceChild(placeholder, image);
        restorers.push(() => {
          if (placeholder.parentNode) placeholder.parentNode.replaceChild(image, placeholder);
        });
      }
      continue;
    }

    restorers.push(() => {
      const restore = (name: string, value: string | null) => {
        if (value === null) image.removeAttribute(name);
        else image.setAttribute(name, value);
      };
      restore("src", original.src);
      restore("srcset", original.srcset);
      restore("sizes", original.sizes);
      restore("loading", original.loading);
      restore("decoding", original.decoding);
    });

    image.loading = "eager";
    image.decoding = "sync";
    image.removeAttribute("srcset");
    image.removeAttribute("sizes");
    if (image.getAttribute("src") !== stableSrc) image.setAttribute("src", stableSrc);

    if (!(image.complete && image.naturalWidth > 0 && image.naturalHeight > 0)) {
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          cleanup();
          reject(new Error(`Image readiness timed out: ${stableSrc}`));
        }, CHECKOUT_PREVIEW_IMAGE_WAIT_TIMEOUT_MS);
        const cleanup = () => {
          window.clearTimeout(timeout);
          image.removeEventListener("load", onLoad);
          image.removeEventListener("error", onError);
        };
        const onLoad = () => { cleanup(); resolve(); };
        const onError = (event: Event) => { cleanup(); reject(normalizeCaptureFailure(event)); };
        image.addEventListener("load", onLoad, { once: true });
        image.addEventListener("error", onError, { once: true });
      });
    }

    const preloader = new Image();
    preloader.decoding = "sync";
    preloader.loading = "eager";
    preloader.src = stableSrc;
    preloaders.push(preloader);
    await new Promise<void>((resolve, reject) => {
      if (preloader.complete && preloader.naturalWidth > 0) {
        resolve();
        return;
      }
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error(`Image preload timed out: ${stableSrc}`));
      }, CHECKOUT_PREVIEW_IMAGE_WAIT_TIMEOUT_MS);
      const cleanup = () => {
        window.clearTimeout(timeout);
        preloader.removeEventListener("load", onLoad);
        preloader.removeEventListener("error", onError);
      };
      const onLoad = () => { cleanup(); resolve(); };
      const onError = (event: Event) => { cleanup(); reject(normalizeCaptureFailure(event)); };
      preloader.addEventListener("load", onLoad, { once: true });
      preloader.addEventListener("error", onError, { once: true });
    });
  }

  await nextFrame();
  await nextFrame();

  return () => {
    preloaders.forEach((image) => { image.removeAttribute("src"); });
    for (const restore of restorers.reverse()) restore();
  };
}

function describeCaptureError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  if (error instanceof Event) {
    const target = error.target;

    if (target instanceof HTMLImageElement) {
      return `Image event: src=${target.currentSrc || target.getAttribute("src")}, complete=${target.complete}, naturalWidth=${target.naturalWidth}, naturalHeight=${target.naturalHeight}`;
    }

    return `Event: type=${error.type}`;
  }

  return String(error);
}

async function validateCaptureImages(node: HTMLElement) {
  const images = Array.from(node.querySelectorAll<HTMLImageElement>("img"));

  for (const image of images) {
    if (!image.complete) {
      await image.decode();
    }

    if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
      throw new Error(`Invalid image before capture: ${image.currentSrc || image.src}`);
    }
  }
}

function shouldCaptureNode(target: HTMLElement) {
  if (target.dataset.excludeFromPreview !== undefined) return false;

  return !CAPTURE_HIDDEN_SELECTORS.some(
    (selector) => target.matches(selector) || Boolean(target.closest(selector)),
  );
}

function prepareClonedImages(container: HTMLElement) {
  const images = Array.from(container.querySelectorAll("img"));

  images.forEach((img) => {
    const source = img.getAttribute("src") || img.src || "";
    img.setAttribute("crossorigin", "anonymous");
    img.setAttribute("decoding", "sync");
    img.setAttribute("loading", "eager");
    img.removeAttribute("srcset");
    if (source) img.setAttribute("src", source);
  });
}

function buildCaptureOptions(width: number, height: number) {
  return {
    cacheBust: false,
    includeQueryParams: true,
    pixelRatio: CHECKOUT_PREVIEW_PIXEL_RATIO,
    backgroundColor: "transparent",
    width,
    height,
    canvasWidth: width,
    canvasHeight: height,
    style: {
      margin: "0",
      transform: "none",
      transformOrigin: "top left",
    },
    filter: (target: HTMLElement) => {
      if (target instanceof HTMLImageElement) {
        const src = target.currentSrc || target.getAttribute("src") || "";
        if (
          !src ||
          target.naturalWidth <= 0 ||
          target.naturalHeight <= 0 ||
          src.includes("/dashboard/design/")
        ) {
          return false;
        }
      }
      if (!(target instanceof HTMLElement)) return true;
      if (target.dataset.excludeFromPreview !== undefined) return false;
      return shouldCaptureNode(target);
    },
  } as const;
}

function captureFilterForDiagnostics(target: HTMLElement) {
  if (target instanceof HTMLImageElement) {
    const src = target.currentSrc || target.getAttribute("src") || "";
    if (
      !src ||
      target.naturalWidth <= 0 ||
      target.naturalHeight <= 0 ||
      src.includes("/dashboard/design/")
    ) {
      return false;
    }
  }
  return shouldCaptureNode(target);
}

function shortUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const url = value.trim();
  return {
    start: url.slice(0, 80),
    end: url.slice(-30),
    length: url.length,
  };
}

function inspectLayer(name: string, element: HTMLElement | null) {
  if (!element) {
    return { name, missing: true };
  }

  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  return {
    name,
    tag: element.tagName,
    className: element.className,
    zIndex: style.zIndex,
    position: style.position,
    opacity: style.opacity,
    visibility: style.visibility,
    display: style.display,
    background: style.background,
    backgroundColor: style.backgroundColor,
    mixBlendMode: style.mixBlendMode,
    filter: style.filter,
    clipPath: style.clipPath,
    maskImage: style.maskImage,
    overflow: style.overflow,
    transform: style.transform,
    rect: {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    },
  };
}

function inspectMockupImage(element: HTMLElement | null) {
  const img = element instanceof HTMLImageElement ? element : element?.querySelector("img");
  if (!(img instanceof HTMLImageElement)) {
    return { missing: true };
  }

  const style = window.getComputedStyle(img);
  const rect = img.getBoundingClientRect();

  return {
    tag: img.tagName,
    className: img.className,
    src: img.getAttribute("src"),
    currentSrc: img.currentSrc,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    opacity: style.opacity,
    zIndex: style.zIndex,
    position: style.position,
    display: style.display,
    visibility: style.visibility,
    objectFit: style.objectFit,
    objectPosition: style.objectPosition,
    background: style.background,
    backgroundColor: style.backgroundColor,
    mixBlendMode: style.mixBlendMode,
    filter: style.filter,
    clipPath: style.clipPath,
    maskImage: style.maskImage,
    overflow: style.overflow,
    transform: style.transform,
    rect: {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    },
  };
}

function logLayerSnapshot(
  scope: "original" | "clone" | "clone-before-append" | "clone-after-append",
  root: HTMLElement,
) {
  const layerNodes = Array.from(
    root.querySelectorAll<HTMLElement>(
      "[data-preview-layer], [data-printable-capture-layer], img",
    ),
  ).map((element, index) => ({
    index,
    layer: element.getAttribute("data-preview-layer") || element.getAttribute("data-printable-capture-layer") || (element instanceof HTMLImageElement ? "img" : "unknown"),
    tag: element.tagName,
    className: element.className,
    zIndex: window.getComputedStyle(element).zIndex,
    position: window.getComputedStyle(element).position,
    opacity: window.getComputedStyle(element).opacity,
    visibility: window.getComputedStyle(element).visibility,
    display: window.getComputedStyle(element).display,
    background: window.getComputedStyle(element).background,
    backgroundColor: window.getComputedStyle(element).backgroundColor,
    mixBlendMode: window.getComputedStyle(element).mixBlendMode,
    filter: window.getComputedStyle(element).filter,
    clipPath: window.getComputedStyle(element).clipPath,
    maskImage: window.getComputedStyle(element).maskImage,
    overflow: window.getComputedStyle(element).overflow,
    transform: window.getComputedStyle(element).transform,
    rect: (() => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    })(),
    image: element instanceof HTMLImageElement ? inspectMockupImage(element) : null,
  }));

  console.info("[preview-capture] layer snapshot", {
    scope,
    root: inspectLayer("root", root),
    layers: layerNodes,
  });
}

function snapshotLayerState(root: HTMLElement) {
  const nodes = Array.from(root.querySelectorAll<HTMLElement>("img, canvas, [data-preview-layer]")).map((element) => {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      tag: element.tagName,
      className: element.className,
      dataPreviewLayer: element.getAttribute("data-preview-layer"),
      src: element instanceof HTMLImageElement ? shortUrl(element.currentSrc || element.src) : null,
      backgroundImage: style.backgroundImage,
      display: style.display,
      opacity: style.opacity,
      visibility: style.visibility,
      transform: style.transform,
      clipPath: style.clipPath,
      maskImage: style.maskImage,
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    };
  });

  return {
    rootFound: Boolean(root),
    rootRect: (() => {
      const rect = root.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    })(),
    directChildren: root.children.length,
    descendantCount: root.querySelectorAll("*").length,
    imgCount: root.querySelectorAll("img").length,
    canvasCount: root.querySelectorAll("canvas").length,
    hasMockup: nodes.some((node) => String(node.src?.start || "").includes("/mockups/") || String(node.backgroundImage || "").includes("mockups")),
    hasArtwork: nodes.some((node) => !String(node.src?.start || "").includes("/mockups/") && node.tag === "IMG"),
    layers: nodes,
  };
}
function getPrintableCaptureLayer(side?: PreviewSide | null) {
  const selector = side
    ? `[data-printable-capture-layer="${side}"]`
    : "[data-printable-capture-layer]";
  const node = document.querySelector(selector);
  if (node instanceof HTMLElement) return node;

  // Backward compatible fallback for older mounted editor DOM.
  const legacy = document.getElementById("design-safe-area");
  return legacy instanceof HTMLElement ? legacy : null;
}

function assertNodeMatchesSide(node: HTMLElement, side?: PreviewSide | null) {
  if (!side) return true;
  const mountedSide = node.dataset.printableCaptureLayer;
  return !mountedSide || mountedSide === side;
}

function getLogicalSize(node: HTMLElement, data?: PreviewSideData | null) {
  const fallbackRect = node.getBoundingClientRect();
  const width = positiveNumber(
    node.dataset.logicalWidth || data?.safeArea?.width,
    positiveNumber(fallbackRect.width, EXPORT_MOCKUP_AREA.width),
  );
  const height = positiveNumber(
    node.dataset.logicalHeight || data?.safeArea?.height,
    positiveNumber(fallbackRect.height, EXPORT_MOCKUP_AREA.height),
  );

  return { width, height };
}

function getProductionSize(data: PreviewSideData) {
  const widthMm = positiveNumber(data.printSize?.widthMm, 0);
  const heightMm = positiveNumber(data.printSize?.heightMm, 0);
  if (widthMm && heightMm) {
    return {
      width: Math.round((widthMm / 25.4) * TARGET_PRINT_DPI),
      height: Math.round((heightMm / 25.4) * TARGET_PRINT_DPI),
    };
  }
  return {
    width: positiveNumber(data.exportResolution?.width, EXPORT_MOCKUP_AREA.width),
    height: positiveNumber(data.exportResolution?.height, EXPORT_MOCKUP_AREA.height),
  };
}

async function capturePrintableLayer(args: {
  data: PreviewSideData;
  production: boolean;
}) {
  if (typeof window === "undefined") return null;

  const source = getPrintableCaptureLayer(args.data.side);
  if (!source || !assertNodeMatchesSide(source, args.data.side)) return null;

  const logical = getLogicalSize(source, args.data);
  const output = args.production ? getProductionSize(args.data) : EXPORT_MOCKUP_AREA;
  const scaleX = args.production ? output.width / logical.width : 1;
  const scaleY = args.production ? output.height / logical.height : 1;
  const safeAreaOffsetX = args.production ? 0 : number(args.data.safeArea?.x, 0);
  const safeAreaOffsetY = args.production ? 0 : number(args.data.safeArea?.y, 0);

  const container = document.createElement("div");
  container.setAttribute(
    args.production
      ? "data-production-design-capture"
      : "data-preview-design-overlay-capture",
    "true",
  );
  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = `${output.width}px`;
  container.style.height = `${output.height}px`;
  container.style.overflow = "hidden";
  container.style.background = "transparent";
  container.style.pointerEvents = "none";
  container.style.zIndex = "-2147483647";
  container.style.isolation = "isolate";
  container.style.contain = "layout paint style size";

  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.setAttribute("data-production-safe-area-clone", "true");
  clone.style.position = "absolute";
  clone.style.left = `${safeAreaOffsetX}px`;
  clone.style.top = `${safeAreaOffsetY}px`;
  clone.style.width = `${logical.width}px`;
  clone.style.height = `${logical.height}px`;
  clone.style.transform = args.production ? `scale(${scaleX}, ${scaleY})` : "none";
  clone.style.transformOrigin = "top left";
  clone.style.margin = "0";
  clone.style.overflow = "hidden";
  clone.style.background = "transparent";
  clone.style.pointerEvents = "none";
  clone.style.contain = "layout paint style";
  clone.style.isolation = "isolate";

  prepareClonedImages(clone);
  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    await ensureRuntimeGoogleFonts(container);
    await waitForFonts();
    await nextFrame();
    await waitForImages(container, args.production);
    await nextFrame();

    return await toPng(container, {
      cacheBust: true,
      backgroundColor: "transparent",
      width: output.width,
      height: output.height,
      canvasWidth: output.width,
      canvasHeight: output.height,
      pixelRatio: 1,
      style: {
        margin: "0",
        transform: "none",
        transformOrigin: "top left",
      },
      filter: (target) => {
        if (!(target instanceof HTMLElement)) return true;
        return shouldCaptureNode(target);
      },
    });
  } catch {
    return null;
  } finally {
    container.remove();
  }
}

export async function capturePreviewDesignOverlay(data: PreviewSideData) {
  console.warn("[PREVIEW DIAGNOSTIC] function entered: capturePreviewDesignOverlay");
  // Visual preview overlay is a 1024x1024 transparent mockup-space PNG.
  // The safe-area DOM is cloned once and placed at the same safe-area coordinates
  // used by the editor/mockup. It is not rebuilt from elements[].
  return capturePrintableLayer({ data, production: false });
}


export async function captureProductionDesign(data: PreviewSideData) {
  console.warn("[PREVIEW DIAGNOSTIC] function entered: captureProductionDesign");
  // Production print files are high-resolution captures of the real preview DOM.
  // There is intentionally no Canvas fallback and no elements[] fallback.
  return capturePrintableLayer({ data, production: true });
}

export async function captureVisualMockupPreview(node: HTMLElement | null) {
  console.warn("[PREVIEW DIAGNOSTIC] function entered: captureVisualMockupPreview");
  if (!node) return null;

  const width = EXPORT_MOCKUP_AREA.width;
  const height = EXPORT_MOCKUP_AREA.height;

  const container = document.createElement("div");
  container.setAttribute("data-visual-mockup-capture", "true");
  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.overflow = "hidden";
  container.style.background = "transparent";
  container.style.pointerEvents = "none";
  container.style.zIndex = "-2147483647";
  container.style.isolation = "isolate";
  container.style.contain = "layout paint style size";

  const clone = node.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.setAttribute("data-visual-mockup-root-clone", "true");
  clone.style.position = "absolute";
  clone.style.left = "0";
  clone.style.top = "0";
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.transform = "none";
  clone.style.transformOrigin = "top left";
  clone.style.margin = "0";
  clone.style.pointerEvents = "none";
  clone.style.contain = "layout paint style size";

  prepareClonedImages(clone);
  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    await ensureRuntimeGoogleFonts(container);
    await waitForFonts();
    await nextFrame();
    await waitForImages(container);
    await nextFrame();

    return await toPng(container, {
      cacheBust: true,
      pixelRatio: 1,
      backgroundColor: "transparent",
      width,
      height,
      canvasWidth: width,
      canvasHeight: height,
      style: {
        margin: "0",
        transform: "none",
        transformOrigin: "top left",
      },
      filter: (target) => {
        if (!(target instanceof HTMLElement)) return true;
        return shouldCaptureNode(target);
      },
    });
  } catch {
    return null;
  } finally {
    container.remove();
  }
}


function getCaptureCrop(node: HTMLElement) {
  const rootRect = node.getBoundingClientRect();
  const candidates = [
    node.querySelector<HTMLElement>("[data-checkout-mockup-base]"),
    ...Array.from(node.querySelectorAll<HTMLElement>("[data-design-element-id]")),
  ].filter((item): item is HTMLElement => Boolean(item));

  const visibleRects = candidates
    .map((item) => item.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);

  if (!visibleRects.length) {
    const side = Math.min(node.offsetWidth, node.offsetHeight);
    return { x: 0, y: 0, width: side, height: side };
  }

  let left = Math.min(...visibleRects.map((rect) => rect.left - rootRect.left));
  let top = Math.min(...visibleRects.map((rect) => rect.top - rootRect.top));
  let right = Math.max(...visibleRects.map((rect) => rect.right - rootRect.left));
  let bottom = Math.max(...visibleRects.map((rect) => rect.bottom - rootRect.top));

  const contentWidth = Math.max(1, right - left);
  const contentHeight = Math.max(1, bottom - top);
  const margin = Math.max(contentWidth, contentHeight) * 0.08;
  left -= margin;
  top -= margin;
  right += margin;
  bottom += margin;

  const desiredSide = Math.min(
    Math.max(right - left, bottom - top),
    Math.min(node.offsetWidth, node.offsetHeight),
  );
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;
  let x = centerX - desiredSide / 2;
  let y = centerY - desiredSide / 2;

  x = Math.max(0, Math.min(x, node.offsetWidth - desiredSide));
  y = Math.max(0, Math.min(y, node.offsetHeight - desiredSide));

  return { x, y, width: desiredSide, height: desiredSide };
}

async function canvasToWebpBlob(canvas: HTMLCanvasElement, quality = 0.84) {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to encode checkout preview"))),
      "image/webp",
      quality,
    );
  });
}

export async function captureVisualMockupPreviewBlob(
  node: HTMLElement | null,
  debugElements: any[] = [],
) {
  if (!node) throw new Error("Checkout preview element not found");
  if (!node.isConnected) throw new Error("Checkout preview element is detached from the DOM");

  const computedStyle = window.getComputedStyle(node);
  if (
    computedStyle.display === "none" ||
    computedStyle.visibility === "hidden" ||
    computedStyle.opacity === "0"
  ) {
    throw new Error("Checkout preview element is not visible");
  }

  const previousTransform = node.style.transform;
  const previousTransformOrigin = node.style.transformOrigin;
  const previousWillChange = node.style.willChange;
  const restoreImages: Array<() => void> = [];

  try {
    await document.fonts.ready.catch(() => undefined);

    const expectedIds = debugElements
      .filter((element) => !element?.meta?.hidden)
      .map((element) => String(element?.id ?? ""))
      .filter(Boolean);

    await waitForStableCaptureState(node, expectedIds, 12_000);

    // Remove only the editor viewport pan/zoom. Product visualScale and all
    // artwork transforms remain inside the capture root.
    node.style.transform = "none";
    node.style.transformOrigin = "top left";
    node.style.willChange = "auto";
    await nextFrame();
    await nextFrame();
    await nextFrame();

    const width = node.offsetWidth;
    const height = node.offsetHeight;
    if (width <= 0 || height <= 0) {
      throw new Error(`Checkout preview has invalid dimensions: ${width}x${height}`);
    }

    // html-to-image reloads every <img> while serializing the DOM. Route
    // external raster images through Next's same-origin image endpoint so the
    // screenshot does not depend on R2/CORS. Invalid/empty image nodes are
    // hidden only for the capture and restored afterwards.
    const images = Array.from(node.querySelectorAll<HTMLImageElement>("img"));
    for (const image of images) {
      if (!image.isConnected || !node.isConnected || isPageTransitioning()) {
        throw new Error("Preview capture aborted during page transition");
      }

      const original = {
        src: image.getAttribute("src"),
        srcset: image.getAttribute("srcset"),
        sizes: image.getAttribute("sizes"),
        display: image.style.display,
        loading: image.getAttribute("loading"),
        decoding: image.getAttribute("decoding"),
      };

      restoreImages.push(() => {
        if (original.src === null) image.removeAttribute("src");
        else image.setAttribute("src", original.src);
        if (original.srcset === null) image.removeAttribute("srcset");
        else image.setAttribute("srcset", original.srcset);
        if (original.sizes === null) image.removeAttribute("sizes");
        else image.setAttribute("sizes", original.sizes);
        if (original.loading === null) image.removeAttribute("loading");
        else image.setAttribute("loading", original.loading);
        if (original.decoding === null) image.removeAttribute("decoding");
        else image.setAttribute("decoding", original.decoding);
        image.style.display = original.display;
      });

      const explicitSrc = String(image.getAttribute("src") || "").trim();
      const currentSrc = String(image.currentSrc || "").trim();
      const source = isUsableImageSource(currentSrc)
        ? currentSrc
        : isUsableImageSource(explicitSrc)
          ? explicitSrc
          : "";

      if (!source || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
        image.style.display = "none";
        image.removeAttribute("src");
        image.removeAttribute("srcset");
        image.removeAttribute("sizes");
        continue;
      }

      image.loading = "eager";
      image.decoding = "sync";
      image.removeAttribute("srcset");
      image.removeAttribute("sizes");

      try {
        const isInlineSource = source.startsWith("data:") || source.startsWith("blob:");
        const parsed = isInlineSource ? null : new URL(source, window.location.href);
        const isExternal = Boolean(parsed && parsed.origin !== window.location.origin);

        ensureCaptureStillAlive(node);

        if (isInlineSource) {
          // Inline SVG/data URLs and blob URLs are already browser-ready.
          // Never send them through the HTTP proxy: the proxy intentionally
          // accepts only remote http(s) image URLs.
          image.setAttribute("src", source);
          if (source.startsWith("blob:")) {
            await image.decode().catch(() => undefined);
          }
        } else if (isExternal && parsed) {
          // html-to-image serializes the DOM and reloads external images. Use a
          // dedicated same-origin proxy, then embed the returned bytes as a
          // data URL. This avoids both R2 CORS restrictions and Next/Image 404s.
          const response = await fetch(
            `/api/checkout/image-proxy?url=${encodeURIComponent(parsed.href)}`,
            { cache: "no-store" },
          );
          ensureCaptureStillAlive(node);
          if (!response.ok) {
            throw new Error(`Preview image proxy failed (${response.status}): ${parsed.href}`);
          }

          const blob = await response.blob();
          ensureCaptureStillAlive(node);
          if (!blob.type.startsWith("image/") || blob.size === 0) {
            throw new Error(`Preview image proxy returned invalid content: ${parsed.href}`);
          }

          const dataUrl = await blobToDataUrl(blob);
          ensureCaptureStillAlive(node);
          image.setAttribute("src", dataUrl);
          await Promise.race([
            image.decode(),
            delay(6_000).then(() => {
              throw new Error(`Preview image decode timed out: ${parsed.href}`);
            }),
          ]);
        } else {
          image.setAttribute("src", source);
        }
        ensureCaptureStillAlive(node);
      } catch (error) {
        if (error instanceof Error && error.message === "Preview capture aborted during page transition") {
          throw error;
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    }

    ensureCaptureStillAlive(node);
    await nextFrame();

    const crop = getCaptureCrop(node);
    const captureOptions = {
      cacheBust: false,
      includeQueryParams: true,
      pixelRatio: 1,
      backgroundColor: "transparent",
      width,
      height,
      canvasWidth: width,
      canvasHeight: height,
      style: { margin: "0" },
      filter: (target: HTMLElement) => {
        if (!(target instanceof HTMLElement)) return true;
        if (target instanceof HTMLImageElement && target.style.display === "none") {
          return false;
        }
        return shouldCaptureNode(target);
      },
    } as const;

    let sourceCanvas: HTMLCanvasElement;
    try {
      ensureCaptureStillAlive(node);
      sourceCanvas = await withTimeout(
        toCanvas(node, captureOptions),
        CHECKOUT_PREVIEW_TIMEOUT_MS,
        "Checkout preview capture",
      );
    } catch (firstError) {
      if (firstError instanceof Error && firstError.message === "Preview capture aborted during page transition") {
        throw firstError;
      }
      await nextFrame();
      await nextFrame();
      try {
        ensureCaptureStillAlive(node);
        sourceCanvas = await withTimeout(
          toCanvas(node, captureOptions),
          CHECKOUT_PREVIEW_TIMEOUT_MS,
          "Checkout preview capture retry",
        );
      } catch (retryError) {
        if (retryError instanceof Error && retryError.message === "Preview capture aborted during page transition") {
          throw retryError;
        }
        throw normalizeCaptureFailure(retryError ?? firstError);
      }
    }

    const outputSize = 900;
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = outputSize;
    outputCanvas.height = outputSize;
    const context = outputCanvas.getContext("2d");
    if (!context) throw new Error("Could not create checkout preview canvas context");
    context.clearRect(0, 0, outputSize, outputSize);
    context.drawImage(
      sourceCanvas,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      outputSize,
      outputSize,
    );

    const blob = await canvasToWebpBlob(outputCanvas, 0.84);
    if (!blob.size) throw new Error("Checkout preview produced an empty blob");
    return blob;
  } finally {
    for (const restore of restoreImages.reverse()) restore();
    node.style.transform = previousTransform;
    node.style.transformOrigin = previousTransformOrigin;
    node.style.willChange = previousWillChange;
  }
}

export async function captureProductionPreview(node: HTMLElement | null) {
  console.warn("[PREVIEW DIAGNOSTIC] function entered: captureProductionPreview");
  if (!node) return null;

  try {
    await ensureRuntimeGoogleFonts(node);
    await waitForFonts();
    await nextFrame();
    await waitForImages(node);
    await nextFrame();

    return await toPng(node, {
      cacheBust: true,
      pixelRatio: 1,
      backgroundColor: "transparent",
      filter: (target) => {
        if (!(target instanceof HTMLElement)) return true;
        return shouldCaptureNode(target);
      },
    });
  } catch {
    return null;
  }
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  console.warn("[PREVIEW DIAGNOSTIC] function entered: downloadDataUrl");
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
