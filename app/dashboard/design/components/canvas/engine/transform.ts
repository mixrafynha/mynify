import { clamp } from "../canvasMath";
import { normalizeSafeArea, type Rect } from "./bounds";
import { resizeImageRect } from "./imageBounds";
import { resizeTextRect } from "./textBounds";

const MIN_SIZE = 30;
const MAX_SIZE = 2000;

export function resizeFreeRect(args: {
  direction: string;
  start: Rect;
  dx: number;
  dy: number;
  safeArea: any;
  minWidth?: number;
  minHeight?: number;
}): Rect {
  const { direction, start, dx, dy, minWidth = MIN_SIZE, minHeight = MIN_SIZE } = args;

  let x = start.x;
  let y = start.y;
  let width = start.width;
  let height = start.height;

  if (direction.includes("r")) width = start.width + dx;
  if (direction.includes("l")) {
    width = start.width - dx;
    x = start.x + dx;
  }

  if (direction.includes("b")) height = start.height + dy;
  if (direction.includes("t")) {
    height = start.height - dy;
    y = start.y + dy;
  }

  if (!direction.includes("l") && !direction.includes("r")) width = start.width;
  if (!direction.includes("t") && !direction.includes("b")) height = start.height;

  width = clamp(width, minWidth, MAX_SIZE);
  height = clamp(height, minHeight, MAX_SIZE);

  if (direction.includes("l")) x = start.x + start.width - width;
  if (direction.includes("t")) y = start.y + start.height - height;

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  };
}

export function resizeElementByType(args: {
  el: any;
  direction: string;
  start: Rect;
  startFontSize: number;
  dx: number;
  dy: number;
  safeArea: any;
}) {
  const { el } = args;

  if (el.type === "text") {
    const next = resizeTextRect(args);
    return {
      x: next.x,
      y: next.y,
      width: next.width,
      height: next.height,
      meta: {
        ...(el.meta || {}),
        fontSize: next.fontSize,
        lineHeight: el.meta?.lineHeight || 1.16,
      },
    };
  }

  if (el.type === "image") {
    return resizeImageRect(args);
  }

  return resizeFreeRect(args);
}

export function fitElementToSafeArea(el: any, safeArea: any, currentRect: Rect) {
  const safe = normalizeSafeArea(safeArea);

  if (el.type === "image") {
    const aspect = currentRect.width / Math.max(1, currentRect.height);
    let width = safe.width;
    let height = width / aspect;
    if (height > safe.height) {
      height = safe.height;
      width = height * aspect;
    }
    return {
      x: Math.round((safe.width - width) / 2),
      y: Math.round((safe.height - height) / 2),
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  if (el.type === "text") {
    return {
      x: 0,
      y: 0,
      width: safe.width,
      height: currentRect.height,
    };
  }

  return { x: 0, y: 0, width: safe.width, height: safe.height };
}
