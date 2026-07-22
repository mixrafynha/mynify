"use client";

import { memo, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { EXTRA_STICKER_ITEMS, STICKER_CATEGORIES, STICKER_ITEMS, StickerPreset } from "../data";
import { TARGET_PRINT_DPI } from "../../canvas/engine/dpi";
import { createStickerAsset, loadStickerAsset } from "../../element/renderAsset";

const DESKTOP_PAGE_SIZE = 48;
const MOBILE_PAGE_SIZE = 24;
const STICKER_INSERT_SIZE = 150;
const ALL_STICKER_ITEMS = [...STICKER_ITEMS, ...EXTRA_STICKER_ITEMS];

function getPageSize() {
  if (typeof window === "undefined") return DESKTOP_PAGE_SIZE;
  return window.matchMedia?.("(max-width: 767px)").matches ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE;
}

/**
 * Otimização: A função addSticker não processa mais Canvas ou DataURLs pesadas.
 * Ela apenas envia metadados. O motor do Canvas decidirá como desenhar
 * em alta qualidade apenas no momento da exportação.
 */
async function addSticker(createElement: ((element: any) => void) | undefined, item: StickerPreset) {
  const svg = await loadStickerAsset(item.value, item.svg);
  if (!svg) throw new Error(`Sticker asset unavailable: ${item.label}`);
  createElement?.({
    type: "sticker-element",
    value: item.value,
    svg,
    width: STICKER_INSERT_SIZE,
    height: STICKER_INSERT_SIZE,
    meta: {
      title: item.label,
      sticker: item.label,
      targetDpi: TARGET_PRINT_DPI,
      isVector: true,
      // Se não for SVG, o motor de renderização usará o value para desenhar o emoji
      source: item.svg ? "svg" : "emoji", 
    },
  });
}

const StickerPreview = memo(({ item }: { item: StickerPreset }) => {
  // Preview leve usando apenas imagem estática ou texto (sem canvas)
  const previewSrc = item.preview || createStickerAsset(item.value, item.svg);
  if (previewSrc) {
    return (
      <img 
        src={previewSrc}
        alt={item.label}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-contain"
        style={{ imageRendering: 'auto' }}
      />
    );
  }

  return (
    <span 
      className="flex items-center justify-center w-full h-full"
      style={{ fontSize: 'clamp(20px, 4vw, 40px)' }}
    >
      {item.value}
    </span>
  );
});

StickerPreview.displayName = 'StickerPreview';

function StickersPanel({ createElement }: { createElement?: (element: any) => void }) {
  const [stickers, setStickers] = useState<StickerPreset[]>(ALL_STICKER_ITEMS);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [assetError, setAssetError] = useState("");
  const deferredQuery = useDeferredValue(query);
  const categories = useMemo(
    () => Array.from(new Set([...STICKER_CATEGORIES, ...stickers.map((item) => item.category)])),
    [stickers],
  );

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/editor-assets?type=stickers", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Editor stickers request failed: ${response.status}`);
        return response.json() as Promise<{ stickers?: StickerPreset[] }>;
      })
      .then((payload) => {
        if (Array.isArray(payload.stickers) && payload.stickers.length > 0) {
          setStickers(payload.stickers);
          setPage(1);
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.warn("Using local sticker catalog fallback.", error);
        }
      });

    return () => controller.abort();
  }, []);
  
  const items = useMemo(() => {
    const term = deferredQuery.trim().toLowerCase();
    return stickers.filter((item) => 
      (category === "All" || item.category === category) && 
      (!term || `${item.label} ${item.category}`.toLowerCase().includes(term))
    );
  }, [category, deferredQuery, stickers]);

  const pageSize = useMemo(() => getPageSize(), []);
  const visibleItems = useMemo(() => items.slice(0, page * pageSize), [items, page, pageSize]);

  return (
    <div className="space-y-3 pb-4">
      <label className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#070711] px-3 text-slate-400">
        <Search size={14} />
        <input 
          value={query} 
          onChange={(e) => { setQuery(e.target.value); setPage(1); }} 
          placeholder="Buscar stickers..." 
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-white outline-none"
        />
      </label>

      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {["All", ...categories].map((cat) => (
          <button 
            key={cat} 
            type="button" 
            onClick={() => { setCategory(cat); setPage(1); }} 
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition
              ${category === cat ? "border-pink-300/50 bg-pink-400 text-slate-950" : "border-white/10 bg-white/5 text-slate-400"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8">
        {visibleItems.map((item) => (
          <button 
            key={item.id} 
            type="button" 
            onClick={() => {
              setAssetError("");
              void addSticker(createElement, item).catch(() => setAssetError("Sticker SVG could not be loaded. It was not added to the print design."));
            }}
            className="aspect-square rounded-xl border border-white/10 bg-white/5 hover:border-violet-300/50 active:scale-95 transition"
          >
            <StickerPreview item={item} />
          </button>
        ))}
      </div>

      {assetError && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">{assetError}</p>}

      {visibleItems.length < items.length && (
        <button 
          onClick={() => setPage((p) => p + 1)} 
          className="h-9 w-full rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white hover:bg-white/10"
        >
          Carregar mais
        </button>
      )}
    </div>
  );
}

export default memo(StickersPanel);
