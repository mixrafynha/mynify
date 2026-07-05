"use client";

import { memo, useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Search, Sparkles, Star, Clock3 } from "lucide-react";
import {
  FONT_CATEGORIES,
  FONT_ITEMS,
  type FontCategory,
  getEditorFontFamily,
  loadEditorFont,
  loadVisibleEditorFonts,
} from "../data";

const TEXT_SHAPES = [
  { id: "straight", label: "Straight", preview: "TEXT" },
  { id: "wave", label: "Wave", preview: "~TEXT~" },
  { id: "arc", label: "Arc", preview: "⌒ TEXT ⌒" },
];

const PAGE_SIZE = 36;
const TRENDING_FONT_IDS = new Set([
  "inter",
  "geist",
  "manrope",
  "sora",
  "playfair-display",
  "cormorant-garamond",
  "bodoni-moda",
  "gloock",
  "bebas-neue",
  "league-spartan",
  "great-vibes",
  "rubik-spray-paint",
]);
const RECENT_STORAGE_KEY = "ryfio:recent-fonts";
const FAVORITE_STORAGE_KEY = "ryfio:favorite-fonts";

function previewSrc(font: { id: string; previewSvg?: string }) {
  return font.previewSvg || `/font-previews/${font.id}.svg`;
}

type Tab = "all" | "trending" | "recent" | "favorites" | FontCategory;

function readStoredFonts(key: string) {
  if (typeof window === "undefined") return [] as string[];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  } catch {
    return [] as string[];
  }
}

function writeStoredFonts(key: string, values: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(values.slice(0, 30)));
}

