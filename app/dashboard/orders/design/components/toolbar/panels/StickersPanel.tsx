"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { vectorDpiMeta } from "./dpi";
import { STICKER_CATEGORIES, STICKER_ITEMS } from "../data";

export default function StickersPanel({ createElement }: { createElement?: (element: any) => void }) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const items = useMemo(() => {
    const term = query.trim().toLowerCase();
    return STICKER_ITEMS.filter((item) => (category === "All" || item.category === category) && (!term || `${item.label} ${item.category}`.toLowerCase().includes(term))).slice(0, 120);
  }, [category, query]);

  return (
    <div className="space-y-2 pb-3">
      <label className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-slate-500"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search stickers" className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400" /></label>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{["All", ...STICKER_CATEGORIES].map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-2.5 py-1.5 text-[11px] font-black transition active:scale-95 ${category === item ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600"}`}>{item}</button>)}</div>
      <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-8 md:grid-cols-6 xl:grid-cols-8">{items.map((item) => <button key={item.id} type="button" onClick={() => createElement?.({ type: "text", text: item.value, content: item.value, width: 64, height: 64, fontFamily: "Arial", fontSize: 42, fontWeight: "900", color: "#111111", meta: { fontSize: 42, fontFamily: "Arial", color: "#111111", textAlign: "center", textShape: "straight", sticker: item.label, opacity: 1, ...vectorDpiMeta("sticker", { qualityMode: "sticker-vector-400dpi" }) } })} className="flex min-h-[42px] items-center justify-center rounded-xl border border-slate-200 bg-white text-xl shadow-none transition active:scale-95">{item.value}</button>)}</div>
    </div>
  );
}
