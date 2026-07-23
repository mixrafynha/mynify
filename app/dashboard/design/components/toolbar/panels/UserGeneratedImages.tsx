"use client";

import { memo, useMemo } from "react";
import { Check, ImagePlus, Trash2 } from "lucide-react";

type ImageItem = {
  id?: string;
  generationId?: string;
  generation_id?: string;
  title?: string;
  prompt?: string;
  src?: string;
  imageUrl?: string;
  image_url?: string;
  printUrl?: string;
  url?: string;
  r2Key?: string;
  storage_key?: string;
  originalImageUrl?: string | null;
  original_image_url?: string | null;
  width?: number;
  height?: number;
  dpi?: number;
  saved?: boolean;
};

type Props = {
  images: ImageItem[];
  lastAddedSrc?: string | null;
  limit?: number;
  savedCount?: number;
  onAdd: (item: ImageItem) => void;
  onSave?: (item: ImageItem) => void;
  onDelete?: (item: ImageItem) => void;
};

function getImageSrc(item: ImageItem) {
  return String(item.imageUrl || item.image_url || item.printUrl || item.src || item.url || "").trim();
}

function isValidImageSrc(src: string) {
  return src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:image/");
}

function UserGeneratedImages({
  images,
  lastAddedSrc,
  limit = 5,
  savedCount = 0,
  onAdd,
  onSave,
  onDelete,
}: Props) {
  const validImages = useMemo(
    () => images.filter((item) => isValidImageSrc(getImageSrc(item))),
    [images],
  );

  if (!validImages.length) {
    return (
      <div className="rounded-3xl bg-white/[0.035] p-4 text-center ring-1 ring-white/10">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-white/45">Your AI Designs</p>
        <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500">
          Generate an image and save up to {limit} AI designs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-200/80">Your AI Designs</p>
        <p className="text-[11px] font-bold text-white/40">
          {savedCount}/{limit} saved
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {validImages.slice(0, 5).map((item, index) => {
          const src = getImageSrc(item);
          const saved = Boolean(item.saved || item.id);
          const isLastAdded = Boolean(lastAddedSrc && src === lastAddedSrc);

          return (
            <div
              key={item.id || item.generationId || item.generation_id || src || index}
              data-ai-image-card
              className="group overflow-hidden rounded-3xl bg-white/[0.045] ring-1 ring-white/10"
            >
              <button
                type="button"
                onClick={() => onAdd(item)}
                className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-black/20"
              >
                {src ? (
                  <img
                    src={src}
                    crossOrigin="anonymous"
                    alt="AI generated design"
                    className="h-full w-full object-contain p-2"
                    draggable={false}
                    decoding="async"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.closest("[data-ai-image-card]")?.classList.add("hidden");
                    }}
                  />
                ) : (
                  <div className="text-xs font-bold text-red-300">Missing image</div>
                )}

                {isLastAdded && (
                  <div className="absolute right-2 top-2 rounded-full bg-emerald-400 px-2 py-1 text-[10px] font-black text-black">
                    Added
                  </div>
                )}
              </button>

              <div className="grid grid-cols-3 gap-1 p-2">
                <button
                  type="button"
                  onClick={() => onAdd(item)}
                  className="flex h-9 items-center justify-center gap-1 rounded-xl bg-violet-500 text-[11px] font-black text-white active:scale-[0.98]"
                >
                  <ImagePlus size={13} /> Add
                </button>

                <button
                  type="button"
                  onClick={() => onSave?.(item)}
                  disabled={saved}
                  className="flex h-9 items-center justify-center gap-1 rounded-xl bg-white/[0.07] text-[11px] font-black text-slate-200 ring-1 ring-white/10 active:scale-[0.98] disabled:opacity-40"
                >
                  <Check size={13} /> {saved ? "Saved" : "Save"}
                </button>

                <button
                  type="button"
                  onClick={() => onDelete?.(item)}
                  disabled={!saved}
                  className="flex h-9 items-center justify-center rounded-xl bg-red-500/10 text-red-200 ring-1 ring-red-500/20 active:scale-[0.98] disabled:opacity-30"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(UserGeneratedImages);
