export type Rect = { x: number; y: number; width: number; height: number };
export type ElementWarningType = "OUTSIDE_SAFE_AREA" | "OUTSIDE_PRINT_AREA" | "LOW_DPI" | "TEXT_TOO_SMALL";
export type ElementWarning = { id: string; elementId: string; type: ElementWarningType; severity: "warning" | "error"; message: string };

function number(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeRect(rect: Partial<Rect> = {}): Rect {
  return { x: number(rect.x), y: number(rect.y), width: Math.max(0, number(rect.width)), height: Math.max(0, number(rect.height)) };
}

export function getOverflow(rect: Rect, area: Rect) {
  const r = normalizeRect(rect);
  const a = normalizeRect(area);
  return {
    left: Math.max(0, a.x - r.x),
    top: Math.max(0, a.y - r.y),
    right: Math.max(0, r.x + r.width - (a.x + a.width)),
    bottom: Math.max(0, r.y + r.height - (a.y + a.height)),
  };
}

export function isOutsideArea(rect: Rect, area: Rect) {
  const o = getOverflow(rect, area);
  return o.left > 0 || o.top > 0 || o.right > 0 || o.bottom > 0;
}

export function getElementWarningState(element: any, safeArea: Rect, printArea?: Rect) {
  const rect = normalizeRect({ x: element?.x, y: element?.y, width: element?.width, height: element?.height });
  const outsideSafeArea = isOutsideArea(rect, { x: 0, y: 0, width: safeArea.width, height: safeArea.height });
  const outsidePrintArea = printArea ? isOutsideArea(rect, printArea) : outsideSafeArea;
  return { outsideSafeArea, outsidePrintArea, hasWarning: outsideSafeArea || outsidePrintArea };
}

export function buildWarnings(elements: any[] = [], safeArea: Rect, printArea?: Rect): ElementWarning[] {
  return elements.flatMap((element) => {
    const state = getElementWarningState(element, safeArea, printArea);
    if (!state.hasWarning) return [];
    return [{ id: `${element.id}-outside-area`, elementId: element.id, type: state.outsideSafeArea ? "OUTSIDE_SAFE_AREA" : "OUTSIDE_PRINT_AREA", severity: "warning", message: "Element is outside the printable safe area." } as ElementWarning];
  });
}
