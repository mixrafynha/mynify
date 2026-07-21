"use client";

import { useEffect, useMemo, useState } from "react";

export type CanvasColorOption = {
  name: string;
  hex: string;
  variantId?: string | null;
  productColorId?: string | null;
  size?: string | null;
  sku?: string | null;
  price?: number | string | null;
  imageUrl?: string | null;
  frontUrl?: string | null;
  backUrl?: string | null;
};

const FALLBACK_COLORS: CanvasColorOption[] = [
  { name: "White", hex: "#ffffff" },
  { name: "Black", hex: "#111111" },
  { name: "Heather Grey", hex: "#b8b8b8" },
  { name: "Navy", hex: "#17213f" },
  { name: "Stone", hex: "#d8d1c3" },
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidHexColor(value: unknown) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(String(value || "").trim());
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readUrl(source: any, side: "front" | "back") {
  return text(
    source?.[`mockup_${side}`] ||
    source?.[`${side}_url`] ||
    source?.[`${side}Url`] ||
    source?.[`${side}_mockup_url`] ||
    source?.[`${side}MockupUrl`] ||
    source?.mockups?.[side] ||
    source?.images?.[side] ||
    source?.raw?.[`mockup_${side}`] ||
    source?.raw?.[`${side}_url`],
  );
}

function normalizeColors(input: any, selectedSize?: string | null): CanvasColorOption[] {
  const source = Array.isArray(input) ? input : [];
  return source.flatMap((color: any) => {
    const variants = Array.isArray(color?.variants) ? color.variants : [];
    const variant = variants.find((item: any) => String(item?.size || "").toLowerCase() === String(selectedSize || "").toLowerCase()) || variants[0] || color;
    const hex = String(color?.hex || color?.hexCode || color?.hex_code || color?.colorHex || color?.color_hex || color?.value || color?.color || variant?.colorHex || variant?.color_hex || "").trim();
    if (!isValidHexColor(hex)) return [];
    const frontUrl = readUrl(variant, "front") || readUrl(color, "front");
    const backUrl = readUrl(variant, "back") || readUrl(color, "back");
    return [{
      name: String(color?.name || color?.label || variant?.colorName || variant?.color_name || hex),
      hex,
      variantId: text(variant?.variantId || variant?.variant_id || variant?.id),
      productColorId: text(color?.productColorId || color?.product_color_id || color?.id || variant?.productColorId || variant?.product_color_id),
      size: text(variant?.size) || selectedSize || null,
      sku: text(variant?.sku),
      price: variant?.variantPrice ?? variant?.variant_price ?? variant?.price ?? color?.price ?? null,
      imageUrl: text(variant?.imageUrl || variant?.image_url || variant?.image),
      frontUrl,
      backUrl,
    }];
  });
}

export function useCanvasColors(productId: string | null, mockupColor: string, setMockupColor?: (color: string) => void, selectedSize?: string | null) {
  const [showColors, setShowColors] = useState(false);
  const [rawColors, setRawColors] = useState<any[]>([]);
  const availableColors = useMemo(() => {
    const normalized = normalizeColors(rawColors, selectedSize);
    if (normalized.length) return normalized;
    return UUID_RE.test(String(productId || "").trim()) ? [] : FALLBACK_COLORS;
  }, [productId, rawColors, selectedSize]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function loadColors() {
      const safeProductId = String(productId || "").trim();
      if (!safeProductId || !UUID_RE.test(safeProductId)) { setRawColors([]); return; }
      try {
        const res = await fetch(`/api/product-variants?productId=${encodeURIComponent(safeProductId)}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Product variants request failed");
        const json = await res.json();
        const colors = json?.availableVariants?.colors || json?.colors || [];
        const variants = Array.isArray(json?.variants) ? json.variants : [];
        const grouped = (Array.isArray(colors) ? colors : []).map((color: any) => ({
          ...color,
          variants: variants.filter((variant: any) =>
            String(variant?.product_color_id || "") === String(color?.id || ""),
          ),
        }));
        if (!cancelled) setRawColors(grouped);
      } catch {
        if (!controller.signal.aborted && !cancelled) setRawColors([]);
      }
    }
    void loadColors();
    return () => { cancelled = true; controller.abort(); };
  }, [productId]);

  useEffect(() => {
    if (!availableColors.length || isValidHexColor(mockupColor)) return;
    setMockupColor?.(availableColors[0].hex);
  }, [availableColors, mockupColor, setMockupColor]);

  return { showColors, setShowColors, availableColors };
}
