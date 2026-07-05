"use client";

import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Search, Star, Type } from "lucide-react";
import {
  FONT_CATEGORIES,
  FONT_ITEMS,
  loadEditorFont,
  type FontCategory,
  type FontItem,
} from "../data";

const FAVORITES_KEY = "ryfio-editor-favorite-fonts";
const RECENTS_KEY = "ryfio-editor-recent-fonts";
const PAGE_SIZE = 12;
const MAX_RECENTS = 24;
const MAX_STORED_FAVORITES = 80;

const PRIORITY_FONT_IDS = [
  "inter",
  "playfair-display",
  "bebas-neue",
  "great-vibes",
  "orbitron",
  "poppins",
  "anton",
  "lora",
  "black-ops-one",
  "pacifico",
  "montserrat",
  "cinzel",
  "archivo-black",
  "dancing-script",
  "rubik",
  "abril-fatface",
  "righteous",
  "caveat",
  "oswald",
  "cormorant-garamond",
  "space-grotesk",
  "prata",
  "league-spartan",
  "allura",
  "manrope",
  "gloock",
  "bangers",
  "kalam",
  "dm-sans",
  "yeseva-one",
  "rubik-spray-paint",
  "lobster",
  "sora",
  "dm-serif-display",
  "luckiest-guy",
  "patrick-hand",
  "raleway",
  "bodoni-moda",
  "special-elite",
  "kaushan-script",
  "urbanist",
  "abril-fatface",
  "fredoka",
  "sacramento",
  "archivo",
  "playball",
  "teko",
  "shrikhand",
  "quicksand",
  "baloo-2",
];

const CATEGORY_ORDER: FontCategory[] = [
  "minimalist",
  "luxury",
  "sporty",
  "handwritten",
  "display",
  "sans",
  "serif",
  "streetwear",
  "retro",
  "kids",
];

function uniqueFamilyKey(value: string) {
  return value.trim().toLowerCase();
}

function uniqueFamilies(values: string[]) {
  const seen = new Set<string>();

  return values.filter((value) => {
    const key = uniqueFamilyKey(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

function mixFontsByCategory(fonts: FontItem[]) {
  const buckets = new Map<FontCategory, FontItem[]>();

  CATEGORY_ORDER.forEach((category) => buckets.set(category, []));

  fonts.forEach((font) => {
    const bucket = buckets.get(font.category) ?? [];
    bucket.push(font);
    buckets.set(font.category, bucket);
  });

  const mixed: FontItem[] = [];
  let hasFonts = true;

  while (hasFonts) {
    hasFonts = false;

    CATEGORY_ORDER.forEach((category) => {
      const bucket = buckets.get(category);
      const next = bucket?.shift();

      if (next) {
        mixed.push(next);
        hasFonts = true;
      }
    });
  }

  return mixed;
}

function sortFontsForDiscovery(fonts: FontItem[]) {
  const priority = new Map(PRIORITY_FONT_IDS.map((id, index) => [id, index]));
  const priorityFonts: FontItem[] = [];
  const remainingFonts: FontItem[] = [];

  fonts.forEach((font) => {
    if (priority.has(font.id)) priorityFonts.push(font);
    else remainingFonts.push(font);
  });

  priorityFonts.sort((a, b) => {
    return (priority.get(a.id) ?? 9999) - (priority.get(b.id) ?? 9999);
  });

  const mixedRemaining = mixFontsByCategory(remainingFonts);

  return dedupeFontsByFamily([...priorityFonts, ...mixedRemaining]);
}

function readStorage(key: string) {
  if (typeof window === "undefined") return [] as string[];

  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed)
      ? uniqueFamilies(parsed.filter(Boolean).map(String))
      : [];
  } catch {
    return [] as string[];
  }
}

function writeStorage(key: string, value: string[], max = 40) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(uniqueFamilies(value).slice(0, max)));
}

