"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AI_IMAGE_QUALITY } from "../../data";
import { FREE_SAVED_IMAGE_LIMIT, PROMPT_EXAMPLES } from "./ai.constants";
import type { AiImageItem, UseAiImagesArgs } from "./ai.types";
import {
  deleteSavedImage,
  fetchSavedImages,
  fetchAiImageGeneration,
  requestAiImage,
  saveGeneratedImage,
} from "./ai.api";
import { fetchAiCredits } from "../credits/credits.api";
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

function pollDelayMs(status: string) {
  if (status === "finalizing") return 15_000;
  return 8_000;
}

function stageRank(status: string) {
  if (status === "completed" || status === "failed" || status === "canceled") return 4;
  if (status === "finalizing") return 3;
  if (status === "processing") return 2;
  if (status === "starting") return 1;
  return 0;
}

function backgroundRemovalRank(status: string) {
  if (status === "succeeded" || status === "failed" || status === "canceled") return 2;
  if (status === "processing" || status === "starting" || status === "queued") return 1;
  return 0;
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
  const [lastAddedSrc, setLastAddedSrc] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<AiImageItem[]>([]);
  const [savedImages, setSavedImages] = useState<AiImageItem[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [savedLimit, setSavedLimit] = useState(FREE_SAVED_IMAGE_LIMIT);
  const [activeGenerationId, setActiveGenerationId] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string>("idle");
  const pollGenerationRef = useRef<string | null>(null);
  const generationStageRef = useRef<Map<string, string>>(new Map());

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
  }, [loadCredits, loadSavedImages]);

  useEffect(() => {
    let cancelled = false;

    async function loadPendingGenerations() {
      try {
        const { response, data } = await fetchAiImageGeneration(null, false);
        if (!response.ok || cancelled) return;

        const generations = Array.isArray(data?.generations) ? data.generations : [];
        const pending = generations.find((item: any) => {
          const status = String(item?.status || "").toLowerCase();
          return status === "pending" || status === "queued" || status === "credit_reserved" || status === "starting" || status === "processing";
        });

        if (pending?.generationId) {
          setActiveGenerationId(String(pending.generationId));
          setLoading(true);
          setNotice("Generating...");
        }
      } catch {}
    }

    loadPendingGenerations();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;

    async function pollActiveGeneration() {
      const generationId = pollGenerationRef.current;
      if (!generationId || inFlight) return;
      inFlight = true;

      try {
        const { response, data } = await fetchAiImageGeneration(generationId, true);
        if (!response.ok || cancelled) return;

        const generation = data?.generation || null;
        const status = String(generation?.status || "").toLowerCase();
        const hasImageUrl = Boolean(generation?.imageUrl);
        const backgroundRemovalStatus = String(generation?.backgroundRemovalStatus || "").toLowerCase();
        const previousStatus = generationStageRef.current.get(generationId) || "pending";
        if (stageRank(status) < stageRank(previousStatus)) return;
        generationStageRef.current.set(generationId, status);
        setGenerationStatus(status);

        console.info("[AI_UI_POLL_RESULT]", {
          generationId,
          status,
          hasImageUrl,
        });

        const backgroundRemovalPending =
          status === "completed" &&
          backgroundRemovalRank(backgroundRemovalStatus) < backgroundRemovalRank("succeeded") &&
          backgroundRemovalStatus !== "failed" &&
          backgroundRemovalStatus !== "canceled";

        if (status === "completed" && hasImageUrl && !backgroundRemovalPending) {
          const completedItem = normalizeSavedImage({
            id: generation.id,
            generation_id: generation.generationId,
            prompt: generation.prompt,
            image_url: generation.imageUrl,
            storage_key: generation.storageKey,
            original_image_url: generation.originalImageUrl,
            original_storage_key: generation.originalStorageKey,
            background_removal_status: generation.backgroundRemovalStatus,
            background_removal_error: generation.backgroundRemovalError,
            status: "completed",
            is_saved: Boolean(generation.isSaved),
          });

          completedItem.saved = generation.isSaved === true;

          setGeneratedImages((prev) => [
            completedItem,
            ...prev.filter((current) => !sameGeneratedImage(current, completedItem)),
          ]);
          pollGenerationRef.current = null;
          setActiveGenerationId(null);
          setLoading(false);
          setGenerationStatus("completed");
          if (timer) clearTimeout(timer);
          timer = null;
          console.info("[AI_UI_POLL_STOP]", {
            generationId,
            reason: "completed",
          });
          setNotice("Image created. Click Save if you want to keep it.");
          await loadCredits();
          return;
        }

        if (status === "completed" && hasImageUrl && backgroundRemovalPending) {
          const completedItem = normalizeSavedImage({
            id: generation.id,
            generation_id: generation.generationId,
            prompt: generation.prompt,
            image_url: generation.imageUrl,
            storage_key: generation.storageKey,
            original_image_url: generation.originalImageUrl,
            original_storage_key: generation.originalStorageKey,
            background_removal_status: generation.backgroundRemovalStatus,
            background_removal_error: generation.backgroundRemovalError,
            status: "completed",
            is_saved: Boolean(generation.isSaved),
          });

          completedItem.saved = generation.isSaved === true;
          setGeneratedImages((prev) => [
            completedItem,
            ...prev.filter((current) => !sameGeneratedImage(current, completedItem)),
          ]);
          timer = setTimeout(pollActiveGeneration, pollDelayMs("finalizing"));
          return;
        }

        if (status === "failed" || status === "canceled") {
          pollGenerationRef.current = null;
          setActiveGenerationId(null);
          setLoading(false);
          setGenerationStatus(status);
          if (timer) clearTimeout(timer);
          timer = null;
          console.info("[AI_UI_POLL_STOP]", {
            generationId,
            reason: status,
          });
          setError(status === "canceled" ? "Generation canceled." : "Generation failed.");
          await loadCredits();
          return;
        }

        timer = setTimeout(pollActiveGeneration, pollDelayMs(status));
      } catch {
        timer = setTimeout(pollActiveGeneration, 12000);
      } finally {
        inFlight = false;
      }
    }

    if (activeGenerationId) {
      pollGenerationRef.current = activeGenerationId;
      if (!generationStageRef.current.has(activeGenerationId)) {
        generationStageRef.current.set(activeGenerationId, "pending");
      }
      setGenerationStatus(generationStageRef.current.get(activeGenerationId) || "starting");
      console.info("[AI_UI_POLL_START]", { generationId: activeGenerationId });
      timer = setTimeout(pollActiveGeneration, 1000);
    } else {
      pollGenerationRef.current = null;
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [activeGenerationId, loadCredits]);

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
      if (item.saved || item.isSaved) return;

      if (savedCount >= savedLimit) {
        setError("You've reached your saved image limit. Delete one of your saved images or upgrade your plan.");
        return;
      }

      const imageUrl = getImageSrc(item);
      const generationId = String(item.generationId || item.generation_id || "").trim();
      const rowId = String(item.id || "").trim();
      const status = String(item.status || "").toLowerCase();

      if (status !== "completed" || !isValidImageUrl(imageUrl)) {
        setError("Invalid image URL. Try generating again.");
        return;
      }

      try {
        const localSavingId = rowId || generationId || imageUrl;

        setSavingId(localSavingId);
        setError("");
        setNotice("Saving image...");
        console.info("[AI_SAVE_CLICK]", {
          rowId: rowId || null,
          frontendIsSaved: Boolean(item.isSaved),
        });

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

        setGeneratedImages((prev) =>
          prev.map((current) =>
            sameGeneratedImage(current, item)
              ? {
                  ...current,
                  isSaved: true,
                  id: savedItem.id,
                  generationId: savedItem.generationId || current.generationId,
                  status: "completed",
                }
              : current,
          ),
        );
        setSavedCount(nextSavedCount);
        setSavedLimit(nextSavedLimit);
        console.info("[AI_SAVE_DB_CHECK]", {
          rowId: rowId || null,
          databaseIsSaved: savedItem.isSaved === true,
        });
        setNotice(`Image saved. ${nextSavedCount}/${nextSavedLimit} saved.`);
      } catch {
        console.info("[AI_SAVE_DB_CHECK]", {
          rowId: rowId || null,
          databaseIsSaved: null,
        });
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

    let shouldKeepLoading = false;

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

      if (!response.ok && response.status !== 202) throw new Error(data.error || "AI generation failed");

      const image = normalizeGeneratedImageResponse(data);

      const generation = data?.generation || null;
      const generationId = image?.generationId || generation?.generationId || generation?.generation_id || null;

      if (response.status === 202 || String(generation?.status || "").toLowerCase() !== "completed") {
        const nextGenerationId = String(generationId || "").trim() || null;
        pollGenerationRef.current = nextGenerationId;
        setActiveGenerationId(nextGenerationId);
        shouldKeepLoading = Boolean(generationId);
        setNotice("Generating...");
        return;
      }

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
        status: "completed",
        isSaved: false,
        transparent: true,
        saved: false,
        qualityMode: AI_IMAGE_QUALITY.mode,
      };

      setGeneratedImages([newItem]);

      const nextCredits = readCreditBalance(data);
      if (nextCredits !== null) setCredits(nextCredits);

      setNotice("Image created. Click Save if you want to keep it.");
      await loadCredits();
    } catch {
      setError("Generation failed. If a credit was charged, the backend will refund it automatically.");
      await loadCredits();
    } finally {
      if (!shouldKeepLoading) {
        setActiveGenerationId(null);
        setLoading(false);
      }
    }
  }, [prompt, loading, loadCredits, activeGenerationId]);

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
    lastAddedSrc,
    generatedImages: visibleImages,
    credits,
    savedCount,
    savedLimit,
    activeGenerationId,
    generationStatus,
    refreshCredits: loadCredits,
    randomPrompt,
    addImageToCanvas,
    generateImage,
    saveImage,
    deleteImage,
    handleAuthSuccess,
  };
}
