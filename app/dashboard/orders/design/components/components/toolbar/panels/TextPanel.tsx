"use client";

import { useMemo, useRef, useState } from "react";
import { Search, Star, Type } from "lucide-react";
import { FONT_CATEGORIES, FONT_COMBINATIONS, FONT_ITEMS, TEXT_PRESETS, loadEditorFont, type FontCategory, type FontItem, type TextPreset } from "../data";
import { vectorDpiMeta } from "./dpi";

const FAVORITES_KEY = "mynify-editor-favorite-fonts";
const RECENTS_KEY = "mynify-editor-recent-fonts";
const PAGE_SIZE = 36;

function readStorage(key: string) {
  if (typeof window === "undefined") return [] as string[];
  try { return JSON.parse(localStorage.getItem(key) || "[]") as string[]; } catch { return [] as string[]; }
}

function writeStorage(key: string, value: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value.slice(0, 40)));
}

function buildTextElement(preset: TextPreset) {
  const text = preset.text || "Add your text";
  const fontSize = preset.fontSize || 36;
  const width = Math.max(128, Math.round(text.length * fontSize * 0.56));
  const height = Math.max(34, Math.round(fontSize * (preset.lineHeight || 1.28)));
  return {
    type: "text",
    text,
    content: text,
    width,
    height,
    fontFamily: preset.fontFamily || "Inter",
    fontSize,
    fontWeight: preset.fontWeight || 800,
    color: preset.color || "#111111",
    meta: { fontFamily: preset.fontFamily || "Inter", fontSize, fontWeight: preset.fontWeight || 800, color: preset.color || "#111111", letterSpacing: preset.letterSpacing || 0, lineHeight: preset.lineHeight || 1.25, textAlign: "center", textShape: "straight", opacity: 1, rotation: 0, ...vectorDpiMeta("vector", { qualityMode: "text-vector-400dpi" }) },
  };
}

export default function TextPanel({ createElement, onAddText }: { createElement?: (element: any) => void; onAddText?: () => void }) {
  const lockedRef = useRef(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FontCategory | "all" | "favorites" | "recent">("all");
  const [favorites, setFavorites] = useState<string[]>(() => readStorage(FAVORITES_KEY));
  const [recents, setRecents] = useState<string[]>(() => readStorage(RECENTS_KEY));
  const [limit, setLimit] = useState(PAGE_SIZE);

  const allFilteredFonts = useMemo(() => {
    const term = query.trim().toLowerCase();
    let source: FontItem[] = FONT_ITEMS;
    if (category === "favorites") source = FONT_ITEMS.filter((font) => favorites.includes(font.family));
    else if (category === "recent") source = FONT_ITEMS.filter((font) => recents.includes(font.family));
    else if (category !== "all") source = FONT_ITEMS.filter((font) => font.category === category);
    return source.filter((font) => !term || `${font.family} ${font.category}`.toLowerCase().includes(term));
  }, [category, favorites, query, recents]);

  const filteredFonts = allFilteredFonts.slice(0, limit);

  const markRecent = (family: string) => {
    const next = [family, ...recents.filter((item) => item !== family)].slice(0, 24);
    setRecents(next);
    writeStorage(RECENTS_KEY, next);
  };

  const toggleFavorite = (family: string) => {
    const next = favorites.includes(family) ? favorites.filter((item) => item !== family) : [family, ...favorites];
    setFavorites(next);
    writeStorage(FAVORITES_KEY, next);
  };

  const addText = (preset: TextPreset) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    loadEditorFont(preset.fontFamily);
    markRecent(preset.fontFamily);
    createElement?.(buildTextElement(preset));
    window.setTimeout(() => { lockedRef.current = false; }, 180);
  };

  const addFont = (font: FontItem) => {
    loadEditorFont(font);
    addText({ label: font.family, text: font.family, fontFamily: font.family, fontSize: 32, fontWeight: 800, color: "#111111" });
  };

  const changeCategory = (item: any) => {
    setCategory(item);
    setLimit(PAGE_SIZE);
  };

  return (
    <div className="space-y-2 pb-3 text-slate-900">
      <button type="button" onClick={onAddText || (() => addText(TEXT_PRESETS[0]))} className="flex min-h-9 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-xs font-black text-white active:scale-[0.99]">
        <Type size={17} /> Add text
      </button>

      <section className="space-y-2">
        <PanelLabel title="Presets" count={TEXT_PRESETS.length + FONT_COMBINATIONS.length} />
        <div className="grid grid-cols-2 gap-1.5">
          {[...TEXT_PRESETS, ...FONT_COMBINATIONS].slice(0, 10).map((preset) => (
            <button key={preset.label} type="button" onClick={() => addText(preset)} className="min-h-[44px] rounded-xl bg-white px-2.5 text-left ring-1 ring-slate-200 active:scale-[0.98]">
              <span className="block truncate text-sm font-black" style={{ fontFamily: preset.fontFamily }}>{preset.text}</span>
              <span className="mt-1 block truncate text-[9px] font-bold uppercase tracking-[0.10em] text-slate-500">{preset.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <PanelLabel title="Fonts" count={allFilteredFonts.length} />
        <label className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-slate-500">
          <Search size={15} />
          <input value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE_SIZE); }} placeholder={`Search ${FONT_ITEMS.length}+ fonts`} className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-500" />
        </label>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["all", "favorites", "recent", ...FONT_CATEGORIES].map((item) => (
            <button key={item} type="button" onClick={() => changeCategory(item)} className={`shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-black capitalize transition-colors active:scale-95 ${category === item ? "bg-slate-950 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>
              {item}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-1 overflow-hidden">
          {filteredFonts.map((font) => {
            const favorite = favorites.includes(font.family);
            return (
              <div key={font.id} className="flex h-9 items-center gap-1 rounded-xl bg-white px-2 ring-1 ring-slate-200">
                <button type="button" onClick={() => addFont(font)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-xs text-slate-900" style={{ fontFamily: font.family, fontWeight: 800 }}>{font.family}</span>
                </button>
                <button type="button" onClick={() => toggleFavorite(font.family)} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${favorite ? "bg-yellow-300 text-slate-950" : "bg-slate-50 text-slate-500"}`} aria-label="Favorite font">
                  <Star size={14} fill={favorite ? "currentColor" : "none"} />
                </button>
              </div>
            );
          })}
        </div>

        {limit < allFilteredFonts.length && (
          <button type="button" onClick={() => setLimit((v) => v + PAGE_SIZE)} className="h-9 w-full rounded-xl bg-white text-xs font-black text-slate-700 ring-1 ring-slate-200 active:scale-[0.98]">
            Load more fonts
          </button>
        )}
      </section>
    </div>
  );
}

function PanelLabel({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{title}</h3>
      {typeof count === "number" && <span className="text-[10px] font-black text-slate-500">{count}</span>}
    </div>
  );
}
