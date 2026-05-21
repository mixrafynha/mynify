"use client";

import { useMemo, useState } from "react";
import {
  Wand2,
  Sparkles,
  Shuffle,
  Plus,
  Loader2,
  ImagePlus,
} from "lucide-react";

const previewImages = [
  {
    title: "Vintage Tiger",
    prompt: "vintage tiger t-shirt graphic",
    src: "https://images.unsplash.com/photo-1615963244664-5b845b2025ee?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Rose & Bee",
    prompt: "rose with bee product graphic",
    src: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Dog Logo",
    prompt: "cute dog mascot logo",
    src: "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Skull Flowers",
    prompt: "skull with flowers tattoo graphic",
    src: "https://images.unsplash.com/photo-1606122017369-d782bbb78f32?q=80&w=900&auto=format&fit=crop",
  },
];

function randomItem() {
  return previewImages[Math.floor(Math.random() * previewImages.length)];
}

function safePrompt(value: string) {
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").slice(0, 160);
}

function buildFinalPrompt(prompt: string) {
  return `
${prompt}

Clean isolated product graphic.
Transparent background.
No mockup.
No shirt.
No hoodie.
No person.
No background.
No shadows.
Centered design.
High quality PNG style.
Perfect for printing on t-shirts, hoodies and products.
`.trim();
}

export default function AiPanel({ createElement }: any) {
  const first = useMemo(() => randomItem(), []);

  const [prompt, setPrompt] = useState(first.prompt);
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState(previewImages);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastAddedSrc, setLastAddedSrc] = useState<string | null>(null);

  const generateImage = async () => {
    const cleanPrompt = safePrompt(prompt.trim());
    if (!cleanPrompt || loading) return;

    try {
      setLoading(true);
      setError("");
      setNotice("Generating image...");

      const finalPrompt = buildFinalPrompt(cleanPrompt);

      const response = await fetch("/api/ai-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          originalPrompt: cleanPrompt,
          transparent: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate image");
      }

      if (!data?.imageUrl) {
        throw new Error("No image returned");
      }

      setGeneratedImages((prev) => [
        {
          title: cleanPrompt,
          prompt: cleanPrompt,
          src: data.imageUrl,
          finalPrompt,
          generationId: data.generationId,
        },
        ...prev,
      ]);

      setNotice("Image ready. Click it to add it to the canvas.");
    } catch (err) {
      console.error(err);
      setNotice("");
      setError(err instanceof Error ? err.message : "Failed to generate image");
    } finally {
      setLoading(false);
    }
  };

  const addImageToCanvas = (item: any) => {
    createElement?.({
      type: "image",
      src: item.src,
      meta: {
        prompt: item.prompt || item.title,
        finalPrompt: item.finalPrompt,
        source: item.generationId ? "leonardo-ai" : "ai-preview",
        generationId: item.generationId,
        transparent: true,
      },
    });

    setLastAddedSrc(item.src);
    setNotice("Image added to canvas.");
  };

  const randomPrompt = () => {
    const item = randomItem();
    setPrompt(item.prompt);
    setError("");
    setNotice("Prompt ready. Click Generate.");
  };

  return (
    <div className="-mx-4 -mb-4 flex min-h-full flex-col bg-transparent text-white">
      <div className="space-y-4 px-4 pt-4">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.05] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-14 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_15px_35px_rgba(168,85,247,0.35)]">
              <Wand2 size={21} />
            </div>

            <div>
              <p className="text-base font-black tracking-[-0.03em]">
                AI Image Studio
              </p>
              <p className="text-xs font-medium text-slate-400">
                Generate product-ready artwork.
              </p>
            </div>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(safePrompt(e.target.value));
              setError("");
              setNotice("");
            }}
            rows={2}
            maxLength={160}
            placeholder="Describe your artwork..."
            className="relative mt-4 w-full resize-none rounded-[20px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium leading-relaxed text-white outline-none backdrop-blur-md placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
          />

          <div className="relative mt-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-400">
              Try: tiger, rose, dog logo
            </p>

            <p className="text-[10px] font-black text-slate-500">
              {prompt.length}/160
            </p>
          </div>

          {error && (
            <div className="relative mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-300">
              {error}
            </div>
          )}

          {notice && (
            <div className="relative mt-3 rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-xs font-bold text-violet-200">
              {notice}
            </div>
          )}

          <div className="relative mt-4 grid grid-cols-[0.8fr_1.2fr] gap-2">
            <button
              onClick={randomPrompt}
              type="button"
              disabled={loading}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] text-sm font-black transition hover:bg-white/[0.1] active:scale-95 disabled:opacity-40"
            >
              <Shuffle size={16} />
              Random
            </button>

            <button
              onClick={generateImage}
              disabled={loading || !prompt.trim()}
              type="button"
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-sm font-black text-white shadow-[0_20px_45px_rgba(168,85,247,0.32)] transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={17} />
              ) : (
                <Sparkles size={17} />
              )}
              {loading ? "Creating..." : "Generate"}
            </button>
          </div>
        </div>

        <div>
          <p className="text-sm font-black tracking-[-0.03em]">Examples</p>
          <p className="text-xs text-slate-500">
            Click an image to add it to the canvas.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-4">
          {generatedImages.map((item: any, index) => {
            const added = lastAddedSrc === item.src;

            return (
              <button
                key={`${item.src}-${index}`}
                onClick={() => addImageToCanvas(item)}
                type="button"
                className="group relative h-[170px] overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur-lg transition hover:-translate-y-0.5 hover:border-violet-400/40 active:scale-[0.98]"
              >
                <img
                  src={item.src}
                  alt={item.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/25 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-3 text-left">
                  <p className="line-clamp-1 text-xs font-black text-white">
                    {item.title}
                  </p>

                  <p className="mt-1 text-[10px] font-bold text-white/75">
                    {added ? "Added" : "Click to add"}
                  </p>
                </div>

                <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-md">
                  {added ? <Plus size={17} /> : <ImagePlus size={17} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
