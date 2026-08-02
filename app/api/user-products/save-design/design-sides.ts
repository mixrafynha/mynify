export type SavedDesignSide = "front" | "back";

function parseJsonIfString(value: unknown): unknown {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function normalizeSavedElements(value: unknown): unknown[] {
  const parsed = parseJsonIfString(value);
  return Array.isArray(parsed) ? parsed : [];
}

export function isRenderableSavedElement(element: unknown): boolean {
  if (!element || typeof element !== "object") return false;

  const value = element as Record<string, any>;
  if (value.meta?.hidden === true) return false;

  const type = String(value.type || "").toLowerCase();
  const hasText = typeof value.text === "string" && value.text.trim().length > 0;
  const hasSource =
    (typeof value.src === "string" && value.src.trim().length > 0) ||
    (typeof value.content === "string" && value.content.trim().length > 0);

  return (
    ["image", "text", "shape", "group", "svg", "path", "raster", "bitmap"].includes(type) ||
    hasText ||
    hasSource
  );
}

export function savedElementsHaveArtwork(value: unknown): boolean {
  return normalizeSavedElements(value).some(isRenderableSavedElement);
}

export function resolveSavedDesignSides(input: {
  frontElements: unknown;
  backElements: unknown;
}): SavedDesignSide[] {
  const sides: SavedDesignSide[] = [];

  if (savedElementsHaveArtwork(input.frontElements)) sides.push("front");
  if (savedElementsHaveArtwork(input.backElements)) sides.push("back");

  return sides;
}
