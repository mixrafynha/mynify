"use client";

import { useCallback, useMemo, useState } from "react";
import AuthPopup from "./AuthPopup";
import AiPromptBox from "./AiPromptBox";
import PreviewImages from "./PreviewImages";
import UserGeneratedImages from "./UserGeneratedImages";
import { AI_IMAGE_QUALITY, IMAGE_TEMPLATES } from "../data";

function safePrompt(value: string) {
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 180);
}


function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (Array.isArray(value)) {
      const found = firstString(...value);
      if (found) return found;
    }
  }
  return null;
}

function normalizeGeneratedImageResponse(data: any) {
  const src = firstString(
    data?.url,
    data?.imageUrl,
    data?.src,
    data?.image,
    data?.output,
    data?.images,
    data?.imageUrls,
    data?.urls,
    data?.data?.url,
    data?.data?.imageUrl,
    data?.data?.images,
  );

  if (!src) return null;

  return {
    src,
    printUrl: firstString(data?.printUrl, data?.print_url, data?.assetUrl, data?.asset_url) || src,
    id: data?.id || data?.generationId || data?.generation_id,
    width: Number(data?.width || data?.naturalWidth || data?.metadata?.width) || AI_IMAGE_QUALITY.targetOutputPixels,
    height: Number(data?.height || data?.naturalHeight || data?.metadata?.height) || AI_IMAGE_QUALITY.targetOutputPixels,
    dpi: Number(data?.dpi || data?.metadata?.dpi) || AI_IMAGE_QUALITY.dpi,
  };
}

function fitWithinBox(width: unknown, height: unknown, max = 300) {
  const naturalWidth = Math.max(1, Number(width) || max);
  const naturalHeight = Math.max(1, Number(height) || max);
  const ratio = Math.min(1, max / naturalWidth, max / naturalHeight);
  return {
    width: Math.max(48, Math.round(naturalWidth * ratio)),
    height: Math.max(48, Math.round(naturalHeight * ratio)),
  };
}

function buildFinalPrompt(prompt: string) {
  return `${prompt}

Print-ready apparel graphic.
Transparent background.
No mockup. No shirt. No person. No watermark. No copyrighted logo. No brand name.
Centered PNG alpha. Sharp edges. High detail. 4096px to 8192px output.`;
}

export default function AiPanel({ createElement }: { createElement?: (data: any) => void }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [lastAddedSrc, setLastAddedSrc] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);

  const previewImages = useMemo(
    () =>
      IMAGE_TEMPLATES.slice(0, 8).map((item: any) => ({
        title: item.title || item.label || "Print asset",
        prompt: `${item.title || item.label || "Premium print asset"} ${(item.tags || []).join(" ")} transparent apparel graphic`,
        src: item.previewUrl || item.printUrl || item.src,
        printUrl: item.printUrl || item.src || item.previewUrl,
        width: item.width || AI_IMAGE_QUALITY.targetOutputPixels,
        height: item.height || AI_IMAGE_QUALITY.targetOutputPixels,
        dpi: item.dpi || AI_IMAGE_QUALITY.dpi,
        transparent: true,
        qualityMode: "print-reference",
      })),
    []
  );

  const randomPrompt = useCallback(() => {
    const item: any = previewImages[Math.floor(Math.random() * previewImages.length)];
    if (!item) return;

    setPrompt(item.prompt);
    setError("");
    setNotice("Prompt ready. You can generate now.");
  }, [previewImages]);

  const addImageToCanvas = useCallback(
    (item: any) => {
      const src = item.printUrl || item.src;
      if (!src) return;

      const size = fitWithinBox(item.width, item.height, 300);

      createElement?.({
        type: "image",
        src,
        width: size.width,
        height: size.height,
        meta: {
          prompt: item.prompt || item.title,
          transparent: true,
          source: item.generationId ? "ai-generated-print" : "print-reference",
          naturalWidth: item.width || AI_IMAGE_QUALITY.targetOutputPixels,
          naturalHeight: item.height || AI_IMAGE_QUALITY.targetOutputPixels,
          dpi: item.dpi || AI_IMAGE_QUALITY.dpi,
          metadataDpi: AI_IMAGE_QUALITY.metadataDpi,
          qualityMode: item.qualityMode || "ultra-print",
          objectFit: "fill",
          opacity: 1,
        },
      });

      setLastAddedSrc(item.src || src);
      setNotice("Added to canvas. Ready for print preview.");
    },
    [createElement]
  );

  const generateImage = useCallback(async () => {
    const cleanPrompt = safePrompt(prompt);
    if (!cleanPrompt || loading) return;

    try {
      setLoading(true);
      setError("");
      setNotice("Creating transparent print asset...");

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

      if (response.status === 401 || response.status === 402) {
        setShowAuthPopup(true);
        setNotice("Sign in to unlock AI generation. Your work stays here.");
        return;
      }

      if (!response.ok) throw new Error("AI generation failed");

      const data = await response.json();
      const image = normalizeGeneratedImageResponse(data);
      if (!image?.src) throw new Error("Missing image");

      setGeneratedImages((prev) =>
        [
          {
            title: cleanPrompt,
            prompt: cleanPrompt,
            src: image.src,
            printUrl: image.printUrl,
            generationId: image.id,
            width: image.width,
            height: image.height,
            dpi: image.dpi,
            transparent: true,
            qualityMode: AI_IMAGE_QUALITY.mode,
          },
          ...prev,
        ].slice(0, 8)
      );

      setNotice("Done. Your image is ready to add to the canvas.");
    } catch {
      setError("Generation failed. Check /api/ai-image and try again.");
    } finally {
      setLoading(false);
    }
  }, [prompt, loading]);

  return (
    <div className="relative min-h-[560px] space-y-4 pb-5 text-white">
      <AiPromptBox
        prompt={prompt}
        loading={loading}
        notice={notice}
        error={error}
        setPrompt={setPrompt}
        setNotice={setNotice}
        setError={setError}
        randomPrompt={randomPrompt}
        generateImage={generateImage}
      />

      <StatusLine notice={notice} error={error} />

      <UserGeneratedImages images={generatedImages} lastAddedSrc={lastAddedSrc} onAdd={addImageToCanvas} />

      <div className="pt-1">
        <div className="mb-2 flex items-center justify-between gap-3 px-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-200/80">Inspiration</p>
          <p className="text-[11px] font-bold text-white/35">print-ready references</p>
        </div>
        <PreviewImages images={previewImages} lastAddedSrc={lastAddedSrc} onAdd={addImageToCanvas} />
      </div>

      <AuthPopup
        open={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        onSuccess={() => {
          setShowAuthPopup(false);
          setNotice("You are signed in. AI image generation is ready.");
          setError("");
        }}
      />
    </div>
  );
}

function StatusLine({ notice, error }: { notice: string; error: string }) {
  const message = error || notice;
  if (!message) return null;

  return (
    <p className={`px-1 text-xs font-bold leading-relaxed ${error ? "text-red-300" : "text-violet-200"}`}>
      {message}
    </p>
  );
}
