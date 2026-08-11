import { SAFE_AREA_PADDING } from "./constants";
import { getResponsivePrintBox, type ProductDisplayConfig } from "./productConfig";
import type { Box, CanvasSide } from "./types";
import { getTextPadding } from "@/shared/rendering/textLayout";
export { getTextPadding } from "@/shared/rendering/textLayout";

type Side = CanvasSide;

export type CanvasElementLike = {
  id?: string;
  type?: "image" | "text" | "shape" | string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  fontStyle?: string;
  meta?: Record<string, any>;
  [key: string]: any;
};

export type LocalBox = Pick<Box, "width" | "height"> & Partial<Pick<Box, "x" | "y">>;

const DEFAULT_IMAGE_SIZE = 140;
const DEFAULT_SHAPE_SIZE = 120;
const DEFAULT_TEXT_FONT_SIZE = 42;
const MIN_ELEMENT_SIZE = 10;
const MIN_TEXT_WIDTH = 42;
const TEXT_AVERAGE_CHAR_RATIO = 0.58;
const TEXT_CAP_HEIGHT_RATIO = 0.08;
const TEXT_VISUAL_PADDING = 4;
let textMeasureContext: CanvasRenderingContext2D | null = null;

export function finiteNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function clamp(value: number, min: number, max: number): number {
  const safeMin = finiteNumber(min, 0);
  const safeMax = Math.max(safeMin, finiteNumber(max, safeMin));
  return Math.min(Math.max(finiteNumber(value, safeMin), safeMin), safeMax);
}

export function getPrintBox(
  productId: string,
  side: Side = "front",
  productConfig?: ProductDisplayConfig | null,
): Box {
  return getResponsivePrintBox(productId, side, undefined, productConfig);
}

export function getSafeArea(printBox: Box): Box {
  return {
    x: finiteNumber(printBox.x, 0) + SAFE_AREA_PADDING,
    y: finiteNumber(printBox.y, 0) + SAFE_AREA_PADDING,
    width: Math.max(0, finiteNumber(printBox.width, 0) - SAFE_AREA_PADDING * 2),
    height: Math.max(0, finiteNumber(printBox.height, 0) - SAFE_AREA_PADDING * 2),
  };
}

export function getLocalSafeArea(safeArea: LocalBox): Box {
  return {
    x: 0,
    y: 0,
    width: Math.max(0, finiteNumber(safeArea.width, 0)),
    height: Math.max(0, finiteNumber(safeArea.height, 0)),
  };
}

export function getProductionSafeArea(printBox: Box): Box {
  return {
    x: 0,
    y: 0,
    width: Math.max(0, finiteNumber(printBox.width, 0)),
    height: Math.max(0, finiteNumber(printBox.height, 0)),
  };
}

function splitTextLines(text: string): string[] {
  const lines = String(text || "Text").replace(/\r/g, "").split("\n");
  return lines.length ? lines : ["Text"];
}

function getTextMeasureContext() {
  if (textMeasureContext || typeof document === "undefined") return textMeasureContext;

  const canvas = document.createElement("canvas");
  textMeasureContext = canvas.getContext("2d");
  return textMeasureContext;
}

function quoteFontFamily(value: unknown) {
  const family = String(value || "Arial").trim();
  if (!family) return "Arial";
  if (family.startsWith("var(") || family.includes(",")) return family;
  return `"${family.replace(/"/g, '\\"')}"`;
}

function getCanvasFont(el: CanvasElementLike, meta: Record<string, any>, fontSize: number) {
  const fontStyle = meta.fontStyle || el.fontStyle || "normal";
  const fontWeight = meta.fontWeight || el.fontWeight || 700;
  const fontFamily = quoteFontFamily(meta.fontFamily || el.fontFamily || "Arial");
  return `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}, Arial, sans-serif`;
}

