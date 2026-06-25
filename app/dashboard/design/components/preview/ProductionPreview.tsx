"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, RefreshCw, RotateCcw, Shirt, X } from "lucide-react";
import PreviewMockup from "./PreviewMockup";
import { usePreviewData } from "./hooks/usePreviewData";
import {
  captureVisualMockupPreview,
  downloadDataUrl,
} from "./services/previewCapture";
import type { ProductionPreviewInput, PreviewSide } from "./types/preview";

type ImagesBySide = Partial<Record<PreviewSide, string[]>>;
type DesignImageBySide = Partial<Record<PreviewSide, string>>;

function normalizeImages(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeImages(item)).filter(Boolean);
  }
  if (typeof value === "string") return value ? [value] : [];

  return normalizeImages(
    value.mockupImages ||
      value.images ||
      value.imageUrls ||
      value.urls ||
      value.mockupUrl ||
      value.imageUrl ||
      value.url ||
      value.data,
  );
}

function uniqueImages(images: string[]) {
  return images
    .filter(Boolean)
    .filter((img, index, arr) => arr.indexOf(img) === index);
}

function ProductionPreview({
  input,
  onClose,
}: {
  input: ProductionPreviewInput;
  onClose: () => void;
  onSaveDesign?: () => Promise<void> | void;
}) {
  const preview = usePreviewData(input);
  const [activeSide, setActiveSide] = useState<PreviewSide>(preview.activeSide);
  const [generatedBySide, setGeneratedBySide] = useState<ImagesBySide>({});
  const [designImageBySide, setDesignImageBySide] = useState<DesignImageBySide>(
    {},
  );
  const [activeImageIndexBySide, setActiveImageIndexBySide] = useState<
    Partial<Record<PreviewSide, number>>
  >({});
  const [backendError, setBackendError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const captureRef = useRef<HTMLDivElement | null>(null);
  const requestLockBySideRef = useRef<Partial<Record<PreviewSide, boolean>>>(
    {},
  );
  const generatedKeyBySideRef = useRef<Partial<Record<PreviewSide, string>>>(
    {},
  );
  const disabledMockupKeyBySideRef = useRef<
    Partial<Record<PreviewSide, string>>
  >({});

  const current = useMemo(
    () => (activeSide === "back" ? preview.back : preview.front),
    [activeSide, preview.back, preview.front],
  );

  const sideImages = generatedBySide[activeSide] || [];
  const activeImageIndex = Math.min(
    activeImageIndexBySide[activeSide] || 0,
    Math.max(0, sideImages.length - 1),
  );

  const activeGeneratedImage = sideImages[activeImageIndex] || null;

  const activeDesignImage =
    designImageBySide[activeSide] ||
    input.designImages?.[activeSide] ||
    (input.designImage && input.side === activeSide ? input.designImage : null);

  const requestBodyBase = useMemo(
    () => ({
      productId: input.productId || preview.productId,
      category: input.category || preview.category,
      color: input.color || input.mockupColor || preview.mockupColor,
      side: activeSide,
      elements: current.elements || [],
      frontElements: input.frontElements || [],
      backElements: input.backElements || [],
      printBox: input.printBox || current.printBox,
      safeArea: input.safeArea || current.safeArea,
      mockupMode: input.mockupMode || "on_model_ai",
      modelMockup: input.modelMockup ?? true,
      poses: [
        "studio-front",
        "streetwear-front",
        "three-quarter",
        "lifestyle-close",
        "urban-walk",
        "close-crop",
      ],
    }),
    [
      activeSide,
      current,
      input,
      preview.category,
      preview.mockupColor,
      preview.productId,
    ],
  );

  const generateMockup = useCallback(
    async (force = false) => {
      const designImage =
        designImageBySide[activeSide] ||
        input.designImages?.[activeSide] ||
        (input.designImage && input.side === activeSide
          ? input.designImage
          : null);

      const requestKey = JSON.stringify({
        productId: input.productId || preview.productId,
        category: input.category || preview.category,
        side: activeSide,
        color: input.color || input.mockupColor || preview.mockupColor,
        designImageLength: designImage?.length || 0,
      });

      if (!designImage) {
        disabledMockupKeyBySideRef.current[activeSide] = requestKey;
        setBackendError("Missing design image from preview storage.");
        setGeneratedBySide((prev) => ({ ...prev, [activeSide]: [] }));
        return;
      }

      if (requestLockBySideRef.current[activeSide]) return;

      if (!force && generatedKeyBySideRef.current[activeSide] === requestKey) {
        return;
      }

      if (
        !force &&
        disabledMockupKeyBySideRef.current[activeSide] === requestKey
      ) {
        return;
      }

      try {
        requestLockBySideRef.current[activeSide] = true;
        generatedKeyBySideRef.current[activeSide] = requestKey;
        setGenerating(true);
        setBackendError(null);

        setDesignImageBySide((prev) => ({
          ...prev,
          [activeSide]: designImage,
        }));

        const response = await fetch("/api/products/generate-own-mockup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...requestBodyBase,
            designImage,
            elements: [],
            renderMode: "designImage-only",
          }),
        });

        const data = await response.json().catch(() => null);

        if (response.status === 404 || response.status === 405) {
          disabledMockupKeyBySideRef.current[activeSide] = requestKey;
          setBackendError(null);
          setGeneratedBySide((prev) => ({ ...prev, [activeSide]: [] }));
          return;
        }

        if (!response.ok || data?.success === false) {
          throw new Error(
            data?.error || data?.message || "AI mockup generation failed",
          );
        }

        const images = uniqueImages([
          ...normalizeImages(data?.mockupImages),
          ...normalizeImages(data?.images),
          ...normalizeImages(data?.imageUrls),
          ...normalizeImages(data?.urls),
          ...normalizeImages(data?.mockupUrl),
          ...normalizeImages(data?.imageUrl),
          ...normalizeImages(data?.url),
        ]);

        if (!images.length) {
          throw new Error("Mockup API did not return images.");
        }

        setProvider(data?.provider || "mockup-api");
        setGeneratedBySide((prev) => ({ ...prev, [activeSide]: images }));
        setActiveImageIndexBySide((prev) => ({ ...prev, [activeSide]: 0 }));
      } catch (error: any) {
        generatedKeyBySideRef.current[activeSide] = undefined;
        disabledMockupKeyBySideRef.current[activeSide] = requestKey;
        console.error("MOCKUP GENERATION ERROR:", error);
        setBackendError(
          error?.message ||
            "AI mockup generation failed. Showing clean product preview.",
        );
        setGeneratedBySide((prev) => ({ ...prev, [activeSide]: [] }));
      } finally {
        setGenerating(false);
        requestLockBySideRef.current[activeSide] = false;
      }
    },
    [
      activeSide,
      designImageBySide,
      input.category,
      input.color,
      input.designImage,
      input.designImages,
      input.mockupColor,
      input.productId,
      input.side,
      preview.category,
      preview.mockupColor,
      preview.productId,
      requestBodyBase,
    ],
  );

  useEffect(() => {
    generateMockup(false);
  }, [activeSide, generateMockup]);

  async function downloadPreview() {
    const root = captureRef.current?.querySelector(
      "[data-production-preview-root]"
    ) as HTMLElement | null;

    const dataUrl = await captureVisualMockupPreview(root || captureRef.current);
    if (!dataUrl) return;

    downloadDataUrl(
      dataUrl,
      `ryfio-${preview.productId}-${activeSide}-mockup-preview.png`,
    );
  }

  return (
    <div
      className="relative flex h-dvh w-screen flex-col overflow-hidden bg-[#f4f1ec] text-black"
      data-ryfio-preview-root
    >
      <div className="absolute left-0 right-0 top-0 z-50 flex items-center justify-between gap-2 p-2 pt-[calc(env(safe-area-inset-top)+8px)] sm:p-4">
        <div className="flex items-center gap-1 rounded-full border border-black/5 bg-white/90 p-1 text-black shadow-[0_18px_45px_rgba(0,0,0,.14)] backdrop-blur-2xl">
          {(["front", "back"] as PreviewSide[]).map((value) => {
            const active = value === activeSide;

            return (
              <button
                key={value}
                type="button"
                onClick={() => setActiveSide(value)}
                className={`flex h-9 min-w-[72px] items-center justify-center gap-1.5 rounded-full px-3 text-[11px] font-black uppercase tracking-[.08em] transition active:scale-95 ${
                  active
                    ? "bg-black text-white"
                    : "text-black/55 hover:bg-black/5 hover:text-black"
                }`}
              >
                <Shirt size={13} />
                {value}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 rounded-full border border-black/5 bg-white/90 p-1 text-black shadow-[0_18px_45px_rgba(0,0,0,.14)] backdrop-blur-2xl">
          <button
            type="button"
            onClick={() => generateMockup(true)}
            disabled={generating}
            className="flex h-9 w-9 items-center justify-center rounded-full text-black/65 transition hover:bg-black/5 hover:text-black active:scale-95 disabled:opacity-40"
            title="Regenerate AI mockups"
            aria-label="Regenerate AI mockups"
          >
            {generating ? (
              <RotateCcw size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
          </button>

          <button
            type="button"
            onClick={downloadPreview}
            className="flex h-9 w-9 items-center justify-center rounded-full text-black/65 transition hover:bg-black/5 hover:text-black active:scale-95"
            title="Download visual mockup preview"
            aria-label="Download visual mockup preview"
          >
            <Download size={16} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition hover:bg-black/85 active:scale-95"
            title="Close preview"
            aria-label="Close preview"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div ref={captureRef} className="min-h-0 flex-1 overflow-hidden">
        <PreviewMockup
          data={current}
          productId={preview.productId}
          color={preview.mockupColor}
          generatedMockupUrl={activeGeneratedImage}
          generatedDesignImageUrl={activeDesignImage}
          generatedIncludesDesign={Boolean(activeGeneratedImage)}
        />
      </div>

      {sideImages.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-50 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <div className="flex max-w-full gap-2 overflow-x-auto rounded-[28px] border border-black/5 bg-white/88 p-2 shadow-[0_18px_55px_rgba(0,0,0,.18)] backdrop-blur-2xl">
            {sideImages.map((img, index) => (
              <button
                key={`${img}-${index}`}
                type="button"
                onClick={() =>
                  setActiveImageIndexBySide((prev) => ({
                    ...prev,
                    [activeSide]: index,
                  }))
                }
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-2xl border bg-white transition active:scale-95 sm:h-20 sm:w-20 ${
                  index === activeImageIndex
                    ? "border-black shadow-[0_0_0_2px_rgba(0,0,0,.18)]"
                    : "border-black/10 opacity-70 hover:opacity-100"
                }`}
                aria-label={`Select pose ${index + 1}`}
              >
                <img
                  src={img}
                  alt={`Pose ${index + 1}`}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {(backendError || provider) && (
        <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+92px)] left-1/2 z-40 max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-full border border-black/5 bg-white/88 px-4 py-2 text-center text-[10px] font-black uppercase tracking-[.12em] text-black/55 shadow-lg backdrop-blur-xl sm:bottom-4">
          {backendError || `${provider} · ${sideImages.length || 0} poses`}
        </div>
      )}
    </div>
  );
}

export default memo(ProductionPreview);
