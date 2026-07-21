"use client";

import { useEffect, useState } from "react";

const FALLBACK_COLORS = [
  { name: "White", hex: "#ffffff" },
  { name: "Black", hex: "#111111" },
  { name: "Heather Grey", hex: "#b8b8b8" },
  { name: "Navy", hex: "#17213f" },
  { name: "Stone", hex: "#d8d1c3" },
];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidHexColor(value: unknown) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(String(value || "").trim());
}

function normalizeColors(input: any): { name: string; hex: string }[] {
  const source = Array.isArray(input) ? input : [];

  return source
    .map((color: any) => ({
      name: String(color?.name || color?.label || color?.hex || "Color"),
      hex: String(color?.hex || color?.value || color?.color || "").trim(),
    }))
    .filter((color) => isValidHexColor(color.hex));
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
    const controller = new AbortController();

    async function loadColors() {
      const safeProductId = String(productId || "").trim();

      if (!safeProductId || !UUID_RE.test(safeProductId)) {
        setAvailableColors(FALLBACK_COLORS);
        return;
      }

      try {
        const res = await fetch(
          `/api/product-colors?productId=${encodeURIComponent(safeProductId)}`,
          { signal: controller.signal },
        );

        if (!res.ok) throw new Error("Product colors request failed");

        const json = await res.json();
        const colors = normalizeColors(json?.colors || json?.product?.colors || json);

        if (!cancelled) {
          setAvailableColors(colors.length ? colors : FALLBACK_COLORS);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        if (!cancelled) setAvailableColors(FALLBACK_COLORS);
      }
    }

    loadColors();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [productId]);


  useEffect(() => {
    if (!availableColors.length) return;

    // The selected product color is canonical for the editor preview.
    // Do not overwrite a valid user/variant HEX just because it is missing
    // from the current API/fallback palette; that was resetting blue/black/etc.
    // back to the first fallback color, usually white.
    if (isValidHexColor(mockupColor)) return;

    setMockupColor?.(availableColors[0].hex);
  }, [availableColors, mockupColor, setMockupColor]);

  return {
    showColors,
    setShowColors,
    availableColors,
  };
}
