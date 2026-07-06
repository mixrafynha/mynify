"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { IMAGE_TEMPLATES, svgToDataUrl, type SvgAssetPreset } from "../data";

const PAGE_SIZE = 24;

function getPreview(item: any) {
  return item.previewUrl || item.src || (item.svg ? svgToDataUrl(item.svg) : item.printUrl);
}

function getPrint(item: any) {
  return item.printUrl || item.src || getPreview(item);
}

function fitWithinBox(width: unknown, height: unknown, max = 360) {
  const naturalWidth = Math.max(1, Number(width) || 300);
  const naturalHeight = Math.max(1, Number(height) || 300);
  const ratio = Math.min(1, max / naturalWidth, max / naturalHeight);
  return {
    width: Math.max(48, Math.round(naturalWidth * ratio)),
    height: Math.max(48, Math.round(naturalHeight * ratio)),
  };
}

function addAsset(createElement: ((element: any) => void) | undefined, item: any) {
  const size = fitWithinBox(item.width, item.height, 360);

  createElement?.({
    type: "image",
    src: getPrint(item),
    width: size.width,
    height: size.height,
    meta: {
      source: "image-template",
      title: item.title || item.label,
      naturalWidth: item.width || 4096,
      naturalHeight: item.height || 4096,
      dpi: item.dpi || 300,
      transparent: item.transparent ?? true,
      qualityMode: "print-asset",
      opacity: 1,
      objectFit: "fill",
    },
  });
}

export default function ImageTemplatesPanel({ createElement }: { createElement?: (element: any) => void }) {
  const categories = useMemo(() => ["All", ...Array.from(new Set((IMAGE_TEMPLATES as any[]).map((item) => item.category)))], []);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (IMAGE_TEMPLATES as any[]).filter((item) => {
      const categoryMatch = category === "All" || item.category === category;
      const queryMatch = !q || `${item.title || item.label} ${item.category} ${(item.tags || []).join(" ")}`.toLowerCase().includes(q);
      return categoryMatch && queryMatch;
    });
  }, [category, query]);

  const visible = items.slice(0, limit);

  return (
    <div className="space-y-3 pb-6 text-white">
      <label className="flex h-11 items-center gap-2 rounded-2xl bg-white/[0.055] px-3 text-slate-400 ring-1 ring-white/10">
        <Search size={15} />
        <input value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE_SIZE); }} placeholder="Search print assets" className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-slate-600" />
      </label>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((item) => (
          <button key={item} type="button" onClick={() => { setCategory(item); setLimit(PAGE_SIZE); }} className={`shrink-0 rounded-full px-3 py-2 text-xs font-black transition-colors active:scale-95 ${category === item ? "bg-violet-500 text-white" : "bg-white/[0.045] text-slate-400 ring-1 ring-white/10"}`}>
            {item}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((item: SvgAssetPreset | any) => (
          <button key={item.id || `${item.category}-${item.label || item.title}`} type="button" onClick={() => addAsset(createElement, item)} className="group relative overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/10 active:scale-[0.98]">
            <div className="aspect-square overflow-hidden" style={{ background: item.background || "transparent" }}>
              <img src={getPreview(item)} alt={item.title || item.label} className="h-full w-full object-contain p-1" loading="lazy" decoding="async" draggable={false} />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left">
              <p className="line-clamp-1 text-[10px] font-black text-white">{item.title || item.label}</p>
              <p className="text-[9px] font-bold text-white/60">{item.dpi || 300} DPI</p>
            </div>
          </button>
        ))}
      </div>

      {visible.length < items.length && <button type="button" onClick={() => setLimit((v) => v + PAGE_SIZE)} className="h-10 w-full rounded-2xl bg-white/[0.055] text-xs font-black text-slate-300 ring-1 ring-white/10">Load more</button>}
      {!items.length && <div className="py-10 text-center text-sm font-bold text-slate-500">No assets found.</div>}
    </div>
  );
}