function measureLineVisualBox(
  line: string,
  el: CanvasElementLike,
  meta: Record<string, any>,
  fontSize: number,
  letterSpacing: number,
) {
  const content = line || " ";
  const fallbackWidth =
    content.length * fontSize * TEXT_AVERAGE_CHAR_RATIO +
    Math.max(0, content.length - 1) * letterSpacing;
  const fallbackHeight = fontSize;
  const context = getTextMeasureContext();

  if (!context) {
    return {
      width: Math.ceil(fallbackWidth),
      height: Math.ceil(fallbackHeight),
    };
  }

  context.font = getCanvasFont(el, meta, fontSize);

  const metrics = context.measureText(content);
  const visualLeft = Math.abs(finiteNumber(metrics.actualBoundingBoxLeft, 0));
  const visualRight = Math.abs(finiteNumber(metrics.actualBoundingBoxRight, 0));
  const visualAscent = Math.abs(finiteNumber(metrics.actualBoundingBoxAscent, 0));
  const visualDescent = Math.abs(finiteNumber(metrics.actualBoundingBoxDescent, 0));
  const visualWidth = Math.max(
    metrics.width,
    visualLeft + visualRight,
  );
  const visualHeight = Math.max(fallbackHeight, visualAscent + visualDescent);

  return {
    width: Math.ceil(visualWidth + Math.max(0, content.length - 1) * letterSpacing),
    height: Math.ceil(visualHeight),
  };
}

function measureLineWidth(
  line: string,
  el: CanvasElementLike,
  meta: Record<string, any>,
  fontSize: number,
  letterSpacing: number,
) {
  return measureLineVisualBox(line, el, meta, fontSize, letterSpacing).width;
}

function measureWrappedLineCount(
  line: string,
  el: CanvasElementLike,
  meta: Record<string, any>,
  fontSize: number,
  letterSpacing: number,
  usableWidth: number,
) {
  const content = line || " ";
  if (!content.length) return 1;
  if (measureLineWidth(content, el, meta, fontSize, letterSpacing) <= usableWidth) return 1;

  let rows = 1;
  let current = "";

  for (const char of Array.from(content)) {
    const next = current + char;
    if (current && measureLineWidth(next, el, meta, fontSize, letterSpacing) > usableWidth) {
      rows += 1;
      current = char;
      continue;
    }
    current = next;
  }

  return rows;
}

export function measureTextBox(el: CanvasElementLike) {
  const meta = el.meta || {};
  const text = String(el.text ?? el.content ?? "Text");
  const fontSize = clamp(finiteNumber(meta.fontSize ?? el.fontSize, DEFAULT_TEXT_FONT_SIZE), 8, 420);
  const lineHeight = clamp(finiteNumber(meta.lineHeight, 1.16), 0.9, 2.4);
  const letterSpacing = finiteNumber(meta.letterSpacing, 0);
  const padding = getTextPadding(fontSize, meta);

  const rawLines = splitTextLines(text);
  const naturalLineWidth = Math.max(
    1,
    ...rawLines.map((line) => measureLineWidth(line, el, meta, fontSize, letterSpacing)),
  );
  const naturalLineHeight = Math.max(
    fontSize,
    ...rawLines.map((line) => measureLineVisualBox(line, el, meta, fontSize, letterSpacing).height),
  );

  const width = Math.max(
    MIN_TEXT_WIDTH,
    Math.round(naturalLineWidth + padding.x * 2 + TEXT_VISUAL_PADDING * 2)
  );

  const usableWidth = Math.max(1, width - padding.x * 2);
  const visualLines = rawLines.reduce((count, line) => {
    return count + measureWrappedLineCount(line, el, meta, fontSize, letterSpacing, usableWidth);
  }, 0);

  const textHeight = Math.ceil(visualLines * Math.max(naturalLineHeight, fontSize * lineHeight));
  const strokeWidth = Math.max(0, finiteNumber(meta.strokeWidth, 0));
  const effectHeight = meta.shadow || meta.glow ? Math.ceil(fontSize * 0.05) : 0;
  const extraFontSafety = Math.max(
    2,
    Math.ceil(fontSize * TEXT_CAP_HEIGHT_RATIO) + strokeWidth + effectHeight
  );
  const height = Math.max(
    MIN_ELEMENT_SIZE,
    Math.round(textHeight + padding.y * 2 + extraFontSafety + TEXT_VISUAL_PADDING * 2)
  );

  return {
    width,
    height,
    fontSize,
    lineHeight,
    paddingX: padding.x,
    paddingY: padding.y,
    visualLines,
  };
}

