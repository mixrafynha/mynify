"use client";

import { memo, useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { STICKER_CATEGORIES, STICKER_ITEMS } from "../data";

const DESKTOP_PAGE_SIZE = 48;
const MOBILE_PAGE_SIZE = 24;
const STICKER_CANVAS_SIZE = 512;
const STICKER_INSERT_SIZE = 64;

function getPageSize() {
  if (typeof window === "undefined") return DESKTOP_PAGE_SIZE;
  return window.matchMedia?.("(max-width: 767px)").matches ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE;
}

function escapeXml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function svgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function buildStickerSvg(value: string) {
  const sticker = escapeXml(value);

  return svgDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${STICKER_CANVAS_SIZE}" height="${STICKER_CANVAS_SIZE}" viewBox="0 0 ${STICKER_CANVAS_SIZE} ${STICKER_CANVAS_SIZE}">
      <rect width="100%" height="100%" fill="none"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif" font-size="360">${sticker}</text>
    </svg>`,
  );
}

function addSticker(createElement: ((element: any) => void) | undefined, item: any) {
  const src = buildStickerSvg(item.value);

  createElement?.({
    type: "image",
    src,
    imageUrl: src,
    url: src,
    printUrl: src,
    width: STICKER_INSERT_SIZE,
    height: STICKER_INSERT_SIZE,
    crossOrigin: "anonymous",
    meta: {
      title: item.label,
      sticker: item.label,
      source: "sticker-svg",
      vector: true,
      naturalWidth: STICKER_CANVAS_SIZE,
      naturalHeight: STICKER_CANVAS_SIZE,
      originalWidth: STICKER_CANVAS_SIZE,
      originalHeight: STICKER_CANVAS_SIZE,
      opacity: 1,
    },
  });
}

function StickersPanel({ createElement }: { createElement?: (element: any) => void }) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);
  const items = useMemo(() => {
    const term = deferredQuery.trim().toLowerCase();
    return STICKER_ITEMS.filter((item) => (category === "All" || item.category === category) && (!term || `${item.label} ${item.category}`.toLowerCase().includes(term)));
  }, [category, deferredQuery]);

  const visibleItems = useMemo(() => items.slice(0, page * getPageSize()), [items, page]);

  return (
    <div className="space-y-4 pb-6">
      <label className="flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-[#070711] px-3 text-slate-400"><Search size={15} /><input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search stickers" className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-slate-600" /></label>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{["All", ...STICKER_CATEGORIES].map((item) => <button key={item} type="button" onClick={() => { setCategory(item); setPage(1); }} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-black transition active:scale-95 ${category === item ? "border-pink-300/50 bg-pink-400 text-slate-950" : "border-white/10 bg-white/[0.045] text-slate-400"}`}>{item}</button>)}</div>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-6 xl:grid-cols-8">{visibleItems.map((item) => <button key={item.id} type="button" onClick={() => addSticker(createElement, item)} className="flex min-h-[52px] items-center justify-center rounded-[17px] border border-white/10 bg-white text-2xl shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 active:scale-95 [content-visibility:auto] [contain-intrinsic-size:52px]">{item.value}</button>)}</div>
      {visibleItems.length < items.length && <button type="button" onClick={() => setPage((value) => value + 1)} className="h-10 w-full rounded-2xl border border-violet-300/20 bg-white/[0.06] text-sm font-black text-violet-100 transition hover:bg-white/[0.09]">Load more</button>}
    </div>
  );
}


export default memo(StickersPanel);
