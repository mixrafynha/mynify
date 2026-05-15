"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";

import { ProductBreadcrumb } from "./ProductBreadcrumb";
import { ProductLeft } from "./ProductLeft";
import { ProductRight } from "./ProductRight";

type Variant = {
  id: string;
  size?: string;
  stock?: number;
  price?: number | null;
  sku?: string | null;
  color?: string | null;
  color_hex?: string | null;
  product_color_id?: string;
};

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];

const normalizeSize = (size: any) => String(size ?? "").trim().toUpperCase();

export default function ProductClient({
  product,
  images,
  id,
}: {
  product: any;
  images: string[];
  id: string;
}) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const lastSaveRef = useRef(0);

  const safeImages = useMemo(
    () => (images?.length ? images : ["/placeholder.png"]),
    [images]
  );

  useEffect(() => {
    const mapped = Array.isArray(product?.variants)
      ? product.variants.map((v: Variant) => ({
          ...v,
          size: normalizeSize(v.size),
          stock: Number(v.stock ?? 0),
          price: v.price != null ? Number(v.price) : null,
          color: v.color ?? null,
          color_hex: v.color_hex || "#cccccc",
        }))
      : [];

    mapped.sort((a: Variant, b: Variant) => {
      const aIndex = SIZE_ORDER.indexOf(normalizeSize(a.size));
      const bIndex = SIZE_ORDER.indexOf(normalizeSize(b.size));

      const safeA = aIndex === -1 ? 999 : aIndex;
      const safeB = bIndex === -1 ? 999 : bIndex;

      return safeA - safeB;
    });

    setVariants(mapped);

    const initial =
      mapped.find((v: Variant) => (v.stock ?? 0) > 0) || mapped[0] || null;

    setSelectedVariant(initial);
    setSelectedColor(initial?.color ?? null);
  }, [product]);

  const colors = useMemo(() => {
    return Array.from(
      new Map(
        variants
          .filter((v) => v.color)
          .map((v) => [
            String(v.color).toLowerCase(),
            {
              name: v.color,
              hex: v.color_hex || "#cccccc",
              variant: v,
            },
          ])
      ).values()
    );
  }, [variants]);

  const availableVariants = useMemo(() => {
    if (!selectedColor) return variants;

    return variants.filter(
      (v) =>
        String(v.color).toLowerCase() === String(selectedColor).toLowerCase()
    );
  }, [variants, selectedColor]);

  const saveSelection = useCallback(
    async (variant: Variant | null, color: string | null) => {
      try {
        const now = Date.now();
        if (now - lastSaveRef.current < 700) return;

        lastSaveRef.current = now;

        await fetch("/api/user-selection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: id,
            variant_id: variant?.id ?? null,
            size: variant?.size ?? null,
            color,
          }),
        });
      } catch (err) {
        console.error(err);
      }
    },
    [id]
  );

  const handleColorChange = useCallback(
    (color: string, variant?: Variant) => {
      const nextVariant =
        variant ||
        variants.find(
          (v) =>
            String(v.color).toLowerCase() === String(color).toLowerCase() &&
            (v.stock ?? 0) > 0
        ) ||
        variants.find(
          (v) => String(v.color).toLowerCase() === String(color).toLowerCase()
        ) ||
        null;

      setSelectedColor(color);
      setSelectedVariant(nextVariant);
      saveSelection(nextVariant, color);
    },
    [variants, saveSelection]
  );

  const handleSizeChange = useCallback(
    (variant: Variant) => {
      const nextColor = variant?.color ?? selectedColor;

      setSelectedVariant(variant);
      setSelectedColor(nextColor);

      saveSelection(variant, nextColor);
    },
    [saveSelection, selectedColor]
  );

  return (
    <div className="w-full space-y-7">
      <div className="px-1 sm:px-0">
        <ProductBreadcrumb title={product?.title} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        <ProductLeft
          images={safeImages}
          product={product}
          variants={variants}
          availableVariants={availableVariants}
          colors={colors}
          selectedColor={selectedColor}
          selectedVariant={selectedVariant}
          onColorChange={handleColorChange}
          onSizeChange={handleSizeChange}
        />

        <ProductRight product={product} selectedVariant={selectedVariant} />
      </div>
    </div>
  );
}