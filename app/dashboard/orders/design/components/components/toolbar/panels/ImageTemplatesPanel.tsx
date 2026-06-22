"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { IMAGE_TEMPLATES, svgToDataUrl, type SvgAssetPreset } from "../data";
import { imageDpiMeta } from "./dpi";

const PAGE_SIZE = 24;

function getPreview(item: any) {
  return item.previewUrl || item.src || (item.svg ? svgToDataUrl(item.svg) : item.printUrl);
}

function getPrint(item: any) {
  return item.printUrl || item.src || getPreview(item);
}

function addAsset(createElement: ((element: any) => void) | undefined, item: any) {
  createElement?.({
    type: "image",
    src: getPrint(item),
    width: Math.min(360, item.width || 300),
    height: Math.min(360, item.height || 300),
    meta: {
      source: "image-template",
      title: item.title || item.label,
...imageDpiMeta(item, "template", { qualityMode: "image-template-print-400dpi" }),
      opacity: 1,
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
      <label className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-slate-500">
        <Search size={15} />
        <input value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE_SIZE); }} placeholder="Search print assets" className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400" />
      </label>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((item) => (
          <button key={item} type="button" onClick={() => { setCategory(item); setLimit(PAGE_SIZE); }} className={`shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-black transition-colors active:scale-95 ${category === item ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-400 ring-1 ring-slate-200"}`}>
            {item}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-1.5 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((item: SvgAssetPreset | any) => (
          <button key={item.id || `${item.category}-${item.label || item.title}`} type="button" onClick={() => addAsset(createElement, item)} className="group relative overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 active:scale-[0.98]">
            <div className="aspect-square overflow-hidden" style={{ background: item.background || "transparent" }}>
              <img src={getPreview(item)} alt={item.title || item.label} className="h-full w-full object-contain p-1" loading="lazy" decoding="async" draggable={false} />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-white/90 p-1.5 text-left">
              <p className="line-clamp-1 text-[9px] font-black text-slate-800">{item.title || item.label}</p>
              <p className="text-[9px] font-bold text-white/60">{item.dpi || 300} DPI</p>
            </div>
          </button>
        ))}
      </div>

      {visible.length < items.length && <button type="button" onClick={() => setLimit((v) => v + PAGE_SIZE)} className="h-9 w-full rounded-xl bg-white text-xs font-black text-slate-700 ring-1 ring-slate-200">Load more</button>}
      {!items.length && <div className="py-10 text-center text-sm font-bold text-slate-500">No assets found.</div>}
    </div>
  );
}
