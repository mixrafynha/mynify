"use client";

import { useMemo, useState } from "react";

const VISIBLE_COLOR_COUNT = 9;

export default function ColorSelector({
  variants,
  selectedColor,
  selectedSize,
  selectedVariant,
  onChange,
}: any) {
  const [expanded, setExpanded] = useState(false);

  const normalize = (v: string) =>
    String(v ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const safeVariants = variants ?? [];
  const isVariantSelectable = (variant: any) =>
    Number(variant?.stock ?? 0) > 0 && variant?.country_available !== false;
  const colorMap = new Map();

  safeVariants.forEach((v: any) => {
    if (selectedSize && String(v.size).trim().toLowerCase() !== normalize(selectedSize)) {
      return;
    }
    if (!v.color) return;

    const key = normalize(v.color);

    if (!colorMap.has(key)) {
      colorMap.set(key, {
        label: v.color,
        hex: v.color_hex,
      });
    }
  });

  const colors = Array.from(colorMap.values());
  const visibleColors = useMemo(
    () => (expanded ? colors : colors.slice(0, VISIBLE_COLOR_COUNT)),
    [colors, expanded]
  );
  const hiddenCount = Math.max(0, colors.length - VISIBLE_COLOR_COUNT);

  return (
    <div className="min-w-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold tracking-[0.02em] text-white/72">
            Colors
          </p>
          <p className="mt-3 truncate text-sm font-medium text-white">
            {selectedColor || selectedVariant?.color || "Choose a color"}
          </p>
        </div>

        {hiddenCount > 0 && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="shrink-0 rounded-full bg-white/[0.05] px-3 py-1 text-sm font-bold tracking-[0.18em] text-white/64 transition hover:bg-white/[0.08] hover:text-white"
            aria-label="Show all colors"
          >
            ...
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {visibleColors.map((c: any, i: number) => {
          const normalizedColor = normalize(c.label);
          const available = safeVariants.filter(
            (v: any) =>
              normalize(v.color) === normalizedColor &&
              (!selectedSize || normalize(v.size) === normalize(selectedSize))
          );
          const hasStock = available.some(isVariantSelectable);
          const isActive = normalize(selectedColor || "") === normalizedColor;
          const colorHex =
            c.visual?.cssBackground ||
            c.visual?.hex ||
            c.color_visual?.cssBackground ||
            c.color_visual?.hex ||
            available.find((v: any) => v.color_visual?.cssBackground)?.color_visual?.cssBackground ||
            available.find((v: any) => v.color_visual?.hex)?.color_visual?.hex ||
            available.find((v: any) => v.color_hex)?.color_hex ||
            available[0]?.color_hex ||
            c.hex ||
            "#ccc";

          return (
            <button
              key={`${c.label}-${i}`}
              type="button"
              disabled={!hasStock}
              onClick={() => {
                const next =
                  available.find(
                    (v: any) =>
                      isVariantSelectable(v) &&
                      selectedVariant?.size &&
                      normalize(v.size) === normalize(selectedVariant.size)
                  ) || available.find(isVariantSelectable) || available[0] || null;

                if (!next || !isVariantSelectable(next)) return;
                onChange(c.label, next);
              }}
              className="flex items-center justify-center disabled:cursor-not-allowed"
            >
              <div
                className={`h-8 w-8 rounded-full transition ${
                  isActive
                    ? "scale-110 ring-2 ring-fuchsia-400 ring-offset-2 ring-offset-[#15101d]"
                    : "ring-1 ring-white/20 hover:scale-105"
                } ${!hasStock ? "opacity-30" : ""}`}
                style={
                  String(colorHex).includes("gradient(")
                    ? { backgroundImage: colorHex }
                    : { backgroundColor: colorHex }
                }
              />
            </button>
          );
        })}
      </div>

      {expanded && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-4 text-xs font-semibold text-white/46 transition hover:text-white/72"
        >
          Show less
        </button>
      )}
    </div>
  );
}