function FontsPanel({
  selected,
  updateSelected,
}: {
  selected?: any;
  updateSelected?: (update: any) => void;
}) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [tab, setTab] = useState<Tab>("all");
  const [recentFonts, setRecentFonts] = useState<string[]>([]);
  const [favoriteFonts, setFavoriteFonts] = useState<string[]>([]);
  const [fontRenderKey, setFontRenderKey] = useState(0);
  const [validFontIds, setValidFontIds] = useState<Set<string> | null>(null);

  const selectedFont =
    selected?.meta?.fontFamily || selected?.fontFamily || "Inter";
  const selectedShape = selected?.meta?.textShape || "straight";
  const previewText = selected?.text || selected?.content || "RYFIO Studio 123";

  useEffect(() => {
    setRecentFonts(readStoredFonts(RECENT_STORAGE_KEY));
    setFavoriteFonts(readStoredFonts(FAVORITE_STORAGE_KEY));
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadEditorFont(selectedFont).finally(() => {
      if (!cancelled) setFontRenderKey((value) => value + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedFont]);


  useEffect(() => {
    let cancelled = false;

    fetch("/font-previews/manifest.json", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((manifest) => {
        if (cancelled || !Array.isArray(manifest?.fonts)) return;
        setValidFontIds(new Set(manifest.fonts.map(String)));
      })
      .catch(() => {
        if (!cancelled) setValidFontIds(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredFonts = useMemo(() => {
    const q = query.trim().toLowerCase();
    let source = validFontIds ? FONT_ITEMS.filter((font) => validFontIds.has(font.id)) : FONT_ITEMS;

    if (tab === "trending")
      source = FONT_ITEMS.filter((font) => TRENDING_FONT_IDS.has(font.id));
    else if (tab === "recent")
      source = FONT_ITEMS.filter((font) => recentFonts.includes(font.family));
    else if (tab === "favorites")
      source = FONT_ITEMS.filter((font) => favoriteFonts.includes(font.family));
    else if (tab !== "all")
      source = FONT_ITEMS.filter((font) => font.category === tab);

    if (!q) return source;
    return source.filter((font) =>
      `${font.family} ${font.category} ${font.id}`.toLowerCase().includes(q),
    );
  }, [favoriteFonts, query, recentFonts, tab, validFontIds]);

  const visibleFonts = filteredFonts.slice(0, limit);

  const visibleFontFamilies = useMemo(
    () => visibleFonts.map((font) => font.family).join("|"),
    [visibleFonts],
  );

  useEffect(() => {
    let cancelled = false;
    const families = visibleFonts.map((font) => font.family);

    loadVisibleEditorFonts(families, Math.max(families.length, PAGE_SIZE)).finally(() => {
      if (!cancelled) setFontRenderKey((value) => value + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [visibleFontFamilies]);

  const updateSelectedTextMeta = (patch: any) => {
    if (!selected) return;
    updateSelected?.({ meta: patch });
  };

  const selectFont = (family: string) => {
    if (!selected) return;
    loadEditorFont(family);
    updateSelectedTextMeta({ fontFamily: family });
    setRecentFonts((prev) => {
      const next = [family, ...prev.filter((item) => item !== family)].slice(
        0,
        18,
      );
      writeStoredFonts(RECENT_STORAGE_KEY, next);
      return next;
    });
  };

  const toggleFavorite = (family: string) => {
    setFavoriteFonts((prev) => {
      const next = prev.includes(family)
        ? prev.filter((item) => item !== family)
        : [family, ...prev].slice(0, 60);
      writeStoredFonts(FAVORITE_STORAGE_KEY, next);
      return next;
    });
  };

  const tabs: { id: Tab; label: string; icon?: ReactNode }[] = [
    { id: "all", label: "All" },
    { id: "trending", label: "Trending", icon: <Sparkles size={13} /> },
    { id: "recent", label: "Recent", icon: <Clock3 size={13} /> },
    { id: "favorites", label: "Fav", icon: <Star size={13} /> },
    ...FONT_CATEGORIES.map((category) => ({
      id: category,
      label: category.replace(/-/g, " "),
    })),
  ];

  return (
    <div className="space-y-3 pb-24 text-white md:pb-7">
      {!selected && (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-xs font-bold text-amber-100">
          Select a text layer to apply fonts.
        </div>
      )}

      <section className="overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.035]">
        <div className="flex min-h-[94px] items-center justify-center px-4 py-5">
          <div
            key={`current-${selectedFont}-${fontRenderKey}`}
            className="max-w-full truncate text-center text-[32px] font-black leading-none"
            style={{
              fontFamily: getEditorFontFamily(selectedFont),
              color: selected?.meta?.color || "#ffffff",
              fontWeight: 900,
              letterSpacing: "-0.02em",
            }}
          >
            {previewText || "RYFIO Studio 123"}
          </div>
        </div>
        <div className="border-t border-white/10 px-3 py-2 text-[11px] font-bold text-white/45">
          Current font: <span className="text-violet-200">{selectedFont}</span>
        </div>
      </section>

      <section className="space-y-2">
        <Label title="Text shape" />
        <div className="grid grid-cols-3 gap-2">
          {TEXT_SHAPES.map((shape) => (
            <button
              key={shape.id}
              type="button"
              disabled={!selected}
              onClick={() => updateSelectedTextMeta({ textShape: shape.id })}
              className={`min-h-11 rounded-2xl px-2 text-xs font-black transition active:scale-[0.98] disabled:opacity-40 ${selectedShape === shape.id ? "bg-violet-500 text-white" : "bg-white/[0.045] text-slate-300 ring-1 ring-white/10 hover:bg-white/[0.075]"}`}
            >
              <span className="block">{shape.preview}</span>
              <span className="mt-1 block text-[10px] opacity-70">
                {shape.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <Label title="Fonts" count={filteredFonts.length} />
        <label className="sticky top-0 z-20 flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-[#090a15]/95 px-3 text-slate-400 shadow-[0_12px_30px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE_SIZE);
            }}
            placeholder="Search fonts..."
            className="h-full flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-600"
          />
        </label>

        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id);
                  setLimit(PAGE_SIZE);
                }}
                className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-black capitalize transition active:scale-[0.98] ${active ? "bg-violet-500 text-white" : "bg-white/[0.045] text-white/58 ring-1 ring-white/10 hover:bg-white/[0.075] hover:text-white"}`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {visibleFonts.map((font) => {
            const active = selectedFont === font.family;
            const favorite = favoriteFonts.includes(font.family);
            return (
              <div
                key={font.id}
                data-font-row
                className={`group flex min-h-[44px] items-center gap-2 rounded-xl border px-2 transition ${active ? "border-violet-300/35 bg-violet-500/90 text-white" : "border-white/10 bg-white/[0.035] text-white hover:bg-white/[0.06]"}`}
              >
                <button
                  type="button"
                  disabled={!selected}
                  onClick={() => selectFont(font.family)}
                  className="min-w-0 flex-1 py-1.5 text-left disabled:opacity-40"
                >
                  <img
                    src={previewSrc(font)}
                    alt={font.family}
                    loading="lazy"
                    decoding="async"
                    onError={(event) => {
                      event.currentTarget.closest("[data-font-row]")?.remove();
                    }}
                    className="h-6 w-full max-w-[160px] object-contain object-left"
                    draggable={false}
                  />
                  <div
                    className={`mt-1 flex items-center gap-2 text-[10px] font-bold ${active ? "text-white/70" : "text-slate-500"}`}
                  >
                    <span className="truncate">{font.family}</span>
                    <span className="rounded-full bg-white/10 px-1.5 py-0.5 capitalize">
                      {font.category}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => toggleFavorite(font.family)}
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${favorite ? "text-amber-300" : "text-white/30 hover:bg-white/10 hover:text-white/70"}`}
                  title="Favorite"
                >
                  <Star size={15} fill={favorite ? "currentColor" : "none"} />
                </button>
                {active && <Check size={17} />}
              </div>
            );
          })}
        </div>

        {!visibleFonts.length && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-6 text-center text-sm font-bold text-white/50">
            No fonts found.
          </div>
        )}

        {limit < filteredFonts.length && (
          <button
            type="button"
            onClick={() => setLimit((v) => v + PAGE_SIZE)}
            className="h-10 w-full rounded-2xl bg-white/[0.055] text-xs font-black text-slate-300 ring-1 ring-white/10 transition hover:bg-white/[0.08]"
          >
            Load more
          </button>
        )}
      </section>
    </div>
  );
}

export default memo(FontsPanel);

function Label({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center justify-between px-1">
      <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {title}
      </h3>
      {typeof count === "number" && (
        <span className="text-[10px] font-black text-violet-300">{count}</span>
      )}
    </div>
  );
}

function FontPreviewText({ family, text, className }: { family: string; text: string; className: string }) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadEditorFont(family).finally(() => {
      if (!cancelled) setVersion((value) => value + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [family]);

  return (
    <div
      key={`${family}-${version}`}
      className={className}
      style={{
        fontFamily: getEditorFontFamily(family),
        fontWeight: 800,
        letterSpacing: "-0.015em",
      }}
    >
      {text}
    </div>
  );
}
