import { clamp, finiteNumber, measureTextBox } from "../canvasMath";
import { type Rect } from "./bounds";

const MIN_TEXT_WIDTH = 42;
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 420;
const MAX_TEXT_WIDTH = 4000;
const MIN_SCALE = 0.08;

export function measureTextElement(el: any) {
  const measured = measureTextBox(el);
  return {
    width: Math.round(measured.width),
    height: Math.round(measured.height),
    fontSize: Math.round(measured.fontSize),
    lineHeight: measured.lineHeight,
    paddingX: measured.paddingX,
    paddingY: measured.paddingY,
  };
}

export function normalizeTextElement(el: any, _safeArea?: any) {
  const measured = measureTextElement(el);

  return {
    ...el,
    x: finiteNumber(el.x, 0),
    y: finiteNumber(el.y, 0),
    width: measured.width,
    height: measured.height,
    meta: {
      ...(el.meta || {}),
      fontSize: measured.fontSize,
      lineHeight: el.meta?.lineHeight || measured.lineHeight || 1.16,
    },
  };
}

function getHorizontalWidth(direction: string, start: Rect, dx: number) {
  let x = start.x;
  let width = start.width;

  if (direction.includes("r")) width = start.width + dx;
  if (direction.includes("l")) {
    width = start.width - dx;
    x = start.x + dx;
  }

  width = clamp(width, MIN_TEXT_WIDTH, MAX_TEXT_WIDTH);

  if (direction.includes("l")) {
    x = start.x + start.width - width;
  }

  return { x, width };
}

function getScaleFromDirection(direction: string, start: Rect, boxWidth: number, dx: number, dy: number) {
  const hasLeft = direction.includes("l");
  const hasRight = direction.includes("r");
  const hasTop = direction.includes("t");
  const hasBottom = direction.includes("b");
  const horizontal = hasLeft || hasRight;
  const vertical = hasTop || hasBottom;

  const widthScale = boxWidth / Math.max(1, start.width);
  const heightScale = hasTop
    ? (start.height - dy) / Math.max(1, start.height)
    : hasBottom
      ? (start.height + dy) / Math.max(1, start.height)
      : 1;

  if (horizontal && vertical) {
    // Canva/Gelato behaviour: diagonal handles scale text. Dragging only one axis still grows/shrinks font.
    const dominant = Math.abs(widthScale - 1) >= Math.abs(heightScale - 1) ? widthScale : heightScale;
    return Math.max(MIN_SCALE, dominant);
  }

  if (vertical) return Math.max(MIN_SCALE, heightScale);

  // L/R side handles only reflow text width, they do not change font size.
  return 1;
}

export function resizeTextRect(args: {
  el: any;
  direction: string;
  start: Rect;
  startFontSize: number;
  dx: number;
  dy: number;
  safeArea: any;
}) {
  const { el, direction, start, startFontSize, dx, dy } = args;

  const horizontal = getHorizontalWidth(direction, start, dx);
  let x = horizontal.x;
  let y = start.y;
  let boxWidth = horizontal.width;

  const scale = getScaleFromDirection(direction, start, boxWidth, dx, dy);
  const fontSize = clamp(startFontSize * scale, MIN_FONT_SIZE, MAX_FONT_SIZE);

  // Em diagonal sem grande movimento horizontal, aumenta também a largura para acompanhar a escala.
  if ((direction.length === 2) && Math.abs(boxWidth - start.width) < 1) {
    boxWidth = clamp(start.width * scale, MIN_TEXT_WIDTH, MAX_TEXT_WIDTH);
    if (direction.includes("l")) x = start.x + start.width - boxWidth;
  }

  const next = {
    ...el,
    width: boxWidth,
    height: undefined,
    meta: {
      ...(el.meta || {}),
      fontSize,
      lineHeight: el.meta?.lineHeight || 1.16,
    },
  };

  const measured = measureTextElement(next);

  if (direction.includes("t")) {
    const bottom = start.y + start.height;
    y = bottom - measured.height;
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: measured.width,
    height: measured.height,
    fontSize: Math.round(fontSize),
  };
}
