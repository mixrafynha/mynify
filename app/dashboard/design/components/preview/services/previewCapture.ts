import { toPng } from "html-to-image";
import { EXPORT_MOCKUP_AREA } from "../../canvas/constants";
import { getTextPadding } from "../../canvas/canvasMath";
import type { PreviewElement, PreviewSideData } from "../types/preview";

const CAPTURE_HIDDEN_SELECTORS = [
  "[data-element-control]",
  "[data-resize-handle]",
  "[data-warning-frame]",
  "[data-editor-only]",
  "[data-selection-frame]",
];

const FONT_MAP: Record<string, string> = {
  Anton: "var(--font-anton)",
  "Bebas Neue": "var(--font-bebas)",
  Orbitron: "var(--font-orbitron)",
  "Playfair Display": "var(--font-playfair)",
  Poppins: "var(--font-poppins)",
  Cinzel: "var(--font-cinzel)",
  "DM Serif Display": "var(--font-dm-serif)",
  "Space Grotesk": "var(--font-space)",
  "Rubik Mono One": "var(--font-rubik-mono)",
};

function resolveFontFamily(font?: string): string {
  if (!font) return "var(--font-poppins), Arial, sans-serif";
  return `${FONT_MAP[font] || `"${font}"`}, Arial, sans-serif`;
}

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

