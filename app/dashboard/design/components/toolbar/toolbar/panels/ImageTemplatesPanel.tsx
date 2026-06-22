"use client";

import { useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { IMAGE_TEMPLATES, type PrintAssetPreset } from "../data";

function addAsset(createElement: ((element: any) => void) | undefined, item: PrintAssetPreset) {
  createElement?.({
    type: "image",
    src: item.printUrl || item.previewUrl,
    width: 360,
    height: 360,
    meta: {
      source: "print-asset",
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

export default function ImageTemplatesPanel({ createElement }: { createElement?: (element: any) => void }) {
  const categories = useMemo(() => ["All", ...Array.from(new Set(IMAGE_TEMPLATES.map((item) => item.category)))], []);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const term = query.trim().toLowerCase();
    return IMAGE_TEMPLATES.filter((item) => {
      const inCategory = category === "All" || item.category === category;
      const inSearch = !term || `${item.title} ${item.label} ${item.category} ${item.tags.join(" ")}`.toLowerCase().includes(term);
      return inCategory && inSearch;
    });
  }, [category, query]);

  return (
    <div className="space-y-4 pb-6 text-white">
      <label className="flex h-12 items-center gap-2 rounded-[26px] bg-white/[0.06] px-3 text-slate-400 ring-1 ring-white/10">
        <Search size={16} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search print assets..." className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-slate-600" />
      </label>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((item) => (
          <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-black transition active:scale-95 ${category === item ? "bg-cyan-300 text-slate-950 shadow-[0_10px_26px_rgba(34,211,238,0.18)]" : "bg-white/[0.055] text-slate-400 ring-1 ring-white/10 hover:bg-white/[0.09]"}`}>
            {item}
          </button>
        ))}
      </div>

      <div className="columns-2 gap-3 sm:columns-3 md:columns-2 xl:columns-3">
        {items.map((item, index) => (
          <button key={item.id} type="button" onClick={() => addAsset(createElement, item)} className="group mb-3 block w-full overflow-hidden rounded-[26px] bg-white/[0.055] text-left ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:ring-cyan-300/40 active:scale-[0.98]">
            <div className={`relative overflow-hidden ${index % 3 === 0 ? "aspect-[4/5]" : "aspect-square"}`}>
              <img src={item.previewUrl} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.045]" loading="lazy" decoding="async" draggable={false} />
              <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-[10px] font-black text-white backdrop-blur-md">
                <ShieldCheck size={11} />
                {item.width >= 4096 ? "4K+" : "HD"}
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent p-3">
                <p className="line-clamp-1 text-sm font-black text-white">{item.title}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/65">{item.category} • {item.width}px</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="px-1 text-[11px] font-semibold leading-5 text-slate-500">
        Usa preview leve no painel e printUrl em alta resolução ao adicionar no canvas.
      </p>
    </div>
  );
}
