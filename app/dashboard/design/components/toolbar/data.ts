"use client";

import { useEffect, useState } from "react";
import * as baseData from "../data";

export * from "../data";

export type FontCategory =
  | "sans"
  | "serif"
  | "display"
  | "handwritten"
  | "luxury"
  | "sporty"
  | "streetwear"
  | "kids"
  | "minimalist"
  | "retro";

export type FontItem = {
  id: string;
  family: string;
  category: FontCategory;
  preview?: string;
  previewSvg?: string;
  previewWebpUrl?: string | null;
  preview_webp_url?: string | null;
  google?: string | null;
  premium?: boolean;
  enabled?: boolean;
};

export const FONT_CATEGORIES: FontCategory[] = [
  "minimalist",
  "sans",
  "luxury",
  "serif",
  "display",
  "sporty",
  "handwritten",
  "streetwear",
  "retro",
  "kids",
];

function normalizeCategory(value: unknown): FontCategory {
  const category = String(value ?? "sans").toLowerCase() as FontCategory;
  return FONT_CATEGORIES.includes(category) ? category : "sans";
}

function normalizeFont(row: any): FontItem | null {
  const id = String(row?.id ?? "").trim();
  const family = String(row?.family ?? row?.google ?? "").trim();

  if (!id || !family) return null;

  return {
    id,
    family,
    category: normalizeCategory(row?.category),
    preview: String(row?.preview ?? "RYFIO"),
    previewSvg: row?.previewSvg ?? undefined,
    previewWebpUrl: row?.previewWebpUrl ?? row?.preview_webp_url ?? null,
    preview_webp_url: row?.preview_webp_url ?? row?.previewWebpUrl ?? null,
    google: row?.google ?? row?.family ?? family,
    premium: Boolean(row?.premium ?? true),
    enabled: row?.enabled ?? true,
  };
}

