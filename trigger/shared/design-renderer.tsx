import sharp from "sharp";
import { chromium } from "playwright";
import { renderToStaticMarkup } from "react-dom/server";
import PrintCanvas from "../../shared/rendering/PrintCanvas";
import { googleFontsLinks } from "../../shared/rendering/font";

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
  const logicalWidth = args.scaleWholeLayer ? args.sourceWidth : positive(args.overlayWidth, args.outputWidth);
  const logicalHeight = args.scaleWholeLayer ? args.sourceHeight : positive(args.overlayHeight, args.outputHeight);
  const htmlElements = renderToStaticMarkup(
    <PrintCanvas
      elements={elements}
      safeArea={{ width: logicalWidth, height: logicalHeight }}
      scaleX={elementScaleX}
      scaleY={elementScaleY}
    />,
  );
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
