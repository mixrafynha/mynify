"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AI_IMAGE_QUALITY } from "../../data";
import { FREE_SAVED_IMAGE_LIMIT, PROMPT_EXAMPLES } from "./ai.constants";
import type { AiCreditPack, AiImageItem, UseAiImagesArgs, BuyCreditsOptions } from "./ai.types";
import {
  createAiCreditsCheckout,
  deleteSavedImage,
  fetchAiCredits,
  fetchCreditPacks,
  fetchSavedImages,
  requestAiImage,
  saveGeneratedImage,
} from "./ai.api";
import {
  fitWithinBox,
  getImageSrc,
  isValidImageUrl,
  normalizeGeneratedImageResponse,
  normalizeSavedImage,
  safePrompt,
} from "./ai.utils";

function toSafeNumber(value: unknown): number | null {
  const next = Number(value);
  if (!Number.isFinite(next)) return null;
  return Math.max(0, Math.floor(next));
}

function readCreditBalance(data: any): number | null {
  return (
    toSafeNumber(data?.credits) ??
    toSafeNumber(data?.balance) ??
    toSafeNumber(data?.aiCredits) ??
    toSafeNumber(data?.ai_credits) ??
    toSafeNumber(data?.creditBalance) ??
    toSafeNumber(data?.credit_balance) ??
    toSafeNumber(data?.data?.credits) ??
    toSafeNumber(data?.data?.balance) ??
    null
  );
}

function readSavedCount(data: any, fallback: number) {
  return toSafeNumber(data?.savedCount) ?? toSafeNumber(data?.saved_count) ?? fallback;
}

function readSavedLimit(data: any, fallback: number) {
  return toSafeNumber(data?.savedLimit) ?? toSafeNumber(data?.saved_limit) ?? toSafeNumber(data?.limit) ?? fallback;
}

function sameGeneratedImage(a: AiImageItem, b: AiImageItem) {
  const aGenerationId = String(a.generationId || (a as any).generation_id || "").trim();
  const bGenerationId = String(b.generationId || (b as any).generation_id || "").trim();

  if (aGenerationId && bGenerationId) return aGenerationId === bGenerationId;

  const aSrc = getImageSrc(a);
  const bSrc = getImageSrc(b);

  return Boolean(aSrc && bSrc && aSrc === bSrc);
}

