import { clamp, finiteNumber, measureTextBox } from "../canvasMath";
import { type Rect } from "./bounds";

const MIN_TEXT_WIDTH = 42;
const MIN_TEXT_HEIGHT = 18;
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 420;
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

function getScaleFromDirection(direction: string, start: Rect, dx: number, dy: number) {
  const hasLeft = direction.includes("l");
  const hasRight = direction.includes("r");
  const hasTop = direction.includes("t");
  const hasBottom = direction.includes("b");
  const horizontal = hasLeft || hasRight;
  const vertical = hasTop || hasBottom;

  const widthScale = hasLeft
    ? (start.width - dx) / Math.max(1, start.width)
    : hasRight
      ? (start.width + dx) / Math.max(1, start.width)
      : 1;
  const heightScale = hasTop
    ? (start.height - dy) / Math.max(1, start.height)
    : hasBottom
      ? (start.height + dy) / Math.max(1, start.height)
      : 1;

  if (horizontal && vertical) {
    return Math.max(MIN_SCALE, (widthScale + heightScale) / 2);
  }

  return Math.max(MIN_SCALE, vertical ? heightScale : widthScale);
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

  const scale = getScaleFromDirection(direction, start, dx, dy);
  const fontSize = clamp(startFontSize * scale, MIN_FONT_SIZE, MAX_FONT_SIZE);
  const measured = measureTextElement({
    ...el,
    width: undefined,
    height: undefined,
    meta: {
      ...(el.meta || {}),
      fontSize,
      lineHeight: el.meta?.lineHeight || 1.16,
    },
  });

  const width = Math.max(MIN_TEXT_WIDTH, measured.width);
  const height = Math.max(MIN_TEXT_HEIGHT, measured.height);
  const hasLeft = direction.includes("l");
  const hasRight = direction.includes("r");
  const hasTop = direction.includes("t");
  const hasBottom = direction.includes("b");
  const horizontal = hasLeft || hasRight;
  const vertical = hasTop || hasBottom;

  let x = start.x;
  let y = start.y;

  if (hasLeft) {
    x = start.x + start.width - width;
  } else if (!hasRight && vertical) {
    x = start.x + (start.width - width) / 2;
  }

  if (hasTop) {
    y = start.y + start.height - height;
  } else if (!hasBottom && horizontal) {
    y = start.y + (start.height - height) / 2;
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
    fontSize: Math.round(fontSize),
  };
}
