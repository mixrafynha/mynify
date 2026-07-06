import type { RenderElement } from "./types";

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function resolveElementImageSrc(el: RenderElement | Record<string, any> | null | undefined): string {
  if (!el || typeof el !== "object") return "";

  const meta = el.meta && typeof el.meta === "object" ? el.meta : {};

  return firstString(
    el.src,
    el.url,
    el.imageUrl,
    el.image_url,
    meta.src,
    meta.url,
    meta.imageUrl,
    meta.image_url,
    meta.image,
  );
}