function getPreviewUrl(item: unknown) {
  const value = item as Record<string, any>;
  return String(
    value.previewUrl ??
      value.preview_url ??
      value.previewImageUrl ??
      value.preview_image_url ??
      value.fontPreviewUrl ??
      value.font_preview_url ??
      value.meta?.previewUrl ??
      value.meta?.preview_url ??
      "",
  );
}

function triggerFontPreview(font: FontItem) {
  if (typeof window === "undefined") return;

  void fetch("/api/font-previews/trigger", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fontId: font.id,
      family: font.family,
      category: font.category,
    }),
    keepalive: true,
  }).catch(() => undefined);
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

function TextPanel({
  createElement,
  onAddText,
}: {
  createElement?: (element: any) => void;
  onAddText?: () => void;
}) {
  const lockedRef = useRef(false);
  const requestedPreviewsRef = useRef<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<
    FontCategory | "all" | "favorites" | "recent"
  >("all");
  const [favorites, setFavorites] = useState<string[]>(() =>
    readStorage(FAVORITES_KEY),
  );
  const [recents, setRecents] = useState<string[]>(() =>
    readStorage(RECENTS_KEY),
  );
  const [limit, setLimit] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query);

  const visibleCatalogFonts = useMemo(() => {
    return sortFontsForDiscovery(dedupeFontsByFamily(FONT_ITEMS));
  }, []);

  const allFilteredFonts = useMemo(() => {
    const term = deferredQuery.trim().toLowerCase();
    let source: FontItem[] = visibleCatalogFonts;

    if (category === "favorites") {
      source = visibleCatalogFonts.filter((font) =>
        favorites.includes(font.family),
      );
    } else if (category === "recent") {
      source = visibleCatalogFonts.filter((font) => recents.includes(font.family));
    } else if (category !== "all") {
      source = visibleCatalogFonts.filter((font) => font.category === category);
    }

    if (!term) return source;

    return source.filter((font) =>
      `${font.family} ${font.category} ${font.id}`.toLowerCase().includes(term),
    );
  }, [category, deferredQuery, favorites, recents, visibleCatalogFonts]);

  const filteredFonts = useMemo(
    () => allFilteredFonts.slice(0, limit),
    [allFilteredFonts, limit],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const idle = (window as any).requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 120));
    const cancelIdle = (window as any).cancelIdleCallback ?? window.clearTimeout;

    const id = idle(() => {
      filteredFonts.slice(0, 18).forEach((font) => {
        if (getPreviewUrl(font)) return;
        if (requestedPreviewsRef.current.has(font.id)) return;
        requestedPreviewsRef.current.add(font.id);
        triggerFontPreview(font);
      });
    });

    return () => cancelIdle(id as number);
  }, [filteredFonts]);

  const markRecent = useCallback((family: string) => {
    const next = [family, ...recents.filter((item) => item !== family)].slice(
      0,
      MAX_RECENTS,
    );
    setRecents(next);
    writeStorage(RECENTS_KEY, next, MAX_RECENTS);
  }, [recents]);

  const toggleFavorite = useCallback((family: string) => {
    const next = favorites.includes(family)
      ? favorites.filter((item) => item !== family)
      : [family, ...favorites].slice(0, MAX_STORED_FAVORITES);

    setFavorites(next);
    writeStorage(FAVORITES_KEY, next, MAX_STORED_FAVORITES);
  }, [favorites]);

  const addFont = useCallback(async (font: FontItem) => {
    if (lockedRef.current) return;
    lockedRef.current = true;

    try {
      await loadEditorFont(font);
      markRecent(font.family);
      createElement?.(buildTextElement(font));
    } finally {
      window.setTimeout(() => {
        lockedRef.current = false;
      }, 160);
    }
  }, [createElement, markRecent]);

  const changeCategory = useCallback((
    item: FontCategory | "all" | "favorites" | "recent",
  ) => {
    setCategory(item);
    setLimit(PAGE_SIZE);
  }, []);

  const addDefaultText = useCallback(() => {
    const first = filteredFonts[0] || allFilteredFonts[0] || visibleCatalogFonts[0];
    if (first) void addFont(first);
  }, [addFont, allFilteredFonts, filteredFonts, visibleCatalogFonts]);

  return (
    <div className="flex h-full min-h-0 flex-col text-white" style={{ contain: "layout paint style" }}>
      <div className="shrink-0 space-y-3 pb-3">
        <button
          type="button"
          onClick={onAddText || addDefaultText}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 px-4 text-sm font-black text-white shadow-lg shadow-violet-950/25 active:scale-[0.99]"
        >
          <Type size={17} /> Add text
        </button>

        <PanelLabel title="Fonts" count={allFilteredFonts.length} />

        <label className="flex h-11 items-center gap-2 rounded-2xl bg-white/[0.055] px-3 text-slate-400 ring-1 ring-white/10 focus-within:ring-violet-400/60">
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setLimit(PAGE_SIZE);
            }}
            placeholder={`Search ${visibleCatalogFonts.length}+ fonts`}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-600"
          />
        </label>

        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(["all", "favorites", "recent", ...FONT_CATEGORIES] as const).map(
            (item) => (
              <button
                key={item}
                type="button"
                onClick={() => changeCategory(item)}
                className={`shrink-0 rounded-full px-3 py-2 text-xs font-black capitalize transition-colors active:scale-95 ${
                  category === item
                    ? "bg-violet-500 text-white"
                    : "bg-white/[0.045] text-slate-400 ring-1 ring-white/10"
                }`}
              >
                {item}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3">
          {filteredFonts.map((font) => (
            <FontCard
              key={font.id}
              font={font}
              previewUrl={getPreviewUrl(font)}
              favorite={favorites.includes(font.family)}
              onAdd={() => addFont(font)}
              onToggleFavorite={() => toggleFavorite(font.family)}
            />
          ))}
        </div>

        {!filteredFonts.length && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-6 text-center text-sm font-bold text-white/50">
            No fonts found.
          </div>
        )}

        {limit < allFilteredFonts.length && (
          <button
            type="button"
            onClick={() => setLimit((value) => value + PAGE_SIZE)}
            className="mt-3 h-11 w-full rounded-2xl bg-white/[0.055] text-xs font-black text-slate-300 ring-1 ring-white/10 active:scale-[0.98]"
          >
            Load more fonts
          </button>
        )}
      </div>
    </div>
  );
}

