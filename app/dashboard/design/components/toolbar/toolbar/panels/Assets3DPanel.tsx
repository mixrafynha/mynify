"use client";

import { useMemo, useState } from "react";
import { Search, Box } from "lucide-react";
import { ASSETS_3D, type PrintAssetPreset } from "../data";

function addAsset(createElement: ((element: any) => void) | undefined, item: PrintAssetPreset) {
  createElement?.({
    type: "image",
    src: item.printUrl || item.previewUrl,
    width: 360,
    height: 360,
    meta: {
      source: "3d-print-asset",
      title: item.title || item.label,
      naturalWidth: item.width,
      naturalHeight: item.height,
      dpi: item.dpi,
      transparent: item.transparent,
      license: item.license,
      credit: item.credit,
      safeForPrint: item.safeForPrint,
      opacity: 1,
    },
  });
}

export default function Assets3DPanel({ createElement }: { createElement?: (element: any) => void }) {
  const categories = useMemo(() => ["All", ...Array.from(new Set(ASSETS_3D.map((item) => item.category)))], []);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const term = query.trim().toLowerCase();
    return ASSETS_3D.filter((item) => {
      const inCategory = category === "All" || item.category === category;
      const inSearch = !term || `${item.title} ${item.label} ${item.category} ${item.tags.join(" ")}`.toLowerCase().includes(term);
      return inCategory && inSearch;
    });
  }, [category, query]);

  return (
    <div className="space-y-4 pb-6 text-white">
      <label className="flex h-12 items-center gap-2 rounded-[26px] bg-white/[0.06] px-3 text-slate-400 ring-1 ring-white/10">
        <Search size={16} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search 3D assets..." className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-slate-600" />
      </label>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((item) => (
          <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-black transition active:scale-95 ${category === item ? "bg-violet-300 text-slate-950 shadow-[0_10px_26px_rgba(168,85,247,0.18)]" : "bg-white/[0.055] text-slate-400 ring-1 ring-white/10 hover:bg-white/[0.09]"}`}>
            {item}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <button key={item.id} type="button" onClick={() => addAsset(createElement, item)} className="group overflow-hidden rounded-[28px] bg-white/[0.055] text-left ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:ring-violet-300/40 active:scale-[0.98]">
            <div className="relative aspect-square overflow-hidden">
              <img src={item.previewUrl} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.045]" loading="lazy" decoding="async" draggable={false} />
              <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-[10px] font-black text-white backdrop-blur-md">
                <Box size={11} />
                3D 4K
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent p-3">
                <p className="line-clamp-1 text-sm font-black text-white">{item.title}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/65">{item.category} • {item.width}px</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
