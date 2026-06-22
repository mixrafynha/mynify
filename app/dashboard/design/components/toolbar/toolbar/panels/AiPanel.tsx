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

function buildFinalPrompt(prompt: string) {
  return `${prompt}

Print-ready apparel graphic.
Transparent background.
No mockup. No shirt. No person. No watermark. No copyrighted logo.
Centered PNG alpha. Sharp edges. 4096px to 8192px output.`;
}

export default function AiPanel({ createElement }: { createElement?: (data: any) => void }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [lastAddedSrc, setLastAddedSrc] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const previewImages = useMemo(() => {
    if (!showPreview) return [];

    return IMAGE_TEMPLATES.slice(0, 6).map((item: any) => ({
      title: item.title || item.label,
      prompt: `${item.title || item.label} ${(item.tags || []).join(" ")} transparent apparel graphic`,
      src: item.previewUrl || item.printUrl,
      printUrl: item.printUrl,
      width: item.width || AI_IMAGE_QUALITY.targetOutputPixels,
      height: item.height || AI_IMAGE_QUALITY.targetOutputPixels,
      dpi: item.dpi || AI_IMAGE_QUALITY.dpi,
      transparent: true,
      qualityMode: "print-reference",
    }));
  }, [showPreview]);

  const randomPrompt = useCallback(() => {
    const source = showPreview && previewImages.length ? previewImages : IMAGE_TEMPLATES;
    const item: any = source[Math.floor(Math.random() * source.length)];
    if (!item) return;

    setPrompt(`${item.title || item.label} ${(item.tags || []).join(" ")} transparent apparel graphic`);
    setError("");
    setNotice("");
  }, [previewImages, showPreview]);

  const addImageToCanvas = useCallback(
    (item: any) => {
      createElement?.({
        type: "image",
        src: item.printUrl || item.src,
        width: 300,
        height: 300,
        meta: {
          prompt: item.prompt || item.title,
          transparent: true,
          source: item.generationId ? "ai-generated-print" : "print-reference",
          naturalWidth: item.width || AI_IMAGE_QUALITY.targetOutputPixels,
          naturalHeight: item.height || AI_IMAGE_QUALITY.targetOutputPixels,
          dpi: item.dpi || AI_IMAGE_QUALITY.dpi,
          metadataDpi: AI_IMAGE_QUALITY.metadataDpi,
          qualityMode: item.qualityMode || "ultra-print",
        },
      });

      setLastAddedSrc(item.src);
      setNotice("Adicionado.");
    },
    [createElement]
  );

  const generateImage = useCallback(async () => {
    const cleanPrompt = safePrompt(prompt);
    if (!cleanPrompt || loading) return;

    try {
      setLoading(true);
      setError("");
      setNotice("A criar...");

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
        setNotice("");
        return;
      }

      if (!response.ok) throw new Error();

      const data = await response.json();
      const src = data.url || data.imageUrl || data.src;
      if (!src) throw new Error();

      setGeneratedImages((prev) =>
        [
          {
            title: cleanPrompt,
            prompt: cleanPrompt,
            src,
            generationId: data.id,
            width: data.width || AI_IMAGE_QUALITY.targetOutputPixels,
            height: data.height || AI_IMAGE_QUALITY.targetOutputPixels,
            dpi: data.dpi || AI_IMAGE_QUALITY.dpi,
            transparent: true,
            qualityMode: AI_IMAGE_QUALITY.mode,
          },
          ...prev,
        ].slice(0, 8)
      );

      setNotice("Criado.");
    } catch {
      setError("Erro.");
    } finally {
      setLoading(false);
    }
  }, [prompt, loading]);

  return (
    <div className="space-y-3 pb-5 text-white">
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

      <UserGeneratedImages
        images={generatedImages}
        lastAddedSrc={lastAddedSrc}
        onAdd={addImageToCanvas}
      />

      <button
        type="button"
        onClick={() => setShowPreview((v) => !v)}
        className="h-10 w-full rounded-xl bg-white/[0.06] text-xs font-black text-slate-300 active:scale-[0.98]"
      >
        {showPreview ? "Ocultar inspiração" : "Mostrar inspiração"}
      </button>

      {showPreview && (
        <PreviewImages
          images={previewImages}
          lastAddedSrc={lastAddedSrc}
          onAdd={addImageToCanvas}
        />
      )}

      <AuthPopup
        open={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        onSuccess={() => setShowAuthPopup(false)}
      />
    </div>
  );
}