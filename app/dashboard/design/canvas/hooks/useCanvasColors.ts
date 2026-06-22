"use client";

import { useEffect, useMemo, useState } from "react";

const FALLBACK_COLORS = [
  { name: "White", hex: "#ffffff" },
  { name: "Black", hex: "#111111" },
  { name: "Heather Grey", hex: "#b8b8b8" },
  { name: "Navy", hex: "#17213f" },
  { name: "Stone", hex: "#d8d1c3" },
];

function normalizeColors(input: any): { name: string; hex: string }[] {
  const source = Array.isArray(input) ? input : [];

  return source
    .map((color: any) => ({
      name: String(color?.name || color?.label || color?.hex || "Color"),
      hex: String(color?.hex || color?.value || color?.color || "").trim(),
    }))
    .filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color.hex));
}

export function useCanvasColors(
  productId: string | null,
  mockupColor: string,
  setMockupColor?: (color: string) => void
) {
  const [showColors, setShowColors] = useState(false);
  const [availableColors, setAvailableColors] = useState<{ name: string; hex: string }[]>(FALLBACK_COLORS);

  useEffect(() => {
    let cancelled = false;

    async function loadColors() {
      const safeProductId = String(productId || "").trim();

      if (!safeProductId) {
        setAvailableColors(FALLBACK_COLORS);
        return;
      }

      try {
        const res = await fetch(`/api/product-colors?productId=${encodeURIComponent(safeProductId)}`, {
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Product colors request failed");

        const json = await res.json();
        const colors = normalizeColors(json?.colors || json?.product?.colors || json);

        if (!cancelled) {
          setAvailableColors(colors.length ? colors : FALLBACK_COLORS);
        }
      } catch {
        if (!cancelled) setAvailableColors(FALLBACK_COLORS);
      }
    }

    loadColors();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const colorKeys = useMemo(
    () => new Set(availableColors.map((color) => color.hex.toLowerCase())),
    [availableColors]
  );

  useEffect(() => {
    if (!availableColors.length) return;

    if (!colorKeys.has(String(mockupColor).toLowerCase())) {
      setMockupColor?.(availableColors[0].hex);
    }
  }, [availableColors, colorKeys, mockupColor, setMockupColor]);

  return {
    showColors,
    setShowColors,
    availableColors,
  };
}
