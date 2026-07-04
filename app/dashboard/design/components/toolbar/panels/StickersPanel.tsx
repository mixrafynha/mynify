"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { STICKER_CATEGORIES, STICKER_ITEMS } from "../data";

const PAGE_SIZE = 48;

export default function StickersPanel({ createElement }: { createElement?: (element: any) => void }) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const items = useMemo(() => {
    const term = query.trim().toLowerCase();
    return STICKER_ITEMS.filter((item) => (category === "All" || item.category === category) && (!term || `${item.label} ${item.category}`.toLowerCase().includes(term)));
  }, [category, query]);

  const visibleItems = items.slice(0, page * PAGE_SIZE);

  return (
    <div className="space-y-4 pb-6">
      <label className="flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-[#070711] px-3 text-slate-400"><Search size={15} /><input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search stickers" className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-slate-600" /></label>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{["All", ...STICKER_CATEGORIES].map((item) => <button key={item} type="button" onClick={() => { setCategory(item); setPage(1); }} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-black transition active:scale-95 ${category === item ? "border-pink-300/50 bg-pink-400 text-slate-950" : "border-white/10 bg-white/[0.045] text-slate-400"}`}>{item}</button>)}</div>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-6 xl:grid-cols-8">{visibleItems.map((item) => <button key={item.id} type="button" onClick={() => createElement?.({ type: "text", text: item.value, content: item.value, width: 64, height: 64, fontFamily: "Arial", fontSize: 42, fontWeight: "900", color: "#111111", meta: { fontSize: 42, fontFamily: "Arial", color: "#111111", textAlign: "center", textShape: "straight", sticker: item.label, opacity: 1 } })} className="flex min-h-[52px] items-center justify-center rounded-[17px] border border-white/10 bg-white text-2xl shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 active:scale-95">{item.value}</button>)}</div>
      {visibleItems.length < items.length && <button type="button" onClick={() => setPage((value) => value + 1)} className="h-10 w-full rounded-2xl border border-violet-300/20 bg-white/[0.06] text-sm font-black text-violet-100 transition hover:bg-white/[0.09]">Load more</button>}
    </div>
  );
}
