import { AI_IMAGE_QUALITY } from "../../data";
import type { AiImageItem } from "./ai.types";
import { buildFinalPrompt, getImageSrc } from "./ai.utils";

export async function fetchAiCredits() {
  const res = await fetch("/api/ai-credits", { cache: "no-store" });
  if (res.status === 401) return null;
  if (!res.ok) return null;
  return res.json();
}

export async function fetchSavedImages() {
  const res = await fetch("/api/user-generated-images", { cache: "no-store" });
  if (res.status === 401) return { unauthorized: true, data: null };
  if (!res.ok) return { unauthorized: false, data: null };
  return { unauthorized: false, data: await res.json() };
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
  const imageUrl = getImageSrc(item);

  const response = await fetch("/api/user-generated-images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: item.prompt || item.title || "AI design",
      imageUrl,
      image_url: imageUrl,
      printUrl: imageUrl,
      src: imageUrl,
      url: imageUrl,
      storageKey: item.storage_key || item.r2Key,
      storage_key: item.storage_key || item.r2Key,
      r2Key: item.r2Key || item.storage_key,
      generationId: item.generationId,
      generation_id: item.generationId,
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

export async function fetchCreditPacks() {
  const res = await fetch("/api/credit-packs", { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  return Array.isArray(data?.packs) ? data.packs : [];
}

export async function createAiCreditsCheckout(packId: string, source = "editor") {
  const response = await fetch("/api/stripe/create-ai-credits-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packId, source }),
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}
