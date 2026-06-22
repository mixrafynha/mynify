"use client";

import { ImagePlus, Plus } from "lucide-react";

type ImageItem = {
  title: string;
  prompt: string;
  src: string;
  generationId?: string;
};

type Props = {
  images: ImageItem[];
  lastAddedSrc: string | null;
  onAdd: (item: ImageItem) => void;
};

export default function PreviewImages({
  images,
  lastAddedSrc,
  onAdd,
}: Props) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-black">
          Premium Inspiration
        </p>

        <p className="text-xs text-slate-500">
          Click a design to add it
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {images.map((item, index) => {
          const added = lastAddedSrc === item.src;

          return (
            <button
              key={`${item.src}-${index}`}
              type="button"
              onClick={() => onAdd(item)}
              className="group overflow-hidden rounded-[26px] border border-white/10 bg-[#0c1220] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30 active:scale-[0.98]"
            >
              <div className="relative aspect-square overflow-hidden bg-[#0d1528]">
                <img
                  src={item.src}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 text-left">
                  <p className="line-clamp-1 text-sm font-black text-white">
                    {item.title}
                  </p>

                  <p className="text-[11px] text-white/70">
                    {added ? "Added" : "Click to add"}
                  </p>
                </div>

                <div className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 backdrop-blur-md">
                  {added ? (
                    <Plus size={18} className="text-cyan-300" />
                  ) : (
                    <ImagePlus size={18} className="text-white" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}