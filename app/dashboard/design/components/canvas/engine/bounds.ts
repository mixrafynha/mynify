import { finiteNumber, getElementSize } from "../canvasMath";

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type OutsideSeverity = "ok" | "warning" | "error";

export function normalizeRect(rect: Partial<Rect> = {}): Rect {
  return {
    x: finiteNumber(rect.x, 0),
    y: finiteNumber(rect.y, 0),
    width: Math.max(0, finiteNumber(rect.width, 0)),
    height: Math.max(0, finiteNumber(rect.height, 0)),
  };
}

export function normalizeSafeArea(safeArea: Partial<Rect> = {}): Rect {
  return {
    x: 0,
    y: 0,
    width: Math.max(0, finiteNumber(safeArea.width, 0)),
    height: Math.max(0, finiteNumber(safeArea.height, 0)),
  };
}

export function getElementRect(el: any): Rect {
  const size = getElementSize(el);

  return {
    x: finiteNumber(el?.x, 0),
    y: finiteNumber(el?.y, 0),
    width: Math.max(1, finiteNumber(el?.width, size.width)),
    height: Math.max(1, finiteNumber(el?.height, size.height)),
  };
}

export function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

export function clampPositionToSafeArea(
  x: number,
  y: number,
  width: number,
  height: number,
  safeArea: Rect
) {
  const s = normalizeSafeArea(safeArea);

  return {
    x: clamp(finiteNumber(x, 0), 0, Math.max(0, s.width - width)),
    y: clamp(finiteNumber(y, 0), 0, Math.max(0, s.height - height)),
  };
}

export function keepRectFree(rect: Rect): Rect {
  return normalizeRect(rect);
}

export function clampRectToSafeArea(rect: Rect, safeArea: Rect): Rect {
  const r = normalizeRect(rect);
  const pos = clampPositionToSafeArea(
    r.x,
    r.y,
    r.width,
    r.height,
    safeArea
  );

  return {
    ...r,
    x: pos.x,
    y: pos.y,
  };
}

export function clampSizeToSafeArea(rect: Rect, safeArea: Rect): Rect {
  const r = normalizeRect(rect);
  const s = normalizeSafeArea(safeArea);

  return {
    ...r,
    width: clamp(r.width, 1, Math.max(1, s.width - r.x)),
    height: clamp(r.height, 1, Math.max(1, s.height - r.y)),
  };
}

export function getOverflow(rect: Rect, safeArea: Rect) {
  const r = normalizeRect(rect);
  const s = normalizeSafeArea(safeArea);

  return {
    left: Math.max(0, s.x - r.x),
    top: Math.max(0, s.y - r.y),
    right: Math.max(0, r.x + r.width - (s.x + s.width)),
    bottom: Math.max(0, r.y + r.height - (s.y + s.height)),
  };
}

export function isOutsideSafeArea(rect: Rect, safeArea: Rect) {
  const overflow = getOverflow(rect, safeArea);

  return (
    overflow.left > 0 ||
    overflow.top > 0 ||
    overflow.right > 0 ||
    overflow.bottom > 0
  );
}

export function getOutsideSeverity(
  rect: Rect,
  safeArea: Rect
): OutsideSeverity {
  const overflow = getOverflow(rect, safeArea);

  const maxOverflow = Math.max(
    overflow.left,
    overflow.top,
    overflow.right,
    overflow.bottom
  );

  if (maxOverflow <= 0) return "ok";
  if (maxOverflow <= 12) return "warning";
  return "error";
}

export function rectsIntersect(a: Rect, b: Rect) {
  const ra = normalizeRect(a);
  const rb = normalizeRect(b);

  return (
    ra.x < rb.x + rb.width &&
    ra.x + ra.width > rb.x &&
    ra.y < rb.y + rb.height &&
    ra.y + ra.height > rb.y
  );
}

export function getGroupRect(rects: Rect[]): Rect {
  if (!rects.length) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const normalized = rects.map(normalizeRect);

  const minX = Math.min(...normalized.map((r) => r.x));
  const minY = Math.min(...normalized.map((r) => r.y));
  const maxX = Math.max(...normalized.map((r) => r.x + r.width));
  const maxY = Math.max(...normalized.map((r) => r.y + r.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function isFullyInsideSafeArea(rect: Rect, safeArea: Rect) {
  const r = normalizeRect(rect);
  const s = normalizeSafeArea(safeArea);

  return (
    r.x >= s.x &&
    r.y >= s.y &&
    r.x + r.width <= s.x + s.width &&
    r.y + r.height <= s.y + s.height
  );
}

export function showGuides(guides: any, safeArea?: Rect) {
  window.dispatchEvent(
    new CustomEvent("guides", {
      detail: {
        ...guides,
        safeArea: safeArea ? normalizeSafeArea(safeArea) : undefined,
      },
    })
  );
}

export function hideGuides() {
  window.dispatchEvent(
    new CustomEvent("guides", {
      detail: {
        showVertical: false,
        showHorizontal: false,
        verticalPosition: undefined,
        horizontalPosition: undefined,
      },
    })
  );
}

export function isFullyOutsideSafeArea(rect: Rect, safeArea: Rect) {
  return !rectsIntersect(normalizeRect(rect), normalizeSafeArea(safeArea));
}
