"use client";

import { Plus } from "lucide-react";

type ImageItem = {
  title: string;
  prompt: string;
  src: string;
  printUrl?: string;
  generationId?: string;
  width?: number;
  height?: number;
  dpi?: number;
  qualityMode?: string;
};

type Props = {
  images: ImageItem[];
  lastAddedSrc: string | null;
  onAdd: (item: ImageItem) => void;
};

export default function PreviewImages({ images, lastAddedSrc, onAdd }: Props) {
  if (!images.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-sm font-black">Inspiração</p>
          <p className="text-[11px] font-medium text-slate-500">Preview leve, printUrl no canvas</p>
        </div>
        <span className="text-[10px] font-black text-violet-300">{images.length}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {images.slice(0, 6).map((item, index) => {
          const added = lastAddedSrc === (item.printUrl || item.src);
          return (
            <button key={`${item.src}-${index}`} type="button" onClick={() => onAdd(item)} className="group relative overflow-hidden rounded-2xl bg-white/[0.045] ring-1 ring-white/10 active:scale-[0.98]">
              <div className="aspect-square overflow-hidden">
                <img src={item.src} alt={item.title} loading="lazy" decoding="async" className="h-full w-full object-cover" draggable={false} />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left">
                <p className="line-clamp-1 text-[10px] font-black text-white">{item.title}</p>
                <p className="text-[9px] font-bold text-white/60">{added ? "Added" : "HD"}</p>
              </div>
              <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition group-hover:opacity-100">
                <Plus size={14} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
