import { AI_IMAGE_QUALITY } from "../../data";
import type { AiImageItem } from "./ai.types";

export function safePrompt(value: string) {
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 180);
}

export function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();

    if (Array.isArray(value)) {
      const found = firstString(...value);
      if (found) return found;
    }
  }

  return null;
}

export function getImageSrc(item: AiImageItem | any) {
  return String(
    item?.imageUrl ||
      item?.image_url ||
      item?.printUrl ||
      item?.src ||
      item?.url ||
      "",
  ).trim();
}

export function isValidImageUrl(value: string) {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:image/")
  );
}

export function normalizeGeneratedImageResponse(data: any): AiImageItem | null {
  const src = firstString(
    data?.url,
    data?.imageUrl,
    data?.image_url,
    data?.src,
    data?.image,
    data?.output,
    data?.images,
    data?.imageUrls,
    data?.urls,
    data?.data?.url,
    data?.data?.imageUrl,
    data?.data?.image_url,
    data?.data?.images,
  );

  if (!src) return null;

  const printUrl =
    firstString(data?.printUrl, data?.print_url, data?.assetUrl, data?.asset_url) || src;

  const storageKey = firstString(
    data?.storage_key,
    data?.storageKey,
    data?.r2Key,
    data?.r2_key,
  );

  return {
    src,
    imageUrl: src,
    image_url: src,
    url: src,
    printUrl,
    storage_key: storageKey,
    r2Key: storageKey,
    id: data?.id || null,
    generationId: data?.generationId || data?.generation_id || null,
    originalImageUrl: data?.originalImageUrl || data?.original_image_url || null,
    width:
      Number(data?.width || data?.naturalWidth || data?.metadata?.width) ||
      AI_IMAGE_QUALITY.targetOutputPixels,
    height:
      Number(data?.height || data?.naturalHeight || data?.metadata?.height) ||
      AI_IMAGE_QUALITY.targetOutputPixels,
    dpi: Number(data?.dpi || data?.metadata?.dpi) || AI_IMAGE_QUALITY.dpi,
  };
}

export function normalizeSavedImage(row: any): AiImageItem {
  const src = String(
    row?.image_url || row?.imageUrl || row?.printUrl || row?.src || row?.url || "",
  ).trim();

  return {
    id: row?.id,
    generationId: row?.generation_id || row?.generationId,
    prompt: row?.prompt,
    title: row?.prompt,
    src,
    imageUrl: src,
    image_url: src,
    url: src,
    printUrl: src,
    r2Key: row?.storage_key || row?.r2Key,
    storage_key: row?.storage_key || row?.r2Key,
    originalImageUrl: row?.original_image_url || row?.originalImageUrl || null,
    width: AI_IMAGE_QUALITY.targetOutputPixels,
    height: AI_IMAGE_QUALITY.targetOutputPixels,
    dpi: AI_IMAGE_QUALITY.dpi,
    transparent: true,
    saved: true,
    qualityMode: AI_IMAGE_QUALITY.mode,
  };
}

export function fitWithinBox(width: unknown, height: unknown, max = 300) {
  const naturalWidth = Math.max(1, Number(width) || max);
  const naturalHeight = Math.max(1, Number(height) || max);
  const ratio = Math.min(1, max / naturalWidth, max / naturalHeight);

  return {
    width: Math.max(48, Math.round(naturalWidth * ratio)),
    height: Math.max(48, Math.round(naturalHeight * ratio)),
  };
}

export function buildFinalPrompt(userPrompt: string) {
  return `
${userPrompt}

Create ONE premium apparel print design.

This must look like a best-selling luxury streetwear graphic.

Style:
- Ultra detailed illustration
- Tattoo-quality artwork
- Premium merch design
- Luxury clothing brand aesthetic
- Vector-inspired clean shapes
- Sharp professional line art
- Rich textures
- Intricate details
- High contrast
- Vibrant colors
- Dramatic cinematic lighting
- Dynamic composition
- Strong focal point
- Commercial quality
- Award-winning illustration

Composition:
- Large centered artwork
- Fill 85-90% of the canvas
- Perfect symmetry when appropriate
- Balanced composition
- Crisp clean silhouette
- Minimal empty transparent space
- Every important detail fully visible

Typography:
- If the prompt requests text, create premium readable typography.
- Perfect spelling.
- Integrate the lettering naturally into the artwork.

Output:
- Transparent background
- PNG
- Print-ready
- DTG / DTF ready
- Ultra sharp edges
- No blur
- No compression artifacts
- High resolution
- Isolated artwork only

Never generate:
- T-shirt
- Hoodie
- Mockup
- Person
- Model
- Hands
- Wall
- Frame
- Room
- Product photo
- Watermark
- Signature
- Border
- Shadow behind the artwork
`;
}
