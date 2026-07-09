"use client";

import { memo, useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { SHAPE_CATEGORIES, SHAPES, type ShapePreset } from "../data";

const DESKTOP_PAGE_SIZE = 48;
const MOBILE_PAGE_SIZE = 24;
const SHAPE_CANVAS_SIZE = 512;
const SHAPE_INSERT_SIZE = 88;

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

function buildShapeSvg(shape: ShapePreset) {
  const value = escapeXml(shape.value);
  const color = escapeXml(shape.color || "#111111");
  const fontFamily = escapeXml(shape.fontFamily || "Arial");
  const fontSize = Number(shape.fontSize) || 320;

  return svgDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SHAPE_CANVAS_SIZE}" height="${SHAPE_CANVAS_SIZE}" viewBox="0 0 ${SHAPE_CANVAS_SIZE} ${SHAPE_CANVAS_SIZE}">
      <rect width="100%" height="100%" fill="none"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="${fontFamily}" font-size="${fontSize}" font-weight="900" fill="${color}">${value}</text>
    </svg>`,
  );
}

function addShape(createElement: ((element: any) => void) | undefined, shape: ShapePreset) {
  const src = buildShapeSvg(shape);

  createElement?.({
    type: "image",
    src,
    imageUrl: src,
    url: src,
    printUrl: src,
    width: SHAPE_INSERT_SIZE,
    height: SHAPE_INSERT_SIZE,
    crossOrigin: "anonymous",
    meta: {
      title: shape.label,
      shape: shape.label,
      source: "shape-svg",
      vector: true,
      naturalWidth: SHAPE_CANVAS_SIZE,
      naturalHeight: SHAPE_CANVAS_SIZE,
      originalWidth: SHAPE_CANVAS_SIZE,
      originalHeight: SHAPE_CANVAS_SIZE,
      color: shape.color,
      fontSize: shape.fontSize,
      fontFamily: shape.fontFamily,
      opacity: 1,
    },
  });
}

function IconsPanel({ createElement }: { createElement?: (element: any) => void }) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  const items = useMemo(() => {
    const term = deferredQuery.trim().toLowerCase();

    return SHAPES.filter(
      (item) =>
        (category === "All" || item.category === category) &&
        (!term || `${item.label} ${item.category}`.toLowerCase().includes(term))
    );
  }, [category, deferredQuery]);

  const visibleItems = useMemo(() => items.slice(0, page * getPageSize()), [items, page]);

  return (
    <div className="space-y-3 pb-5 text-white">
      <label className="flex h-10 items-center gap-2 rounded-xl border border-violet-300/20 bg-white/[0.075] px-3 text-violet-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition focus-within:border-violet-300/45 focus-within:bg-white/[0.105]">
        <Search size={15} className="shrink-0 text-violet-200/80" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder="Search shapes"
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-violet-100/55"
        />
      </label>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {["All", ...SHAPE_CATEGORIES].map((item) => {
          const active = category === item;

          return (
            <button
              key={item}
              type="button"
              onClick={() => { setCategory(item); setPage(1); }}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-[12px] font-extrabold leading-none transition active:scale-95 ${
                active
                  ? "border-violet-200/70 bg-violet-500 text-white shadow-[0_8px_22px_rgba(139,92,246,0.32)]"
                  : "border-violet-300/18 bg-white/[0.055] text-violet-100/80 hover:border-violet-300/35 hover:bg-white/[0.09] hover:text-white"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-7 md:grid-cols-5 xl:grid-cols-7">
        {visibleItems.map((shape) => (
          <button
            key={shape.id || shape.label}
            type="button"
            aria-label={shape.label}
            title={shape.label}
            onClick={() => addShape(createElement, shape)}
            className="flex min-h-[54px] items-center justify-center rounded-2xl border border-violet-300/18 bg-white/[0.09] text-[24px] font-black text-violet-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] transition duration-150 hover:-translate-y-0.5 hover:border-violet-300/45 hover:bg-violet-500/20 active:scale-95 [content-visibility:auto] [contain-intrinsic-size:54px]"
          >
            <span className="drop-shadow-[0_1px_8px_rgba(196,181,253,0.28)]">{shape.value}</span>
          </button>
        ))}
      </div>
      {visibleItems.length < items.length && <button type="button" onClick={() => setPage((value) => value + 1)} className="h-10 w-full rounded-2xl border border-violet-300/20 bg-white/[0.06] text-sm font-black text-violet-100 transition hover:bg-white/[0.09]">Load more</button>}
    </div>
  );
}


export default memo(IconsPanel);
