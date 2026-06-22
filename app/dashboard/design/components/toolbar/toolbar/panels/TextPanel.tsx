"use client";

import { useMemo, useRef, useState } from "react";
import { Search, Star, Type } from "lucide-react";
import {
  FONT_CATEGORIES,
  FONT_COMBINATIONS,
  FONT_ITEMS,
  TEXT_PRESETS,
  loadEditorFont,
  type FontCategory,
  type FontItem,
  type TextPreset,
} from "../data";

const FAVORITES_KEY = "mynify-editor-favorite-fonts";
const RECENTS_KEY = "mynify-editor-recent-fonts";

function readStorage(key: string) {
  if (typeof window === "undefined") return [] as string[];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as string[];
  } catch {
    return [] as string[];
  }
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
    meta: {
      fontFamily: preset.fontFamily || "Inter",
      fontSize,
      fontWeight: preset.fontWeight || 800,
      color: preset.color || "#111111",
      letterSpacing: preset.letterSpacing || 0,
      lineHeight: preset.lineHeight || 1.25,
      textAlign: "center",
      textShape: "straight",
      opacity: 1,
      rotation: 0,
    },
  };
}

export default function TextPanel({ createElement, onAddText }: { createElement?: (element: any) => void; onAddText?: () => void }) {
  const lockedRef = useRef(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FontCategory | "all" | "favorites" | "recent">("all");
  const [favorites, setFavorites] = useState<string[]>(() => readStorage(FAVORITES_KEY));
  const [recents, setRecents] = useState<string[]>(() => readStorage(RECENTS_KEY));

  const filteredFonts = useMemo(() => {
    const term = query.trim().toLowerCase();
    let source: FontItem[] = FONT_ITEMS;

    if (category === "favorites") source = FONT_ITEMS.filter((font) => favorites.includes(font.family));
    else if (category === "recent") source = FONT_ITEMS.filter((font) => recents.includes(font.family));
    else if (category !== "all") source = FONT_ITEMS.filter((font) => font.category === category);

    return source
      .filter((font) => !term || `${font.family} ${font.category}`.toLowerCase().includes(term))
      .slice(0, 80);
  }, [category, favorites, query, recents]);

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
    window.setTimeout(() => {
      lockedRef.current = false;
    }, 220);
  };

  const addFont = (font: FontItem) => {
    loadEditorFont(font);
    addText({ label: font.family, text: font.family, fontFamily: font.family, fontSize: 32, fontWeight: 800, color: "#111111" });
  };

  return (
    <div className="space-y-4 pb-6">
      <button type="button" onClick={onAddText || (() => addText(TEXT_PRESETS[0]))} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-slate-950 shadow-sm transition hover:bg-slate-100 active:scale-[0.99]">
        <Type size={17} /> Add text
      </button>

      <section>
        <PanelLabel title="Text presets" count={TEXT_PRESETS.length} />
        <div className="grid grid-cols-1 gap-1.5">
          {TEXT_PRESETS.map((preset) => (
            <button key={preset.label} type="button" onClick={() => addText(preset)} className="flex min-h-[54px] items-center justify-between rounded-2xl border border-white/10 bg-white/[0.045] px-3 text-left transition hover:border-violet-300/45 hover:bg-white/[0.08] active:scale-[0.98]">
              <span className="truncate text-sm font-black text-white">{preset.label}</span>
              <span className="text-[11px] font-bold text-slate-500">{preset.fontSize}px</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <PanelLabel title="Font combos" count={FONT_COMBINATIONS.length} />
        <div className="grid grid-cols-2 gap-2">
          {FONT_COMBINATIONS.map((preset) => (
            <button key={preset.label} type="button" onClick={() => addText(preset)} className="group min-h-[86px] rounded-[20px] border border-white/10 bg-white p-3 text-left text-slate-950 transition hover:-translate-y-0.5 hover:border-violet-300 active:scale-[0.98]">
              <span className="block max-w-full truncate leading-none" style={{ fontFamily: preset.fontFamily, fontSize: Math.min(23, preset.fontSize), fontWeight: preset.fontWeight }}>{preset.text}</span>
              <span className="mt-3 block truncate text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{preset.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <PanelLabel title="Fonts" count={filteredFonts.length} />
        <label className="mb-2 flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-[#070711] px-3 text-slate-400">
          <Search size={15} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search 500 fonts" className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-600" />
        </label>

        <div className="mb-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["all", "favorites", "recent", ...FONT_CATEGORIES].map((item) => (
            <button key={item} type="button" onClick={() => setCategory(item as any)} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-black capitalize transition active:scale-95 ${category === item ? "border-violet-300/50 bg-violet-500 text-white" : "border-white/10 bg-white/[0.045] text-slate-400 hover:bg-white/[0.075]"}`}>
              {item}
            </button>
          ))}
        </div>

        <div className="grid max-h-[360px] grid-cols-1 gap-1.5 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filteredFonts.map((font) => {
            const favorite = favorites.includes(font.family);
            return (
              <div key={font.id} className="flex h-11 items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] px-2 transition hover:border-violet-400/40 hover:bg-white/[0.07]">
                <button type="button" onClick={() => addFont(font)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm text-white" style={{ fontFamily: font.family, fontWeight: 800 }}>{font.family}</span>
                </button>
                <button type="button" onClick={() => toggleFavorite(font.family)} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${favorite ? "bg-yellow-300 text-slate-950" : "bg-white/5 text-slate-500"}`} aria-label="Favorite font">
                  <Star size={14} fill={favorite ? "currentColor" : "none"} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <p className="px-1 text-center text-[11px] font-semibold leading-5 text-slate-500">TextPanel só cria texto e presets. Edição avançada fica na toolbar contextual.</p>
    </div>
  );
}

function PanelLabel({ title, count }: { title: string; count?: number }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{title}</h3>
      {typeof count === "number" && <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-black text-slate-500">{count}</span>}
    </div>
  );
}
