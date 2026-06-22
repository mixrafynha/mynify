"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SHAPE_CATEGORIES, SHAPES, type ShapePreset } from "../data";

function addShape(createElement: ((element: any) => void) | undefined, shape: ShapePreset) {
  createElement?.({ type: "text", text: shape.value, content: shape.value, width: 88, height: 88, fontFamily: shape.fontFamily, fontSize: shape.fontSize, fontWeight: "900", color: shape.color, meta: { fontSize: shape.fontSize, fontFamily: shape.fontFamily, color: shape.color, textAlign: "center", textShape: "straight", shape: shape.label, opacity: 1 } });
}

export default function IconsPanel({ createElement }: { createElement?: (element: any) => void }) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const items = useMemo(() => {
    const term = query.trim().toLowerCase();
    return SHAPES.filter((item) => (category === "All" || item.category === category) && (!term || `${item.label} ${item.category}`.toLowerCase().includes(term))).slice(0, 120);
  }, [category, query]);

  return (
    <div className="space-y-4 pb-6">
      <label className="flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-[#070711] px-3 text-slate-400"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search shapes" className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-slate-600" /></label>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{["All", ...SHAPE_CATEGORIES].map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-black transition active:scale-95 ${category === item ? "border-cyan-300/50 bg-cyan-400 text-slate-950" : "border-white/10 bg-white/[0.045] text-slate-400"}`}>{item}</button>)}</div>
      <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-7 md:grid-cols-5 xl:grid-cols-7">{items.map((shape) => <button key={shape.id || shape.label} type="button" onClick={() => addShape(createElement, shape)} className="flex min-h-[52px] items-center justify-center rounded-2xl border border-white/10 bg-white text-2xl font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 active:scale-95">{shape.value}</button>)}</div>
    </div>
  );
}
