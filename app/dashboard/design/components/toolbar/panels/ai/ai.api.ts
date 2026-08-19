import { AI_IMAGE_QUALITY } from "../../data";
import type { AiImageItem } from "./ai.types";
import { buildFinalPrompt, getImageSrc } from "./ai.utils";

type SavedImagesResult = {
  unauthorized: boolean;
  data: any;
};

let savedImagesRequest: Promise<SavedImagesResult> | null = null;

export async function fetchSavedImages() {
  if (savedImagesRequest) return savedImagesRequest;

  savedImagesRequest = (async () => {
    const res = await fetch("/api/user-generated-images", { cache: "no-store" });
    if (res.status === 401) return { unauthorized: true, data: null };
    if (!res.ok) return { unauthorized: false, data: null };
    return { unauthorized: false, data: await res.json() };
  })();

  try {
    return await savedImagesRequest;
  } finally {
    savedImagesRequest = null;
  }
}

export async function requestAiImage(cleanPrompt: string) {
  const response = await fetch("/api/ai-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: buildFinalPrompt(cleanPrompt),
      originalPrompt: cleanPrompt,
      transparent: true,
      size: AI_IMAGE_QUALITY.requestedSize,
      fallbackSize: AI_IMAGE_QUALITY.fallbackSize,
      minOutputPixels: AI_IMAGE_QUALITY.minOutputPixels,
      targetOutputPixels: AI_IMAGE_QUALITY.targetOutputPixels,
      dpi: AI_IMAGE_QUALITY.dpi,
      metadataDpi: AI_IMAGE_QUALITY.metadataDpi,
      format: AI_IMAGE_QUALITY.format,
    }),
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export async function saveGeneratedImage(item: AiImageItem) {
  const response = await fetch("/api/user-generated-images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: item.id || null,
      prompt: item.prompt || item.title || "AI design",
      originalImageUrl: item.originalImageUrl,
      original_image_url: item.originalImageUrl,
    }),
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export async function deleteSavedImage(id: string) {
  const response = await fetch("/api/user-generated-images", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export async function fetchAiImageGeneration(generationId?: string | null, reconcile = false) {
  const params = new URLSearchParams();
  if (generationId) params.set("generationId", generationId);
  if (reconcile) params.set("reconcile", "1");

  const response = await fetch(`/api/ai-image${params.toString() ? `?${params.toString()}` : ""}`, {
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}
