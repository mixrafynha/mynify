import type React from "react";

export const MIN_TEXT_SIZE = 8;
export const MAX_TEXT_SIZE = 220;
export const MIN_ELEMENT_SIZE = 24;
export const MAX_ELEMENT_SIZE = 2200;

export type FloatingPoint = {
  x: number;
  y: number;
};

export const FLOATING_TOOLBAR_POSITION_STORAGE_KEY = "ryfio:floating-toolbar-position:v1";

export function readSavedToolbarPosition(): FloatingPoint | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(FLOATING_TOOLBAR_POSITION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<FloatingPoint>;
    const x = finite(parsed.x, Number.NaN);
    const y = finite(parsed.y, Number.NaN);

    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

    return { x, y };
  } catch {
    return null;
  }
}

export function saveToolbarPosition(position: FloatingPoint) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      FLOATING_TOOLBAR_POSITION_STORAGE_KEY,
      JSON.stringify({
        x: Math.round(position.x),
        y: Math.round(position.y),
      }),
    );
  } catch {
    // Keep the editor usable if storage is unavailable.
  }
}

export function clearSavedToolbarPosition() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(FLOATING_TOOLBAR_POSITION_STORAGE_KEY);
  } catch {
    // Keep the editor usable if storage is unavailable.
  }
}

export function finite(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getElementLabel(el: any) {
  if (!el) return "Element";
  if (el.type === "text") return "Text";
  if (el.type === "image") return "Image";
  if (el.type === "shape") return "Shape";
  return "Element";
}

export function getFontSize(el: any) {
  return finite(el?.meta?.fontSize ?? el?.fontSize, 40);
}

export function getFontFamily(el: any) {
  return String(el?.meta?.fontFamily ?? el?.fontFamily ?? "Inter");
}

export function getElementWidth(el: any) {
  return finite(el?.width ?? el?.naturalWidth, el?.type === "text" ? 260 : 220);
}

export function getElementHeight(el: any) {
  return finite(
    el?.height ?? el?.naturalHeight,
    el?.type === "text" ? 80 : 220,
  );
}

export function stopEvent(
  e: React.PointerEvent | React.MouseEvent | React.TouchEvent,
) {
  e.stopPropagation();
}

export function getInitialToolbarPosition(
  selected: any,
  safeArea: { width: number; height: number },
) {
  const elementX = finite(selected?.x, 0);
  const elementY = finite(selected?.y, 0);
  const elementWidth = getElementWidth(selected);
  const safeWidth = Math.max(360, finite(safeArea?.width, 980));
  const safeHeight = Math.max(360, finite(safeArea?.height, 720));

  return {
    x: clamp(
      Math.round(elementX + elementWidth + 18),
      12,
      Math.max(12, safeWidth - 356),
    ),
    y: clamp(Math.round(elementY - 24), 12, Math.max(12, safeHeight - 620)),
  };
}
