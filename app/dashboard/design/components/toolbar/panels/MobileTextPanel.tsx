"use client";

import { memo, useCallback, useDeferredValue, useMemo, useRef, useState, type SyntheticEvent } from "react";
import { Search, Type } from "lucide-react";
import { FONT_CATEGORIES, FONT_ITEMS, getFontPreviewUrl, loadEditorFont, useEditorFontCatalog, type FontCategory, type FontItem } from "../data";

const TEXT_INSERT_LOCK_MS = 220;
const MOBILE_PAGE_SIZE = 12;

type MobileTextPanelProps = {
  onAddText?: () => void;
  createElement?: (element: any) => void;
};

function uniqueFamilyKey(value: string) {
  return value.trim().toLowerCase();
}

function dedupeFontsByFamily(fonts: FontItem[]) {
  const seen = new Set<string>();

  return fonts.filter((font) => {
    const key = uniqueFamilyKey(font.family);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getFontPreviewSrc(font: FontItem) {
  return getFontPreviewUrl(font);
}

function hideBrokenPreview(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.style.display = "none";
}

function buildTextElement(font: FontItem) {
  const text = "RYFIO";
  const fontSize = 42;
  const width = 220;
  const height = 68;

  return {
    type: "text",
    text,
    content: text,
    width,
    height,
    fontFamily: font.family,
    fontSize,
    fontWeight: 800,
    color: "#111111",
    meta: {
      fontFamily: font.family,
      fontSize,
      fontWeight: 800,
      color: "#111111",
      letterSpacing: 0,
      lineHeight: 1.15,
      textAlign: "center",
      textShape: "straight",
      opacity: 1,
      rotation: 0,
    },
  };
}

function MobileTextPanel({ onAddText, createElement }: MobileTextPanelProps) {
  const lockedRef = useRef(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FontCategory | "all">("all");
  const [limit, setLimit] = useState(MOBILE_PAGE_SIZE);
  const deferredQuery = useDeferredValue(query);

  const { fonts: liveFonts } = useEditorFontCatalog();
  const catalogFonts = useMemo(() => dedupeFontsByFamily(liveFonts.length ? liveFonts : FONT_ITEMS), [liveFonts]);

  const filteredFonts = useMemo(() => {
    const term = deferredQuery.trim().toLowerCase();

    let source = category === "all"
      ? catalogFonts
      : catalogFonts.filter((font) => font.category === category);

    if (term) {
      source = source.filter((font) =>
        `${font.family} ${font.category} ${font.id}`.toLowerCase().includes(term),
      );
    }

    return source;
  }, [catalogFonts, category, deferredQuery]);

  const visibleFonts = useMemo(() => filteredFonts.slice(0, limit), [filteredFonts, limit]);

  const addText = useCallback(() => {
    if (!onAddText || lockedRef.current) return;

    lockedRef.current = true;
    onAddText();

    window.setTimeout(() => {
      lockedRef.current = false;
    }, TEXT_INSERT_LOCK_MS);
  }, [onAddText]);

  const addFontText = useCallback(
    async (font: FontItem) => {
      if (lockedRef.current) return;

      lockedRef.current = true;

      try {
        await loadEditorFont(font);
        createElement?.(buildTextElement(font));
      } finally {
        window.setTimeout(() => {
          lockedRef.current = false;
        }, TEXT_INSERT_LOCK_MS);
      }
    },
    [createElement],
  );

  const changeCategory = useCallback((next: FontCategory | "all") => {
    setCategory(next);
    setLimit(MOBILE_PAGE_SIZE);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col text-white" style={{ contain: "layout paint style" }}>
      <div className="shrink-0 space-y-2 pb-2">
        <button
          type="button"
          onClick={addText}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 px-4 text-sm font-black text-white shadow-lg shadow-violet-950/20 active:scale-[0.99]"
        >
          <Type size={17} /> Add text
        </button>

        <label className="flex h-10 items-center gap-2 rounded-2xl border border-violet-300/15 bg-white/[0.045] px-3 text-violet-100/70 focus-within:border-violet-300/35">
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setLimit(MOBILE_PAGE_SIZE);
            }}
            placeholder="Search fonts"
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-violet-100/45"
          />
        </label>

        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(["all", ...FONT_CATEGORIES] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => changeCategory(item)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black capitalize active:scale-95 ${
                category === item
                  ? "bg-violet-500 text-white"
                  : "bg-white/[0.045] text-violet-100/65 ring-1 ring-violet-300/15"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid grid-cols-2 gap-2 min-[430px]:grid-cols-3">
          {visibleFonts.map((font) => (
            <button
              key={font.id}
              type="button"
              onClick={() => void addFontText(font)}
              className="flex h-[58px] items-center justify-center overflow-hidden rounded-xl border border-violet-300/15 bg-white/[0.045] px-2 active:scale-[0.98]"
              style={{ contain: "layout paint style" }}
              aria-label={`Add text with ${font.family}`}
              title={font.family}
            >
              {getFontPreviewSrc(font) ? (
                <img
                  src={getFontPreviewSrc(font) ?? undefined}
                  alt={font.family}
                  loading="lazy"
                  decoding="async"
                  onError={hideBrokenPreview}
                  className="h-8 w-full object-contain"
                  draggable={false}
                />
              ) : (
                <span className="truncate text-xs font-black text-violet-100/80">{font.family}</span>
              )}
            </button>
          ))}
        </div>

        {!visibleFonts.length && (
          <div className="rounded-2xl border border-violet-300/15 bg-white/[0.035] px-4 py-5 text-center text-sm font-bold text-violet-100/60">
            No fonts found.
          </div>
        )}

        {limit < filteredFonts.length && (
          <button
            type="button"
            onClick={() => setLimit((value) => value + MOBILE_PAGE_SIZE)}
            className="mt-3 h-10 w-full rounded-2xl bg-white/[0.055] text-xs font-black text-violet-100/80 ring-1 ring-violet-300/15 active:scale-[0.98]"
          >
            Load more fonts
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(MobileTextPanel);
