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
    el.printUrl,
    el.print_url,
    el.imageUrl,
    el.image_url,
    el.assetUrl,
    el.asset_url,
    el.publicImageUrl,
    el.public_image_url,
    el.url,
    el.image,
    meta.src,
    meta.printUrl,
    meta.print_url,
    meta.imageUrl,
    meta.image_url,
    meta.assetUrl,
    meta.asset_url,
    meta.publicImageUrl,
    meta.public_image_url,
    meta.url,
    meta.image,
  );
}
