import sharp from "sharp";
import { chromium } from "playwright";

export type DesignSide = "front" | "back";

type Box = { x?: number; y?: number; width?: number; height?: number };
type RenderElement = Record<string, any> & {
  id?: string;
  type?: "image" | "text" | "shape" | string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  src?: string;
  text?: string;
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  fill?: string;
  zIndex?: number;
  meta?: Record<string, any>;
};

type SideData = {
  elements?: RenderElement[];
  safeArea?: Box;
  printBox?: Box;
  mockupUrl?: string | null;
};

type DesignData = {
  productId?: string;
  category?: string;
  mockupColor?: string;
  color?: string;
  sides?: Partial<Record<DesignSide, SideData>>;
  mockupUrls?: Partial<Record<DesignSide, string | null>>;
  production?: {
    printSizeMm?: Partial<Record<DesignSide, { widthMm?: number; heightMm?: number }>>;
  };
};

const DEFAULT_PRINT_DPI = 300;
const CHECKOUT_SIZE = 1024;
const MIN_SIZE = 1;

function n(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function positive(value: unknown, fallback: number) {
  return Math.max(MIN_SIZE, n(value, fallback));
}

function round(value: number) {
  return Math.round(value);
}

function hasArtwork(elements: RenderElement[]) {
  return elements.some((el) => el && !el.meta?.hidden && ["image", "text", "shape"].includes(String(el.type || "")));
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cssString(value: unknown, fallback = "") {
  return String(value ?? fallback).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function getElementWidth(el: RenderElement) {
  return positive(el.width, el.type === "shape" ? 120 : 140);
}

function getElementHeight(el: RenderElement) {
  return positive(el.height, el.type === "shape" ? 120 : 140);
}

function getPrintPixelSize(design: DesignData, side: DesignSide, sideData: SideData) {
  const configured = design.production?.printSizeMm?.[side];
  const widthMm = n(configured?.widthMm, 0);
  const heightMm = n(configured?.heightMm, 0);

  if (widthMm > 0 && heightMm > 0) {
    return {
      width: Math.max(1, round((widthMm / 25.4) * DEFAULT_PRINT_DPI)),
      height: Math.max(1, round((heightMm / 25.4) * DEFAULT_PRINT_DPI)),
    };
  }

  const safeArea = sideData.safeArea || sideData.printBox || {};
  return {
    width: round(positive(safeArea.width, 3000)),
    height: round(positive(safeArea.height, 3000)),
  };
}

function normalizeElements(elements: unknown): RenderElement[] {
  return (Array.isArray(elements) ? elements : [])
    .filter((el: any) => el && typeof el === "object" && !el.meta?.hidden)
    .sort((a: any, b: any) => n(a.zIndex, 0) - n(b.zIndex, 0));
}

function collectGoogleFontFamilies(elements: RenderElement[]) {
  const families = new Set<string>();
  for (const el of elements) {
    if (el.type !== "text") continue;
    const family = String(el.meta?.fontFamily || el.fontFamily || "").trim();
    if (!family) continue;
    if (/^(arial|sans-serif|serif|monospace|system-ui)$/i.test(family)) continue;
    families.add(family.replace(/["']/g, ""));
  }
  return Array.from(families);
}

function googleFontsLinks(elements: RenderElement[]) {
  const families = collectGoogleFontFamilies(elements);
  if (!families.length) return "";

  return families
    .map((family) => {
      const encoded = encodeURIComponent(family).replace(/%20/g, "+");
      return `<link href="https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">`;
    })
    .join("\n");
}

function renderElementHtml(el: RenderElement, scaleX: number, scaleY: number) {
  const type = String(el.type || "");
  const width = getElementWidth(el) * scaleX;
  const height = getElementHeight(el) * scaleY;
  const left = n(el.x, 0) * scaleX;
  const top = n(el.y, 0) * scaleY;
  const rotation = n(el.meta?.rotation ?? el.rotation, 0);
  const opacity = Math.max(0, Math.min(1, n(el.opacity ?? el.meta?.opacity, 1)));
  const flipX = !!(el.flipX || el.meta?.flipX);
  const flipY = !!(el.flipY || el.meta?.flipY);
  const transform = `rotate(${rotation}deg) scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`;

  const baseStyle = [
    "position:absolute",
    `left:${left}px`,
    `top:${top}px`,
    `width:${width}px`,
    `height:${height}px`,
    `opacity:${opacity}`,
    `transform:${transform}`,
    "transform-origin:center center",
    "box-sizing:border-box",
    "overflow:visible",
  ].join(";");

  if (type === "image") {
    const src = typeof el.src === "string" ? el.src : "";
    if (!src) return "";
    const brightness = n(el.meta?.brightness, 100);
    const contrast = n(el.meta?.contrast, 100);
    const saturation = n(el.meta?.saturation, 100);
    return `<div style="${baseStyle}"><img src="${escapeHtml(src)}" style="display:block;width:100%;height:100%;object-fit:fill;filter:brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%);" /></div>`;
  }

  if (type === "shape") {
    const fill = el.meta?.color || el.meta?.fill || el.fill || el.color || "#8b5cf6";
    const strokeWidth = n(el.meta?.strokeWidth, 0) * Math.min(scaleX, scaleY);
    const strokeColor = el.meta?.strokeColor || "#ffffff";
    const borderRadius = n(el.borderRadius ?? el.meta?.borderRadius, 0) * Math.min(scaleX, scaleY);
    return `<div style="${baseStyle};background:${escapeHtml(fill)};border-radius:${borderRadius}px;${strokeWidth ? `border:${strokeWidth}px solid ${escapeHtml(strokeColor)};` : ""}"></div>`;
  }

  if (type === "text") {
    const text = escapeHtml(el.text ?? el.content ?? "Text").replace(/\n/g, "<br />");
    const fontSize = Math.max(8, n(el.meta?.fontSize ?? el.fontSize, 40) * Math.min(scaleX, scaleY));
    const fontFamily = cssString(el.meta?.fontFamily || el.fontFamily || "Arial");
    const fontWeight = el.meta?.fontWeight || el.fontWeight || 700;
    const fontStyle = el.meta?.fontStyle || el.fontStyle || "normal";
    const lineHeight = n(el.meta?.lineHeight, 1.16);
    const letterSpacing = n(el.meta?.letterSpacing, 0) * scaleX;
    const color = el.meta?.color || el.color || "#000000";
    const textAlign = el.meta?.textAlign || el.textAlign || "center";
    const paddingX = Math.max(4 * Math.min(scaleX, scaleY), n(el.meta?.paddingX, Math.ceil(fontSize * 0.28)));
    const paddingY = Math.max(4 * Math.min(scaleX, scaleY), n(el.meta?.paddingY, Math.ceil(fontSize * 0.26)));
    const strokeWidth = n(el.meta?.strokeWidth, 0) * Math.min(scaleX, scaleY);
    const strokeColor = el.meta?.strokeColor || "#000000";
    const shadow = el.meta?.shadow ? `text-shadow:0 ${8 * scaleY}px ${18 * scaleY}px ${escapeHtml(el.meta?.shadowColor || "rgba(0,0,0,.35)")};` : "";

    return `<div style="${baseStyle};display:flex;align-items:center;justify-content:center;white-space:pre-wrap;word-break:break-word;text-align:${escapeHtml(textAlign)};font-family:&quot;${fontFamily}&quot;, Arial, sans-serif;font-size:${fontSize}px;font-weight:${escapeHtml(fontWeight)};font-style:${escapeHtml(fontStyle)};line-height:${lineHeight};letter-spacing:${letterSpacing}px;color:${escapeHtml(color)};padding:${paddingY}px ${paddingX}px;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;${strokeWidth ? `-webkit-text-stroke:${strokeWidth}px ${escapeHtml(strokeColor)};paint-order:stroke;` : ""}${shadow}">${text}</div>`;
  }

  return "";
}

async function renderHtmlPng(args: {
  elements: RenderElement[];
  sourceWidth: number;
  sourceHeight: number;
  outputWidth: number;
  outputHeight: number;
  transparent?: boolean;
  mockupUrl?: string | null;
  mockupColor?: string | null;
  overlayLeft?: number;
  overlayTop?: number;
  overlayWidth?: number;
  overlayHeight?: number;
  /**
   * Production print files must match the editor DOM exactly.
   * The editor renders a logical safe-area layer first, then scales that whole
   * layer to the production bitmap. Scaling each element independently changes
   * transform order, sub-pixel layout, rotated objects, text metrics and font
   * wrapping. Keep false for checkout thumbnails/mockups.
   */
  scaleWholeLayer?: boolean;
}) {
  const elements = normalizeElements(args.elements);
  const outputScaleX = args.outputWidth / args.sourceWidth;
  const outputScaleY = args.outputHeight / args.sourceHeight;
  const elementScaleX = args.scaleWholeLayer ? 1 : outputScaleX;
  const elementScaleY = args.scaleWholeLayer ? 1 : outputScaleY;
  const htmlElements = elements.map((el) => renderElementHtml(el, elementScaleX, elementScaleY)).join("\n");
  const background = args.transparent ? "transparent" : (args.mockupColor || "transparent");

  const mockupHtml = args.mockupUrl
    ? `<img src="${escapeHtml(args.mockupUrl)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;" />`
    : "";

  const overlayWidth = args.scaleWholeLayer ? args.sourceWidth : positive(args.overlayWidth, args.outputWidth);
  const overlayHeight = args.scaleWholeLayer ? args.sourceHeight : positive(args.overlayHeight, args.outputHeight);
  const overlayTransform = args.scaleWholeLayer
    ? `transform:scale(${outputScaleX}, ${outputScaleY});transform-origin:top left;`
    : "";

  const overlayStyle = [
    "position:absolute",
    `left:${n(args.overlayLeft, 0)}px`,
    `top:${n(args.overlayTop, 0)}px`,
    `width:${overlayWidth}px`,
    `height:${overlayHeight}px`,
    overlayTransform,
    "overflow:hidden",
    "clip-path:inset(0)",
  ].filter(Boolean).join(";");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
${googleFontsLinks(elements)}
<style>
  * { box-sizing: border-box; }
  html, body { width:${args.outputWidth}px; height:${args.outputHeight}px; margin:0; padding:0; overflow:hidden; background:${background}; }
  body { position:relative; }
</style>
</head>
<body>
  ${mockupHtml}
  <div id="design-layer" style="${overlayStyle}">${htmlElements}</div>
</body>
</html>`;

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage({
      viewport: { width: args.outputWidth, height: args.outputHeight },
      deviceScaleFactor: 1,
    });
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      await document.fonts?.ready;
      const images = Array.from(document.images);
      await Promise.all(images.map((img) => img.complete ? Promise.resolve() : new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      })));
    });
    return Buffer.from(await page.screenshot({ type: "png", omitBackground: !!args.transparent }));
  } finally {
    await browser.close();
  }
}

export async function renderPrintFilePng(args: { designData: DesignData; side: DesignSide }) {
  const sideData = args.designData.sides?.[args.side];
  if (!sideData) throw new Error(`Missing design side data: ${args.side}`);

  const elements = normalizeElements(sideData.elements);
  if (!hasArtwork(elements)) return null;

  const source = sideData.safeArea || sideData.printBox || {};
  const sourceWidth = positive(source.width, 1);
  const sourceHeight = positive(source.height, 1);
  const output = getPrintPixelSize(args.designData, args.side, sideData);

  return renderHtmlPng({
    elements,
    sourceWidth,
    sourceHeight,
    outputWidth: output.width,
    outputHeight: output.height,
    transparent: true,
    overlayLeft: 0,
    overlayTop: 0,
    overlayWidth: output.width,
    overlayHeight: output.height,
    scaleWholeLayer: true,
  });
}

export async function renderCheckoutThumbnailWebp(args: {
  designData: DesignData;
  side?: DesignSide;
  size?: number;
}) {
  const frontElements = normalizeElements(args.designData.sides?.front?.elements);
  const side: DesignSide = args.side || (hasArtwork(frontElements) ? "front" : "back");
  const sideData = args.designData.sides?.[side];
  if (!sideData) throw new Error(`Missing thumbnail side data: ${side}`);

  const elements = normalizeElements(sideData.elements);
  const mockupUrl = sideData.mockupUrl || args.designData.mockupUrls?.[side] || null;
  const size = args.size || CHECKOUT_SIZE;
  const safeArea = sideData.safeArea || sideData.printBox || {};
  const printBox = sideData.printBox || safeArea;
  const sourceWidth = positive(safeArea.width, positive(printBox.width, size));
  const sourceHeight = positive(safeArea.height, positive(printBox.height, size));
  const scale = size / 1024;
  const overlayLeft = round(n(safeArea.x, n(printBox.x, 0)) * scale);
  const overlayTop = round(n(safeArea.y, n(printBox.y, 0)) * scale);
  const overlayWidth = round(sourceWidth * scale);
  const overlayHeight = round(sourceHeight * scale);

  const png = await renderHtmlPng({
    elements,
    sourceWidth,
    sourceHeight,
    outputWidth: size,
    outputHeight: size,
    transparent: true,
    mockupUrl,
    mockupColor: args.designData.mockupColor || args.designData.color || null,
    overlayLeft,
    overlayTop,
    overlayWidth,
    overlayHeight,
  });

  return sharp(png).webp({ quality: 84, effort: 4 }).toBuffer();
}
