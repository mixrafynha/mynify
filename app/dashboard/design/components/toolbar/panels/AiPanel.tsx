"use client";

import { useCallback, useMemo, useState } from "react";
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
    prompt:
      "premium vintage tiger t-shirt design",
    src: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=900&auto=format&fit=crop",
  },

  {
    title: "Skull Rose",
    prompt:
      "premium skull rose tattoo graphic",
    src: "https://images.unsplash.com/photo-1515405295579-ba7b45403062?q=80&w=900&auto=format&fit=crop",
  },

  {
    title: "Street Dragon",
    prompt:
      "streetwear dragon print design",
    src: "https://images.unsplash.com/photo-1575936123452-b67c3203c357?q=80&w=900&auto=format&fit=crop",
  },

  {
    title: "Luxury Snake",
    prompt:
      "luxury snake logo graphic",
    src: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=900&auto=format&fit=crop",
  },

  {
    title: "Cyber Wolf",
    prompt:
      "cyber wolf mascot logo",
    src: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=900&auto=format&fit=crop",
  },

  {
    title: "Butterfly Ink",
    prompt:
      "butterfly tattoo t-shirt graphic",
    src: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=900&auto=format&fit=crop",
  },
];

function randomItem() {
  return previewImages[
    Math.floor(Math.random() * previewImages.length)
  ];
}

function safePrompt(value: string) {
  return value
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 180);
}

function buildFinalPrompt(prompt: string) {
  return `
${prompt}

Premium apparel graphic.
Transparent background.
Centered composition.
No mockup.
No shirt.
No hoodie.
No person.
No shadows.
Clean PNG.
Ultra detailed.
Print ready.
`.trim();
}

export default function AiPanel({
  createElement,
}: {
  createElement?: (data: any) => void;
}) {
  const [prompt, setPrompt] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [notice, setNotice] =
    useState("");

  const [error, setError] =
    useState("");

  const [lastAddedSrc, setLastAddedSrc] =
    useState<string | null>(null);

  const [generatedImages, setGeneratedImages] =
    useState(previewImages);

  const randomPrompt =
    useCallback(() => {
      const item = randomItem();

      setPrompt(item.prompt);

      setError("");

      setNotice(
        "Prompt ready. Click Create Design."
      );
    }, []);

  const addImageToCanvas =
    useCallback(
      (item: any) => {
        createElement?.({
          type: "image",
          src: item.src,

          width: 320,
          height: 320,

          meta: {
            prompt:
              item.prompt ||
              item.title,

            transparent: true,

            source:
              item.generationId
                ? "ai-generated"
                : "preview",
          },
        });

        setLastAddedSrc(item.src);

        setNotice(
          "Added to canvas."
        );
      },
      [createElement]
    );

  const generateImage =
    useCallback(async () => {
      const cleanPrompt =
        safePrompt(prompt.trim());

      if (
        !cleanPrompt ||
        loading
      )
        return;

      try {
        setLoading(true);
        setError("");

        setNotice(
          "Creating premium transparent design..."
        );

        const finalPrompt =
          buildFinalPrompt(
            cleanPrompt
          );

        const response =
          await fetch(
            "/api/ai-image",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                prompt:
                  finalPrompt,
                originalPrompt:
                  cleanPrompt,
                transparent: true,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Failed to generate image"
          );
        }

        if (!data?.imageUrl) {
          throw new Error(
            "No image returned"
          );
        }

        setGeneratedImages(
          (prev) => [
            {
              title:
                cleanPrompt,
              prompt:
                cleanPrompt,
              src: data.imageUrl,
              generationId:
                data.generationId,
            },
            ...prev,
          ]
        );

        setNotice(
          "Design ready. Click to add."
        );
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to generate image"
        );

        setNotice("");
      } finally {
        setLoading(false);
      }
    }, [loading, prompt]);

  const imageCards =
    useMemo(() => {
      return generatedImages.map(
        (item, index) => {
          const added =
            lastAddedSrc ===
            item.src;

          return (
            <button
              key={`${item.src}-${index}`}
              type="button"
              onClick={() =>
                addImageToCanvas(
                  item
                )
              }
              className="
                group overflow-hidden
                rounded-[26px]
                border border-white/10
                bg-[#0c1220]
                transition-all duration-300
                hover:border-cyan-400/30
                hover:-translate-y-1
                active:scale-[0.98]
              "
            >
              <div className="relative aspect-square overflow-hidden bg-[#0d1528]">
                <img
                  src={item.src}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  className="
                    h-full w-full
                    object-cover
                    transition-transform duration-500
                    group-hover:scale-105
                  "
                />

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 text-left">
                  <p className="line-clamp-1 text-sm font-black text-white">
                    {item.title}
                  </p>

                  <p className="text-[11px] text-white/70">
                    {added
                      ? "Added"
                      : "Click to add"}
                  </p>
                </div>

                <div className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 backdrop-blur-md">
                  {added ? (
                    <Plus
                      size={18}
                      className="text-cyan-300"
                    />
                  ) : (
                    <ImagePlus
                      size={18}
                      className="text-white"
                    />
                  )}
                </div>
              </div>
            </button>
          );
        }
      );
    }, [
      generatedImages,
      lastAddedSrc,
      addImageToCanvas,
    ]);

  return (
    <div className="space-y-4 pb-6 text-white">
      <div className="rounded-[30px] border border-white/10 bg-[#0a1120] p-5">
        <div className="flex items-center gap-3">
          <div
            className="
              flex h-12 w-12
              items-center justify-center
              rounded-[18px]
              bg-gradient-to-br
              from-cyan-500
              via-violet-500
              to-fuchsia-500
            "
          >
            <Wand2 size={21} />
          </div>

          <div>
            <h2 className="text-base font-black">
              AI Design Studio
            </h2>

            <p className="text-xs text-slate-400">
              Premium transparent PNG creator
            </p>
          </div>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(
              safePrompt(
                e.target.value
              )
            );

            setNotice("");
            setError("");
          }}
          rows={3}
          maxLength={180}
          placeholder="Describe your premium design..."
          className="
            mt-5 w-full resize-none
            rounded-[24px]
            border border-white/10
            bg-[#11192d]
            px-4 py-4
            text-sm font-medium text-white
            outline-none
            transition
            placeholder:text-slate-500
            focus:border-cyan-400/40
          "
        />

        {notice && (
          <div className="mt-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-xs font-bold text-cyan-200">
            {notice}
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-300">
            {error}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={
              randomPrompt
            }
            disabled={loading}
            className="
              flex h-12
              items-center justify-center
              gap-2 rounded-2xl
              border border-white/10
              bg-white/[0.04]
              font-black
              transition
              hover:bg-white/[0.08]
            "
          >
            <Shuffle size={17} />
            Random
          </button>

          <button
            type="button"
            onClick={
              generateImage
            }
            disabled={
              loading ||
              !prompt.trim()
            }
            className="
              flex h-12
              items-center justify-center
              gap-2 rounded-2xl
              bg-gradient-to-r
              from-cyan-500
              via-violet-500
              to-fuchsia-500
              font-black text-white
              transition
              active:scale-[0.98]
              disabled:opacity-40
            "
          >
            {loading ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <Sparkles size={17} />
            )}

            {loading
              ? "Creating..."
              : "Create Design"}
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm font-black">
          Premium Designs
        </p>

        <p className="text-xs text-slate-500">
          Click a design to add it
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {imageCards}
      </div>
    </div>
  );
}