export function useAiImages({ createElement }: UseAiImagesArgs) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [buyingCredits, setBuyingCredits] = useState(false);
  const [lastAddedSrc, setLastAddedSrc] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<AiImageItem[]>([]);
  const [savedImages, setSavedImages] = useState<AiImageItem[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [creditPacks, setCreditPacks] = useState<AiCreditPack[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [savedLimit, setSavedLimit] = useState(FREE_SAVED_IMAGE_LIMIT);

  const visibleImages = useMemo(() => {
    const savedGenerationIds = new Set(
      savedImages
        .map((item) => String(item.generationId || (item as any).generation_id || "").trim())
        .filter(Boolean),
    );

    const savedUrls = new Set(savedImages.map(getImageSrc).filter(Boolean));

    const unsavedGeneratedImages = generatedImages.filter((item) => {
      const generationId = String(item.generationId || (item as any).generation_id || "").trim();
      const src = getImageSrc(item);

      if (generationId && savedGenerationIds.has(generationId)) return false;
      if (src && savedUrls.has(src)) return false;

      return true;
    });

    return [...unsavedGeneratedImages, ...savedImages];
  }, [generatedImages, savedImages]);

  const loadCredits = useCallback(async () => {
    try {
      const data = await fetchAiCredits();
      if (!data) return;

      const nextCredits = readCreditBalance(data);
      if (nextCredits !== null) setCredits(nextCredits);

      setSavedCount(readSavedCount(data, 0));
      setSavedLimit(readSavedLimit(data, FREE_SAVED_IMAGE_LIMIT));
    } catch {}
  }, []);

  const loadCreditPacks = useCallback(async () => {
    try {
      const packs = await fetchCreditPacks();
      setCreditPacks(packs);
    } catch {
      setCreditPacks([]);
    }
  }, []);

  const loadSavedImages = useCallback(async () => {
    try {
      const { data } = await fetchSavedImages();
      if (!data) return;

      const rows = Array.isArray(data.images)
        ? data.images
        : Array.isArray(data.items)
          ? data.items
          : [];

      const saved = rows
      .map(normalizeSavedImage)
      .filter((item: AiImageItem) => isValidImageUrl(getImageSrc(item)));

      const nextLimit = readSavedLimit(data, FREE_SAVED_IMAGE_LIMIT);

      setSavedImages(saved);
      setSavedCount(readSavedCount(data, saved.length));
      setSavedLimit(nextLimit);
    } catch {}
  }, []);

  useEffect(() => {
    loadCredits();
    loadSavedImages();
    loadCreditPacks();
  }, [loadCredits, loadSavedImages, loadCreditPacks]);

  const randomPrompt = useCallback(() => {
    const item = PROMPT_EXAMPLES[Math.floor(Math.random() * PROMPT_EXAMPLES.length)];

    setPrompt(item || "");
    setError("");
    setNotice("Prompt ready. You can generate now.");
  }, []);

  const addImageToCanvas = useCallback(
    (item: AiImageItem) => {
      const src = getImageSrc(item);

      if (!isValidImageUrl(src)) {
        setError("Invalid image URL. Try generating again.");
        return;
      }

      const size = fitWithinBox(item.width, item.height, 300);

      createElement?.({
        type: "image",
        src,
        printUrl: src,
        imageUrl: src,
        url: src,
        crossOrigin: "anonymous",
        width: size.width,
        height: size.height,
        meta: {
          prompt: item.prompt || item.title,
          transparent: true,
          source: "ai-generated-print",
          naturalWidth: item.width || AI_IMAGE_QUALITY.targetOutputPixels,
          naturalHeight: item.height || AI_IMAGE_QUALITY.targetOutputPixels,
          dpi: item.dpi || AI_IMAGE_QUALITY.dpi,
          metadataDpi: AI_IMAGE_QUALITY.metadataDpi,
          qualityMode: item.qualityMode || "ultra-print",
          objectFit: "fill",
          opacity: 1,
        },
      });

      setLastAddedSrc(src);
      setNotice("Added to canvas. Ready for print preview.");
    },
    [createElement],
  );

  const saveImage = useCallback(
    async (item: AiImageItem) => {
      if (item.saved || item.id) return;

      if (savedCount >= savedLimit) {
        setError("You've reached your saved image limit. Delete one of your saved images or upgrade your plan.");
        return;
      }

      const imageUrl = getImageSrc(item);

      if (!isValidImageUrl(imageUrl)) {
        setError("Invalid image URL. Try generating again.");
        return;
      }

      try {
        const localSavingId = item.generationId || imageUrl;

        setSavingId(localSavingId);
        setError("");
        setNotice("Saving image...");

        const { response, data } = await saveGeneratedImage(item);

        if (response.status === 401) {
          setShowAuthPopup(true);
          setNotice("Sign in to save AI images.");
          return;
        }

        if (response.status === 409) {
          setError("You've reached your saved image limit. Delete one of your saved images or upgrade your plan.");
          setSavedCount(readSavedCount(data, savedCount));
          setSavedLimit(readSavedLimit(data, savedLimit));
          return;
        }

        if (!response.ok) throw new Error(data.error || "Failed to save image");

        const savedItem = normalizeSavedImage(data.image);
        const nextSavedCount = readSavedCount(data, savedCount + 1);
        const nextSavedLimit = readSavedLimit(data, savedLimit);

        setSavedImages((prev) => [
          savedItem,
          ...prev.filter((current) => {
            if (current.id && current.id === savedItem.id) return false;
            if (current.generationId && current.generationId === savedItem.generationId) return false;
            return getImageSrc(current) !== imageUrl;
          }),
        ]);

        setGeneratedImages((prev) => prev.filter((current) => !sameGeneratedImage(current, item)));
        setSavedCount(nextSavedCount);
        setSavedLimit(nextSavedLimit);
        setNotice(`Image saved. ${nextSavedCount}/${nextSavedLimit} saved.`);
      } catch {
        setError("Could not save this image.");
      } finally {
        setSavingId(null);
      }
    },
    [savedCount, savedLimit],
  );

  const generateImage = useCallback(async () => {
    const cleanPrompt = safePrompt(prompt);
    if (!cleanPrompt || loading) return;

    try {
      setLoading(true);
      setError("");
      setNotice("Creating transparent print asset...");

      const { response, data } = await requestAiImage(cleanPrompt);

      if (response.status === 401) {
        setShowAuthPopup(true);
        setNotice("Sign in to unlock AI generation. Your work stays here.");
        return;
      }

      if (response.status === 402) {
        const nextCredits = readCreditBalance(data);
        if (nextCredits !== null) setCredits(nextCredits);
        setError("You have 0 AI credits left.");
        setShowCreditsModal(true);
        return;
      }

      if (!response.ok) throw new Error(data.error || "AI generation failed");

      const image = normalizeGeneratedImageResponse(data);

      if (!image?.src || !isValidImageUrl(image.src)) throw new Error("Missing image");

      const newItem: AiImageItem = {
        title: cleanPrompt,
        prompt: cleanPrompt,
        src: image.src,
        imageUrl: image.src,
        image_url: image.src,
        url: image.src,
        printUrl: image.printUrl || image.src,
        r2Key: image.r2Key,
        storage_key: image.storage_key,
        generationId: image.generationId,
        originalImageUrl: image.originalImageUrl,
        width: image.width,
        height: image.height,
        dpi: image.dpi,
        transparent: true,
        saved: false,
        qualityMode: AI_IMAGE_QUALITY.mode,
      };

      setGeneratedImages((prev) => [
        newItem,
        ...prev.filter((current) => !sameGeneratedImage(current, newItem)),
      ]);

      const nextCredits = readCreditBalance(data);
      if (nextCredits !== null) setCredits(nextCredits);

      setNotice("Image created. Click Save if you want to keep it.");
      await loadCredits();
    } catch {
      setError("Generation failed. If a credit was charged, the backend will refund it automatically.");
      await loadCredits();
    } finally {
      setLoading(false);
    }
  }, [prompt, loading, loadCredits]);

  const deleteImage = useCallback(async (item: AiImageItem) => {
    if (!item.id) {
      setGeneratedImages((prev) => prev.filter((current) => current !== item));
      return;
    }

    try {
      setDeletingId(item.id);
      setError("");
      setNotice("Deleting image...");

      const { response, data } = await deleteSavedImage(item.id);

      if (!response.ok) throw new Error(data.error || "Failed to delete image");

      const deletedId = data.deletedId || item.id;

      setSavedImages((prev) => prev.filter((current) => current.id !== deletedId));
      setSavedCount((prev) => Math.max(prev - 1, 0));
      setNotice("Image removed from saved designs.");
    } catch {
      setError("Could not delete this image.");
    } finally {
      setDeletingId(null);
    }
  }, []);

  const buyCredits = useCallback(async ({ packId, source = "editor" }: BuyCreditsOptions) => {
    try {
      setBuyingCredits(true);
      setError("");
      setNotice("Opening secure checkout...");

      const { response, data } = await createAiCreditsCheckout(packId, source);

      if (response.status === 401) {
        setShowAuthPopup(true);
        setNotice("Sign in to buy AI credits.");
        return;
      }

      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Could not create checkout session");
      }

      window.open(data.url, "_blank", "noopener,noreferrer");
      setNotice("Checkout opened in a new tab. Your editor stays open here.");
    } catch {
      setError("Could not open credits checkout.");
    } finally {
      setBuyingCredits(false);
    }
  }, []);

  const handleAuthSuccess = useCallback(() => {
    setShowAuthPopup(false);
    setNotice("You are signed in. AI image generation is ready.");
    setError("");
    loadCredits();
    loadSavedImages();
  }, [loadCredits, loadSavedImages]);

  return {
    prompt,
    setPrompt,
    loading,
    savingId,
    deletingId,
    notice,
    setNotice,
    error,
    setError,
    showAuthPopup,
    setShowAuthPopup,
    authVariant: "ai_credits" as const,
    showCreditsModal,
    setShowCreditsModal,
    buyingCredits,
    lastAddedSrc,
    generatedImages: visibleImages,
    credits,
    creditPacks,
    savedCount,
    savedLimit,
    refreshCredits: loadCredits,
    randomPrompt,
    addImageToCanvas,
    generateImage,
    saveImage,
    deleteImage,
    buyCredits,
    handleAuthSuccess,
  };
}