function getEditorSafeAreaNode() {
  const node = document.getElementById("design-safe-area");
  return node instanceof HTMLElement ? node : null;
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

async function captureEditorDomAsProductionPng(data: PreviewSideData) {
  const source = getEditorSafeAreaNode();
  if (!source) return null;

  const width = EXPORT_MOCKUP_AREA.width;
  const height = EXPORT_MOCKUP_AREA.height;
  const safeArea = data.safeArea || { x: 0, y: 0, width, height };
  const safeX = number(safeArea.x);
  const safeY = number(safeArea.y);
  const safeWidth = positiveNumber(safeArea.width, width);
  const safeHeight = positiveNumber(safeArea.height, height);

  const container = document.createElement("div");
  container.setAttribute("data-production-design-capture", "true");
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

  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.setAttribute("data-production-safe-area-clone", "true");
  clone.style.position = "absolute";
  clone.style.left = `${safeX}px`;
  clone.style.top = `${safeY}px`;
  clone.style.width = `${safeWidth}px`;
  clone.style.height = `${safeHeight}px`;
  clone.style.transform = "none";
  clone.style.transformOrigin = "top left";
  clone.style.overflow = "hidden";
  clone.style.pointerEvents = "none";
  clone.style.background = "transparent";
  clone.style.contain = "layout paint style";

  prepareClonedImages(clone);
  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    await document.fonts?.ready?.catch?.(() => undefined);
    await nextFrame();
    await waitForImages(container);
    await nextFrame();

    return await toPng(container, {
      cacheBust: true,
      pixelRatio: 1,
      backgroundColor: "transparent",
      width,
      height,
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
  } catch (error) {
    console.error("EDITOR DOM CAPTURE FAILED:", error);
    return null;
  } finally {
    container.remove();
  }
}

function createExportNode(el: PreviewElement) {
  const hasImageSource = Boolean(
    el.src || el.meta?.src || el.meta?.image || el.meta?.url,
  );

  const isImage = el.type === "image" || hasImageSource;
  const node = document.createElement(isImage ? "img" : "div");

  const width = Math.max(1, number(el.width ?? el.meta?.width, 1));
  const height = Math.max(1, number(el.height ?? el.meta?.height, 1));
  const x = number(el.x);
  const y = number(el.y);
  const rotation = number(el.meta?.rotation);
  const flipX = el.meta?.flipX ? -1 : 1;

  node.style.position = "absolute";
  node.style.left = "0";
  node.style.top = "0";
  node.style.width = `${width}px`;
  node.style.height = `${height}px`;
  node.style.zIndex = `${number(el.zIndex, 10)}`;
  node.style.opacity = `${number(el.meta?.opacity, 1)}`;
  node.style.transformOrigin = "center center";
  node.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${flipX}, 1)`;
  node.style.boxSizing = "border-box";
  node.style.userSelect = "none";
  node.style.margin = "0";

  if (isImage && node instanceof HTMLImageElement) {
    node.crossOrigin = "anonymous";
    node.referrerPolicy = "no-referrer";
    node.decoding = "sync";
    node.loading = "eager";
    node.alt = "";
    node.src = String(
      el.src || el.meta?.src || el.meta?.image || el.meta?.url || "",
    );
    node.style.display = "block";
    node.style.width = `${width}px`;
    node.style.height = `${height}px`;
    node.style.objectFit = String(el.meta?.objectFit || "fill");
    node.style.filter = `brightness(${number(
      el.meta?.brightness,
      100,
    )}%) contrast(${number(el.meta?.contrast, 100)}%) saturate(${number(
      el.meta?.saturation,
      100,
    )}%)`;
    return node;
  }

  if (el.type === "shape") {
    node.style.backgroundColor = String(
      el.meta?.color || el.meta?.fill || "#8b5cf6",
    );

    if (el.meta?.strokeWidth) {
      node.style.border = `${number(el.meta.strokeWidth)}px solid ${
        el.meta?.strokeColor || "#ffffff"
      }`;
    }

    if (el.meta?.shadow) {
      node.style.boxShadow = `0 12px 32px ${
        el.meta?.shadowColor || "rgba(0,0,0,.32)"
      }`;
    }

    return node;
  }

  const content = String(el.text || el.content || "")
    .normalize("NFKC")
    .replace(/[<>]/g, "")
    .slice(0, 300);

  const fontSize = Math.max(8, number(el.meta?.fontSize ?? el.fontSize, 40));

  const lineHeight = number(el.meta?.lineHeight, 1.16);
  const padding = getTextPadding(fontSize, el.meta || {});

  node.textContent = content || "Text";
  node.style.display = "flex";
  node.style.alignItems = "center";
  node.style.justifyContent = "center";
  node.style.whiteSpace = "pre-wrap";
  node.style.overflowWrap = "break-word";
  node.style.wordBreak = "break-word";
  node.style.overflow = "visible";
  node.style.textAlign = String(el.meta?.textAlign || "center");
  node.style.fontFamily = resolveFontFamily(
    el.meta?.fontFamily || el.fontFamily,
  );
  node.style.fontSize = `${fontSize}px`;
  node.style.fontWeight = `${el.meta?.fontWeight || 700}`;
  node.style.lineHeight = `${lineHeight}`;
  node.style.letterSpacing = `${el.meta?.letterSpacing ?? 0}px`;
  node.style.color = String(el.meta?.color || "#000000");
  node.style.padding = `${padding.y}px ${padding.x}px`;
  node.style.background = el.meta?.gradient
    ? `linear-gradient(90deg, ${el.meta?.gradientFrom || "#8b5cf6"}, ${
        el.meta?.gradientTo || "#22d3ee"
      })`
    : "";
  node.style.textShadow = el.meta?.shadow
    ? `0 8px 18px ${el.meta?.shadowColor || "rgba(0,0,0,.35)"}`
    : el.meta?.glow
      ? `0 0 18px ${el.meta?.glowColor || el.meta?.color || "#8b5cf6"}`
      : "";

  (
    node.style as CSSStyleDeclaration & {
      webkitTextStroke?: string;
      webkitFontSmoothing?: string;
      MozOsxFontSmoothing?: string;
      webkitBackgroundClip?: string;
      webkitTextFillColor?: string;
    }
  ).webkitFontSmoothing = "antialiased";

  (
    node.style as CSSStyleDeclaration & {
      MozOsxFontSmoothing?: string;
    }
  ).MozOsxFontSmoothing = "grayscale";

  if (el.meta?.strokeWidth) {
    (
      node.style as CSSStyleDeclaration & { webkitTextStroke?: string }
    ).webkitTextStroke = `${number(el.meta.strokeWidth)}px ${
      el.meta?.strokeColor || "#000000"
    }`;
  }

  if (el.meta?.gradient) {
    (
      node.style as CSSStyleDeclaration & {
        webkitBackgroundClip?: string;
        webkitTextFillColor?: string;
      }
    ).webkitBackgroundClip = "text";

    (
      node.style as CSSStyleDeclaration & {
        webkitBackgroundClip?: string;
        webkitTextFillColor?: string;
      }
    ).webkitTextFillColor = "transparent";
  }

  return node;
}

function shouldCaptureNode(target: HTMLElement) {
  return !CAPTURE_HIDDEN_SELECTORS.some(
    (selector) => target.matches(selector) || Boolean(target.closest(selector)),
  );
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
    await document.fonts?.ready?.catch?.(() => undefined);
    await nextFrame();
    await waitForImages(container);
    await nextFrame();

    return await toPng(container, {
      cacheBust: true,
      pixelRatio: 1,
      backgroundColor: "transparent",
      width,
      height,
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
  } catch (error) {
    console.error("CAPTURE VISUAL MOCKUP FAILED:", error);
    return null;
  } finally {
    container.remove();
  }
}


export async function captureProductionPreview(node: HTMLElement | null) {
  if (!node) return null;

  try {
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
  } catch (error) {
    console.error("CAPTURE PREVIEW FAILED:", error);
    return null;
  }
}

export async function captureProductionDesign(
  data: PreviewSideData,
  options: { preferDom?: boolean } = {},
) {
  if (typeof window === "undefined") return null;

  if (options.preferDom !== false) {
    const domImage = await captureEditorDomAsProductionPng(data);
    if (domImage) return domImage;
  }

  const width = EXPORT_MOCKUP_AREA.width;
  const height = EXPORT_MOCKUP_AREA.height;

  const safeArea = data.safeArea || {
    x: 0,
    y: 0,
    width,
    height,
  };

  const safeX = number(safeArea.x);
  const safeY = number(safeArea.y);
  const safeWidth = positiveNumber(safeArea.width, width);
  const safeHeight = positiveNumber(safeArea.height, height);

  const container = document.createElement("div");
  container.setAttribute("data-production-design-capture", "true");
  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.overflow = "hidden";
  container.style.background = "transparent";
  container.style.pointerEvents = "none";
  container.style.zIndex = "-2147483647";
  container.style.contain = "layout paint style";
  container.style.isolation = "isolate";

  const safeLayer = document.createElement("div");
  safeLayer.setAttribute("data-production-safe-area", "true");
  safeLayer.style.position = "absolute";
  safeLayer.style.left = `${safeX}px`;
  safeLayer.style.top = `${safeY}px`;
  safeLayer.style.width = `${safeWidth}px`;
  safeLayer.style.height = `${safeHeight}px`;
  safeLayer.style.overflow = "hidden";
  safeLayer.style.background = "transparent";
  safeLayer.style.pointerEvents = "none";
  safeLayer.style.contain = "layout paint style";
  safeLayer.style.isolation = "isolate";

  const sorted = [...(Array.isArray(data.elements) ? data.elements : [])]
    .filter((el) => !el.meta?.hidden)
    .sort((a, b) => number(a.zIndex) - number(b.zIndex));

  sorted.forEach((el) => {
    safeLayer.appendChild(
      createExportNode({
        ...el,
        x: number(el.x),
        y: number(el.y),
      }),
    );
  });

  container.appendChild(safeLayer);
  document.body.appendChild(container);

  try {
    await nextFrame();
    await waitForImages(container);
    await nextFrame();

    return await toPng(container, {
      cacheBust: true,
      pixelRatio: 1,
      backgroundColor: "transparent",
      width,
      height,
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
  } finally {
    container.remove();
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