function dedupeFonts(fonts: FontItem[]) {
  const seen = new Set<string>();

  return fonts.filter((font) => {
    const key = font.family.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const baseFontItems = ((baseData as any).FONT_ITEMS ?? [])
  .map(normalizeFont)
  .filter(Boolean) as FontItem[];

export const FONT_ITEMS: FontItem[] = dedupeFonts(baseFontItems);
export const FONTS = FONT_ITEMS.map((font) => font.family);
export const FONT_OPTIONS = FONTS;

let cachedFontCatalog: FontItem[] | null = null;
let pendingFontCatalog: Promise<FontItem[]> | null = null;

export async function fetchEditorFonts(): Promise<FontItem[]> {
  if (pendingFontCatalog) return pendingFontCatalog;

  pendingFontCatalog = fetch("/api/editor-fonts", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error("Failed to fetch editor fonts");
      return response.json();
    })
    .then((payload) => {
      const rows = Array.isArray(payload?.fonts)
        ? payload.fonts
        : Array.isArray(payload)
          ? payload
          : [];

      const fonts = dedupeFonts(
        rows.map(normalizeFont).filter(Boolean) as FontItem[],
      );

      if (fonts.length) cachedFontCatalog = fonts;
      return cachedFontCatalog ?? FONT_ITEMS;
    })
    .catch(() => cachedFontCatalog ?? FONT_ITEMS)
    .finally(() => {
      pendingFontCatalog = null;
    });

  return pendingFontCatalog;
}

export function useEditorFontCatalog() {
  const [fonts, setFonts] = useState<FontItem[]>(() => cachedFontCatalog ?? FONT_ITEMS);
  const [loading, setLoading] = useState(() => !cachedFontCatalog);

  useEffect(() => {
    let cancelled = false;

    fetchEditorFonts()
      .then((nextFonts) => {
        if (!cancelled) setFonts(nextFonts);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { fonts, loading };
}

export function getFontPreviewUrl(font: FontItem | undefined | null) {
  if (!font) return null;

  return font.previewWebpUrl || font.preview_webp_url || null;
}

function normalizeFamily(value: string) {
  return value.trim().replace(/^['"]|['"]$/g, "");
}

export function getFontByFamily(family?: string) {
  if (!family) return undefined;
  const normalized = normalizeFamily(family).toLowerCase();
  const source = cachedFontCatalog ?? FONT_ITEMS;
  return source.find((font) => font.family.toLowerCase() === normalized);
}

export function isValidEditorFontFamily(family?: string) {
  return Boolean(getFontByFamily(family));
}

export function getEditorFontFamily(family?: string, fallback = "Inter") {
  const font = getFontByFamily(family) ?? getFontByFamily(fallback) ?? FONT_ITEMS[0];
  return `"${font?.family ?? fallback}", sans-serif`;
}

const LOADED_EDITOR_FONTS = new Set<string>();
const LOADING_EDITOR_FONTS = new Map<string, Promise<void>>();

function getGoogleFontHref(font: FontItem) {
  const family = encodeURIComponent(font.google || font.family).replace(/%20/g, "+");
  return `https://fonts.googleapis.com/css2?family=${family}:wght@400;500;600;700;800;900&display=swap`;
}

function ensureGoogleFontsPreconnect() {
  if (typeof document === "undefined") return;

  if (!document.getElementById("editor-fonts-preconnect-gstatic")) {
    const gstatic = document.createElement("link");
    gstatic.id = "editor-fonts-preconnect-gstatic";
    gstatic.rel = "preconnect";
    gstatic.href = "https://fonts.gstatic.com";
    gstatic.crossOrigin = "anonymous";
    document.head.appendChild(gstatic);
  }

  if (!document.getElementById("editor-fonts-preconnect-googleapis")) {
    const googleapis = document.createElement("link");
    googleapis.id = "editor-fonts-preconnect-googleapis";
    googleapis.rel = "preconnect";
    googleapis.href = "https://fonts.googleapis.com";
    document.head.appendChild(googleapis);
  }
}

async function waitForFontPaint(family: string) {
  if (typeof document === "undefined") return;

  try {
    await Promise.all([
      document.fonts?.load(`400 24px "${family}"`) ?? Promise.resolve(),
      document.fonts?.load(`700 24px "${family}"`) ?? Promise.resolve(),
      document.fonts?.load(`900 24px "${family}"`) ?? Promise.resolve(),
    ]);
    await (document.fonts?.ready ?? Promise.resolve());
  } catch {
    // Keep the editor usable if the font provider fails.
  }
}

export function loadEditorFont(fontOrFamily: FontItem | string): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();

  const font = typeof fontOrFamily === "string" ? getFontByFamily(fontOrFamily) : fontOrFamily;
  if (!font) return Promise.resolve();

  ensureGoogleFontsPreconnect();

  const id = `editor-font-${font.id}`;
  const existingPromise = LOADING_EDITOR_FONTS.get(id);
  if (existingPromise) return existingPromise;

  const existingLink = document.getElementById(id) as HTMLLinkElement | null;

  const promise = new Promise<void>((resolve) => {
    const finish = () => {
      LOADED_EDITOR_FONTS.add(id);
      void waitForFontPaint(font.family).finally(resolve);
    };

    if (LOADED_EDITOR_FONTS.has(id) || existingLink?.sheet) {
      finish();
      return;
    }

    if (existingLink) {
      existingLink.addEventListener("load", finish, { once: true });
      existingLink.addEventListener("error", finish, { once: true });
      void waitForFontPaint(font.family).finally(finish);
      return;
    }

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = getGoogleFontHref(font);
    link.onload = finish;
    link.onerror = finish;
    document.head.appendChild(link);
  });

  LOADING_EDITOR_FONTS.set(id, promise);
  return promise;
}

// Kept for backwards compatibility. The toolbar must not preload fonts while scrolling.
export function loadVisibleEditorFonts(): Promise<void> {
  return Promise.resolve();
}

export const PRINT_IMAGE_LIMITS = {
  maxBytes: 25 * 1024 * 1024,
};

export const bytesToMb = (bytes: number) => bytes / 1024 / 1024;

export function validatePrintImage(file: File) {
  if (file.size > PRINT_IMAGE_LIMITS.maxBytes) {
    return {
      ok: false,
      error: `Image is too large. Max ${bytesToMb(PRINT_IMAGE_LIMITS.maxBytes).toFixed(0)}MB.`,
    };
  }

  return { ok: true, error: null };
}
