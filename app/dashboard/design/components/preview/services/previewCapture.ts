import { toBlob, toCanvas, toPng } from "html-to-image";
import { EXPORT_MOCKUP_AREA } from "../../canvas/constants";
import type { PreviewSide, PreviewSideData } from "../types/preview";
import { TARGET_PRINT_DPI } from "../../canvas/engine/dpi";

const CHECKOUT_PREVIEW_SIZE = 384;
const CHECKOUT_PREVIEW_PIXEL_RATIO = 1;
const CHECKOUT_PREVIEW_QUALITY = 0.72;
const CHECKOUT_PREVIEW_TIMEOUT_MS = 12_000;
const CHECKOUT_PREVIEW_IMAGE_WAIT_TIMEOUT_MS = 3_000;

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
  "[data-outside-print-area='true']",
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

async function waitForFonts() {
  await document.fonts?.ready?.catch?.(() => undefined);
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
  return value.trim().replace(/^['"]|['"]$/g, "");
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

function describeCaptureError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  if (error instanceof Event) {
    const target = error.target;

    if (target instanceof HTMLImageElement) {
      return `Image event: src=${target.currentSrc || target.src}, complete=${target.complete}, naturalWidth=${target.naturalWidth}, naturalHeight=${target.naturalHeight}`;
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
        const src = target.currentSrc || target.src || "";
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
    const src = target.currentSrc || target.src || "";
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
  logLayerSnapshot("clone-before-append", clone);
  container.appendChild(clone);
  logLayerSnapshot("clone-after-append", clone);
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
  // Visual preview overlay is a 1024x1024 transparent mockup-space PNG.
  // The safe-area DOM is cloned once and placed at the same safe-area coordinates
  // used by the editor/mockup. It is not rebuilt from elements[].
  return capturePrintableLayer({ data, production: false });
}


export async function captureProductionDesign(data: PreviewSideData) {
  // Production print files are high-resolution captures of the real preview DOM.
  // There is intentionally no Canvas fallback and no elements[] fallback.
  return capturePrintableLayer({ data, production: true });
}

export async function captureVisualMockupPreview(node: HTMLElement | null) {
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
  logLayerSnapshot("clone-before-append", clone);
  container.appendChild(clone);
  logLayerSnapshot("clone-after-append", clone);
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

export async function captureVisualMockupPreviewBlob(
  node: HTMLElement | null,
) {
  if (!node) {
    throw new Error("Front preview element not found");
  }

  if (!node.isConnected) {
    throw new Error("Front preview element is detached from the DOM");
  }

  const computedStyle = window.getComputedStyle(node);
  if (
    computedStyle.display === "none" ||
    computedStyle.visibility === "hidden" ||
    computedStyle.opacity === "0"
  ) {
    throw new Error("Front preview element is not visible");
  }

  const rect = node.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    throw new Error(`Front preview has invalid dimensions: ${rect.width}x${rect.height}`);
  }

  const sourceImages = Array.from(node.querySelectorAll("img"));
  const imageDiagnostics = Array.from(
    node.querySelectorAll<HTMLImageElement>("img"),
  ).map((img, index) => ({
    index,
    srcAttribute: img.getAttribute("src"),
    src: img.src,
    currentSrc: img.currentSrc,
    alt: img.alt,
    className: img.className,
    complete: img.complete,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    excludedByFilter: !captureFilterForDiagnostics(img),
    outerHTML: img.outerHTML.slice(0, 500),
  }));
  console.info("[preview-capture] images before export", {
    side: (node.dataset.mockupExportRoot || "front") as string,
    images: imageDiagnostics,
  });
  console.info("[preview-capture] mockup background", {
    side: (node.dataset.mockupExportRoot || "front") as string,
    backgroundImage: window.getComputedStyle(node).backgroundImage,
  });
  console.info("[checkout-preview:export-root-after-artwork]", {
    side: (node.dataset.mockupExportRoot || "front") as string,
    ...snapshotLayerState(node),
  });
  logLayerSnapshot("original", node);
  await document.fonts.ready;
  await Promise.all(
    sourceImages.map(async (image) => {
      if (image.complete && image.naturalWidth > 0) return;
      await image.decode().catch(() => undefined);
    }),
  );
  const invalidImages = Array.from(node.querySelectorAll<HTMLImageElement>("img")).filter(
    (img) =>
      !img.currentSrc ||
      img.naturalWidth <= 0 ||
      img.naturalHeight <= 0,
  );
  console.info("[preview-capture] invalid images", {
    side: (node.dataset.mockupExportRoot || "front") as string,
    images: invalidImages.map((img) => ({
      src: img.src,
      currentSrc: img.currentSrc,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    })),
  });
  await validateCaptureImages(node);

  console.info("[preview-capture] node ready", {
    side: (node.dataset.mockupExportRoot || "front") as string,
    width: rect.width,
    height: rect.height,
    imageCount: sourceImages.length,
  });

  const container = document.createElement("div");
  container.setAttribute("data-visual-mockup-capture", "true");
  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = `${CHECKOUT_PREVIEW_SIZE}px`;
  container.style.height = `${CHECKOUT_PREVIEW_SIZE}px`;
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
  clone.style.width = `${CHECKOUT_PREVIEW_SIZE}px`;
  clone.style.height = `${CHECKOUT_PREVIEW_SIZE}px`;
  clone.style.transform = "none";
  clone.style.transformOrigin = "top left";
  clone.style.margin = "0";
  clone.style.pointerEvents = "none";
  clone.style.contain = "layout paint style size";

  prepareClonedImages(clone);
  console.info("[checkout-preview:clone-state]", {
    side: (node.dataset.mockupExportRoot || "front") as string,
    original: snapshotLayerState(node),
    clone: snapshotLayerState(clone),
  });
  logLayerSnapshot("clone-before-append", clone);
  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    await ensureRuntimeGoogleFonts(container);
    await waitForFonts();
    await nextFrame();
    logLayerSnapshot("clone-after-append", clone);
    await withTimeout(
      waitForImages(container),
      CHECKOUT_PREVIEW_IMAGE_WAIT_TIMEOUT_MS,
      "Checkout preview image wait",
    ).catch((error) => {
      console.warn("[preview-capture] image wait skipped", {
        side: (node.dataset.mockupExportRoot || "front") as string,
        error: describeCaptureError(error),
      });
    });
    await nextFrame();

    const captureOptions = buildCaptureOptions(
      CHECKOUT_PREVIEW_SIZE,
      CHECKOUT_PREVIEW_SIZE,
    );
    let blob: Blob | null = null;

    try {
      console.info("[preview-capture] toBlob started", {
        side: (node.dataset.mockupExportRoot || "front") as string,
      });
      console.info("[checkout-preview:before-capture]", {
        side: (node.dataset.mockupExportRoot || "front") as string,
        original: snapshotLayerState(node),
        clone: snapshotLayerState(clone),
      });
      const sourceCanvas = await toCanvas(container, captureOptions);
      console.info("[preview-capture] toBlob completed", {
        side: (node.dataset.mockupExportRoot || "front") as string,
      });

      const outputSize = CHECKOUT_PREVIEW_SIZE;
      const padding = 28;
      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = outputSize;
      outputCanvas.height = outputSize;

      const ctx = outputCanvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas context unavailable");
      }

      const availableSize = outputSize - padding * 2;
      const scale = Math.min(
        availableSize / sourceCanvas.width,
        availableSize / sourceCanvas.height,
      );
      const drawWidth = sourceCanvas.width * scale;
      const drawHeight = sourceCanvas.height * scale;
      const offsetX = (outputSize - drawWidth) / 2;
      const offsetY = (outputSize - drawHeight) / 2;

      ctx.clearRect(0, 0, outputSize, outputSize);
      ctx.drawImage(sourceCanvas, offsetX, offsetY, drawWidth, drawHeight);

      blob = await new Promise<Blob | null>((resolve) => {
        outputCanvas.toBlob(resolve, "image/webp", CHECKOUT_PREVIEW_QUALITY);
      });
    } catch (firstError) {
      console.warn("[preview-capture] toBlob failed", {
        side: (node.dataset.mockupExportRoot || "front") as string,
        error: describeCaptureError(firstError),
      });

      try {
        console.info("[preview-capture] toCanvas started", {
          side: (node.dataset.mockupExportRoot || "front") as string,
        });
        const canvas = await toCanvas(container, captureOptions);
        console.info("[preview-capture] toCanvas completed", {
          side: (node.dataset.mockupExportRoot || "front") as string,
        });
        const outputSize = CHECKOUT_PREVIEW_SIZE;
        const padding = 28;
        const outputCanvas = document.createElement("canvas");
        outputCanvas.width = outputSize;
        outputCanvas.height = outputSize;

        const ctx = outputCanvas.getContext("2d");
        if (!ctx) {
          throw new Error("Canvas context unavailable");
        }

        const availableSize = outputSize - padding * 2;
        const scale = Math.min(
          availableSize / canvas.width,
          availableSize / canvas.height,
        );
        const drawWidth = canvas.width * scale;
        const drawHeight = canvas.height * scale;
        const offsetX = (outputSize - drawWidth) / 2;
        const offsetY = (outputSize - drawHeight) / 2;

        ctx.clearRect(0, 0, outputSize, outputSize);
        ctx.drawImage(canvas, offsetX, offsetY, drawWidth, drawHeight);

        blob = await new Promise<Blob | null>((resolve) => {
          outputCanvas.toBlob(resolve, "image/webp", CHECKOUT_PREVIEW_QUALITY);
        });
      } catch (secondError) {
        console.warn("[preview-capture] toCanvas failed", {
          side: (node.dataset.mockupExportRoot || "front") as string,
          error: describeCaptureError(secondError),
        });
        throw new Error(
          `Preview capture failed. toBlob=${describeCaptureError(firstError)}; toCanvas=${describeCaptureError(secondError)}`,
        );
      }
    }

    if (!(blob instanceof Blob) || blob.size === 0) {
      throw new Error("Preview capture produced an empty blob");
    }

    console.info("[preview-capture] blob created", {
      side: (node.dataset.mockupExportRoot || "front") as string,
      size: blob.size,
      type: blob.type,
      width: CHECKOUT_PREVIEW_SIZE,
      height: CHECKOUT_PREVIEW_SIZE,
    });
    console.info("[checkout-preview:blob-result]", {
      side: (node.dataset.mockupExportRoot || "front") as string,
      blobSize: blob.size,
      blobType: blob.type,
      width: CHECKOUT_PREVIEW_SIZE,
      height: CHECKOUT_PREVIEW_SIZE,
      mockupFoundBeforeCapture: snapshotLayerState(node).hasMockup,
      artworkFoundBeforeCapture: snapshotLayerState(node).hasArtwork,
      mockupFoundInClone: snapshotLayerState(clone).hasMockup,
      artworkFoundInClone: snapshotLayerState(clone).hasArtwork,
    });

    return blob;
  } catch (error) {
    const message = describeCaptureError(error);
    if (/Front preview element not found/i.test(message)) {
      throw error;
    }
    if (/invalid dimensions/i.test(message)) {
      throw error;
    }
    if (/not visible/i.test(message)) {
      throw error;
    }
    if (/empty blob/i.test(message)) {
      throw error;
    }
    if (/tainted|cors|cross-origin/i.test(message)) {
      throw new Error(`Front preview capture failed due to image CORS: ${message}`);
    }
    throw new Error(`Front preview capture failed: ${message}`);
  } finally {
    container.remove();
  }
}

export async function captureProductionPreview(node: HTMLElement | null) {
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
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
