
"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  FONT_CATEGORIES,
  FONT_ITEMS,
  getEditorFontFamily,
  loadEditorFont,
  loadVisibleEditorFonts,
  type FontCategory,
} from "../data";
import { stopEvent } from "./floating-toolbar-utils";

type FloatingFontPickerProps = {
  value: string;
  onChange: (family: string) => void;
  mobile?: boolean;
};

type CategoryFilter = "all" | FontCategory;

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function FloatingFontPicker({ value, onChange, mobile = false }: FloatingFontPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");

  const allFonts = useMemo(() => (Array.isArray(FONT_ITEMS) ? FONT_ITEMS : []), []);

  const fonts = useMemo(() => {
    const q = normalize(query);

    return allFonts.filter((font) => {
      const matchesCategory = category === "all" || font.category === category;
      if (!matchesCategory) return false;
      if (!q) return true;

      return `${font.family} ${font.category} ${font.id}`.toLowerCase().includes(q);
    });
  }, [allFonts, category, query]);

  useEffect(() => {
    if (value) void loadEditorFont(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;

    void loadVisibleEditorFonts(
      fonts.slice(0, 16).map((font) => font.family),
      16,
    );
  }, [fonts, open]);

  const selectFont = useCallback(
    (family: string) => {
      void loadEditorFont(family);
      onChange(family);
      setOpen(false);
      setQuery("");
    },
    [onChange],
  );

  return (
    <div className={mobile ? "relative shrink-0" : "relative w-full min-w-0"}>
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className={
          mobile
            ? "flex h-11 min-w-[168px] max-w-[190px] items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-left text-sm font-bold text-white outline-none active:scale-[0.98]"
            : "flex h-11 w-full items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-white/[0.07] px-3 text-left text-sm font-black text-white outline-none hover:border-violet-300/45"
        }
        title="Font family"
      >
        <span className="truncate" style={{ fontFamily: getEditorFontFamily(value || "Inter") }}>
          {value || "Inter"}
        </span>
        <span className="rounded-xl bg-violet-500/15 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-violet-100">
          Fonts
        </span>
      </button>

      {open && (
        <div
          onPointerDown={stopEvent}
          onMouseDown={stopEvent}
          className={
            mobile
              ? "fixed inset-x-2 bottom-[74px] z-[10030] max-h-[46dvh] overflow-hidden rounded-2xl border border-white/10 bg-[#080916]/98 p-2 shadow-[0_-18px_70px_rgba(0,0,0,.48)] backdrop-blur-2xl"
              : "mt-2 w-full overflow-hidden rounded-[22px] border border-white/10 bg-[#080916]/98 p-2 shadow-[0_18px_50px_rgba(0,0,0,.42)]"
          }
        >
          <div className="mb-2 grid grid-cols-[1fr_auto] gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
              placeholder="Search fonts..."
              className="h-10 min-w-0 rounded-[16px] border border-white/10 bg-white/[0.06] px-3 text-xs font-bold text-white outline-none placeholder:text-white/35 focus:border-violet-300/50"
            />
            {!mobile && (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-10 rounded-[16px] border border-white/10 bg-white/[0.055] px-3 text-[10px] font-black uppercase tracking-[0.12em] text-white/62 hover:bg-white/[0.09]"
              >
                X
              </button>
            )}
          </div>

          {!mobile && (
            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
              {(["all", ...FONT_CATEGORIES] as CategoryFilter[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`h-7 shrink-0 rounded-xl px-2.5 text-[9px] font-black uppercase tracking-[0.10em] transition ${
                    category === item
                      ? "bg-violet-500 text-white"
                      : "bg-white/[0.055] text-white/50 hover:bg-white/[0.09] hover:text-white/78"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          )}

          <div
            className="overflow-y-auto pr-1 [scrollbar-color:rgba(168,85,247,.55)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-violet-400/45 [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar-thumb:hover]:bg-violet-300/70"
            style={{ maxHeight: mobile ? "calc(46dvh - 82px)" : "260px" }}
          >
            {fonts.map((font) => {
              const active = font.family === value;
              return (
                <button
                  key={font.id || font.family}
                  type="button"
                  onMouseEnter={() => void loadEditorFont(font.family)}
                  onFocus={() => void loadEditorFont(font.family)}
                  onClick={() => selectFont(font.family)}
                  className={`grid h-10 w-full grid-cols-[1fr_auto] items-center gap-2 rounded-[16px] px-2.5 text-left text-xs font-black transition ${
                    active ? "bg-violet-500 text-white" : "text-white/82 hover:bg-white/[0.085]"
                  }`}
                >
                  <span className="truncate" style={{ fontFamily: getEditorFontFamily(font.family) }}>
                    {font.family}
                  </span>
                  <span className="shrink-0 text-[9px] font-black uppercase tracking-[0.10em] text-white/38">
                    {font.category}
                  </span>
                </button>
              );
            })}

            {fonts.length === 0 && (
              <div className="grid h-20 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-xs font-black uppercase tracking-[0.14em] text-white/35">
                No font found
              </div>
            )}
          </div>

          <div className="mt-2 border-t border-white/10 pt-2 text-center text-[10px] font-black uppercase tracking-[0.12em] text-white/35">
            {fonts.length} / {allFonts.length} fonts
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(FloatingFontPicker);
