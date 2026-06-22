"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { vectorDpiMeta } from "./dpi";
import { SHAPE_CATEGORIES, SHAPES, type ShapePreset } from "../data";

function addShape(createElement: ((element: any) => void) | undefined, shape: ShapePreset) {
  createElement?.({ type: "text", text: shape.value, content: shape.value, width: 88, height: 88, fontFamily: shape.fontFamily, fontSize: shape.fontSize, fontWeight: "900", color: shape.color, meta: { fontSize: shape.fontSize, fontFamily: shape.fontFamily, color: shape.color, textAlign: "center", textShape: "straight", shape: shape.label, opacity: 1, ...vectorDpiMeta("shape", { qualityMode: "shape-vector-400dpi" }) } });
}

export default function IconsPanel({ createElement }: { createElement?: (element: any) => void }) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const items = useMemo(() => {
    const term = query.trim().toLowerCase();
    return SHAPES.filter((item) => (category === "All" || item.category === category) && (!term || `${item.label} ${item.category}`.toLowerCase().includes(term))).slice(0, 120);
  }, [category, query]);

  return (
    <div className="space-y-2 pb-3">
      <label className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-slate-500"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search shapes" className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400" /></label>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{["All", ...SHAPE_CATEGORIES].map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-2.5 py-1.5 text-[11px] font-black transition active:scale-95 ${category === item ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600"}`}>{item}</button>)}</div>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-7 md:grid-cols-5 xl:grid-cols-7">{items.map((shape) => <button key={shape.id || shape.label} type="button" onClick={() => addShape(createElement, shape)} className="flex min-h-[42px] items-center justify-center rounded-xl border border-slate-200 bg-white text-xl font-black text-slate-950 shadow-none transition active:scale-95">{shape.value}</button>)}</div>
    </div>
  );
}