export function getElementSize(el: CanvasElementLike) {
  if (el.type === "text") {
    const textBox = measureTextBox(el);
    return {
      width: textBox.width,
      height: textBox.height,
    };
  }

  const fallback = el.type === "shape" ? DEFAULT_SHAPE_SIZE : DEFAULT_IMAGE_SIZE;
  return {
    width: Math.max(MIN_ELEMENT_SIZE, Math.round(finiteNumber(el.width, fallback))),
    height: Math.max(MIN_ELEMENT_SIZE, Math.round(finiteNumber(el.height, fallback))),
  };
}

export function fitElementInsideSafeArea<T extends CanvasElementLike>(
  el: T,
  safeArea: LocalBox
): T {
  const local = getLocalSafeArea(safeArea);
  const size = getElementSize(el);

  if (!local.width || !local.height) {
    return {
      ...el,
      width: MIN_ELEMENT_SIZE,
      height: MIN_ELEMENT_SIZE,
    };
  }

  const scale = Math.min(1, local.width / size.width, local.height / size.height);

  if (el.type === "text") {
    const meta = el.meta || {};
    const fontSize = finiteNumber(meta.fontSize, DEFAULT_TEXT_FONT_SIZE);
    const nextFontSize = Math.max(8, Math.floor(fontSize * scale));
    const nextWidth = Math.max(MIN_TEXT_WIDTH, Math.floor(size.width * scale));
    const next = {
      ...el,
      width: nextWidth,
      height: undefined,
      meta: {
        ...meta,
        fontSize: nextFontSize,
        lineHeight: meta.lineHeight || 1.16,
      },
    } as T;
    const nextSize = getElementSize(next);
    return {
      ...next,
      width: nextSize.width,
      height: nextSize.height,
    };
  }

  return {
    ...el,
    width: Math.max(MIN_ELEMENT_SIZE, Math.round(size.width * scale)),
    height: Math.max(MIN_ELEMENT_SIZE, Math.round(size.height * scale)),
  };
}

export function clampElementToSafeArea<T extends CanvasElementLike>(
  el: T,
  safeArea: LocalBox
): T {
  const local = getLocalSafeArea(safeArea);
  const fitted = fitElementInsideSafeArea(el, local);
  const size = getElementSize(fitted);

  return {
    ...fitted,
    x: clamp(finiteNumber(fitted.x, 0), 0, local.width - size.width),
    y: clamp(finiteNumber(fitted.y, 0), 0, local.height - size.height),
    width: size.width,
    height: size.height,
  };
}

export function normalizeElementForSafeArea<T extends CanvasElementLike>(
  el: T,
  safeArea: LocalBox
): T {
  return clampElementToSafeArea(el, safeArea);
}

export function centerElementInSafeArea<T extends CanvasElementLike>(
  el: T,
  safeArea: LocalBox
): T {
  const local = getLocalSafeArea(safeArea);
  const fitted = fitElementInsideSafeArea(el, local);
  const size = getElementSize(fitted);

  return clampElementToSafeArea(
    {
      ...fitted,
      x: Math.round((local.width - size.width) / 2),
      y: Math.round((local.height - size.height) / 2),
    },
    local
  );
}

export function isInsideSafeArea(el: CanvasElementLike, safeArea: LocalBox): boolean {
  const local = getLocalSafeArea(safeArea);
  const size = getElementSize(el);
  const x = finiteNumber(el.x, 0);
  const y = finiteNumber(el.y, 0);
  return x >= 0 && y >= 0 && x + size.width <= local.width && y + size.height <= local.height;
}

export function getOverflowAmount(el: CanvasElementLike, safeArea: LocalBox) {
  const local = getLocalSafeArea(safeArea);
  const size = getElementSize(el);
  const x = finiteNumber(el.x, 0);
  const y = finiteNumber(el.y, 0);

  return {
    left: Math.max(0, -x),
    top: Math.max(0, -y),
    right: Math.max(0, x + size.width - local.width),
    bottom: Math.max(0, y + size.height - local.height),
  };
}

export function isInsideProductionArea(
  el: CanvasElementLike,
  productId = "hoodie",
  side: Side = "front"
): boolean {
  const printBox = getPrintBox(productId, side);
  return isInsideSafeArea(el, getProductionSafeArea(printBox));
}
