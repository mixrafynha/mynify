import { toPng } from "html-to-image";
import { EXPORT_MOCKUP_AREA } from "../../canvas/constants";
import type { PreviewSide, PreviewSideData } from "../types/preview";

const CAPTURE_HIDDEN_SELECTORS = [
  "[data-element-control]",
  "[data-resize-handle]",
  "[data-warning-frame]",
  "[data-editor-only]",
  "[data-selection-frame]",
  "[data-gelato-dropzone]",
  "[data-production-hidden]",
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

function waitForImages(container: HTMLElement) {
  const images = Array.from(container.querySelectorAll("img"));
  if (!images.length) return Promise.resolve();

  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }

          const done = () => {
            img.removeEventListener("load", done);
            img.removeEventListener("error", done);
            resolve();
          };

          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        }),
    ),
  ).then(() => undefined);
}

function shouldCaptureNode(target: HTMLElement) {
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
    await waitForImages(container);
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
