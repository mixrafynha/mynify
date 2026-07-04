"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SHAPE_CATEGORIES, SHAPES, type ShapePreset } from "../data";

function addShape(createElement: ((element: any) => void) | undefined, shape: ShapePreset) {
  createElement?.({
    type: "text",
    text: shape.value,
    content: shape.value,
    width: 88,
    height: 88,
    fontFamily: shape.fontFamily,
    fontSize: shape.fontSize,
    fontWeight: "900",
    color: shape.color,
    meta: {
      fontSize: shape.fontSize,
      fontFamily: shape.fontFamily,
      color: shape.color,
      textAlign: "center",
      textShape: "straight",
      shape: shape.label,
      opacity: 1,
    },
  });
}

export default function IconsPanel({ createElement }: { createElement?: (element: any) => void }) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const term = query.trim().toLowerCase();

    return SHAPES.filter(
      (item) =>
        (category === "All" || item.category === category) &&
        (!term || `${item.label} ${item.category}`.toLowerCase().includes(term))
    ).slice(0, 120);
  }, [category, query]);

  return (
    <div className="space-y-3 pb-5 text-white">
      <label className="flex h-10 items-center gap-2 rounded-xl border border-violet-300/20 bg-white/[0.075] px-3 text-violet-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition focus-within:border-violet-300/45 focus-within:bg-white/[0.105]">
        <Search size={15} className="shrink-0 text-violet-200/80" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
              onClick={() => setCategory(item)}
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
        {items.map((shape) => (
          <button
            key={shape.id || shape.label}
            type="button"
            aria-label={shape.label}
            title={shape.label}
            onClick={() => addShape(createElement, shape)}
            className="flex min-h-[54px] items-center justify-center rounded-2xl border border-violet-300/18 bg-white/[0.09] text-[24px] font-black text-violet-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] transition duration-150 hover:-translate-y-0.5 hover:border-violet-300/45 hover:bg-violet-500/20 active:scale-95"
          >
            <span className="drop-shadow-[0_1px_8px_rgba(196,181,253,0.28)]">{shape.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