const FontCard = memo(function FontCard({
  font,
  previewUrl,
  favorite,
  onAdd,
  onToggleFavorite,
}: {
  font: FontItem;
  previewUrl: string;
  favorite: boolean;
  onAdd: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-white/[0.045] ring-1 ring-white/10 transition hover:bg-white/[0.065] active:scale-[0.98]" style={{ contain: "layout paint style" }}>
      <button
        type="button"
        onClick={onAdd}
        className="flex h-[64px] w-full items-center justify-center px-2 py-2"
        aria-label={`Add text with ${font.family}`}
        title={font.family}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={font.family}
            loading="lazy"
            decoding="async"
            className="max-h-[38px] max-w-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="w-full truncate text-center text-[20px] font-black leading-none text-white/88">
            RYFIO
          </div>
        )}
      </button>

      {!previewUrl && (
        <div className="pointer-events-none absolute inset-x-3 bottom-2 h-1 rounded-full bg-white/10">
          <div className="h-full w-1/2 rounded-full bg-violet-300/40" />
        </div>
      )}

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggleFavorite();
        }}
        className={`absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-xl bg-black/30 ${
          favorite ? "text-yellow-300" : "text-slate-500 opacity-80 group-hover:opacity-100"
        }`}
        aria-label={
          favorite
            ? `Remove ${font.family} from favorites`
            : `Favorite ${font.family}`
        }
      >
        <Star size={13} fill={favorite ? "currentColor" : "none"} />
      </button>
    </div>
  );
});

export default memo(TextPanel);

function PanelLabel({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {title}
      </h3>
      {typeof count === "number" && (
        <span className="text-[10px] font-black text-violet-300">{count}</span>
      )}
    </div>
  );
}
