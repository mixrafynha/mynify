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

      <div className="grid grid-cols-4 gap-1.5 md:grid-cols-2 xl:grid-cols-3">
        {images.slice(0, 6).map((item, index) => {
          const added = lastAddedSrc === (item.printUrl || item.src);
          return (
            <button key={`${item.src}-${index}`} type="button" onClick={() => onAdd(item)} className="group relative overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 active:scale-[0.98]">
              <div className="aspect-square overflow-hidden">
                <img src={item.src} alt={item.title} loading="lazy" decoding="async" className="h-full w-full object-contain" draggable={false} />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-white/90 p-1.5 text-left">
                <p className="line-clamp-1 text-[9px] font-black text-slate-800">{item.title}</p>
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
