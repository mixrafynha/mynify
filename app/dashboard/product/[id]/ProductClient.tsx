"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Package, Palette, Ruler, ShieldCheck, Zap } from "lucide-react";

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

type ProductClientProps = {
  product: any;
  images: string[];
  id: string;
};

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];

const normalizeSize = (size: unknown) =>
  String(size ?? "")
    .trim()
    .toUpperCase();

export default function ProductClient({
  product,
  images,
  id,
}: ProductClientProps) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const lastSaveRef = useRef(0);

  const safeImages = useMemo(() => {
    const cleanImages = Array.isArray(images) ? images.filter(Boolean) : [];
    return cleanImages.length > 0 ? cleanImages : ["/placeholder.png"];
  }, [images]);

  useEffect(() => {
    const mapped: Variant[] = Array.isArray(product?.variants)
      ? product.variants.map((variant: Variant) => ({
          ...variant,
          size: normalizeSize(variant.size),
          stock: Number(variant.stock ?? 0),
          price: variant.price != null ? Number(variant.price) : null,
          color: variant.color ?? null,
          color_hex: variant.color_hex || "#cccccc",
        }))
      : [];

    mapped.sort((a, b) => {
      const aIndex = SIZE_ORDER.indexOf(normalizeSize(a.size));
      const bIndex = SIZE_ORDER.indexOf(normalizeSize(b.size));

      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    const initial =
      mapped.find((variant) => (variant.stock ?? 0) > 0) || mapped[0] || null;

    setVariants(mapped);
    setSelectedVariant(initial);
    setSelectedColor(initial?.color ?? null);
  }, [product]);

  const colors = useMemo(() => {
    const uniqueColors = new Map<
      string,
      {
        name: string | null | undefined;
        hex: string;
        variant: Variant;
      }
    >();

    for (const variant of variants) {
      if (!variant.color) continue;

      const key = String(variant.color).toLowerCase();

      if (!uniqueColors.has(key)) {
        uniqueColors.set(key, {
          name: variant.color,
          hex: variant.color_hex || "#cccccc",
          variant,
        });
      }
    }

    return Array.from(uniqueColors.values());
  }, [variants]);

  const availableVariants = useMemo(() => {
    if (!selectedColor) return variants;

    const colorKey = String(selectedColor).toLowerCase();

    return variants.filter(
      (variant) => String(variant.color).toLowerCase() === colorKey
    );
  }, [variants, selectedColor]);

  const sizesText = useMemo(() => {
    const sizes = Array.from(
      new Set(variants.map((variant) => variant.size).filter(Boolean))
    );

    return sizes.length ? sizes.join(", ") : "Select variant";
  }, [variants]);

  const colorsText = useMemo(() => {
    const names = colors.map((color) => color.name).filter(Boolean);
    return names.length ? names.join(", ") : "Select color";
  }, [colors]);

  const totalStock = useMemo(() => {
    return variants.reduce(
      (acc, variant) => acc + Number(variant.stock ?? 0),
      0
    );
  }, [variants]);

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
        console.error("SAVE SELECTION ERROR:", err);
      }
    },
    [id]
  );

  const handleColorChange = useCallback(
    (color: string, variant?: Variant) => {
      const colorKey = String(color).toLowerCase();

      const nextVariant =
        variant ||
        variants.find(
          (item) =>
            String(item.color).toLowerCase() === colorKey &&
            (item.stock ?? 0) > 0
        ) ||
        variants.find((item) => String(item.color).toLowerCase() === colorKey) ||
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
    <div className="w-full min-w-0 space-y-4">
      <div className="px-1">
        <ProductBreadcrumb title={product?.title} />
      </div>

      <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] xl:gap-5">
        <div className="min-w-0 rounded-[22px] border border-white/10 bg-white/[0.065] p-3 shadow-lg">
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
        </div>

        <div className="min-w-0 rounded-[22px] border border-white/10 bg-white/[0.065] p-4 shadow-lg lg:sticky lg:top-20">
          <ProductRight product={product} selectedVariant={selectedVariant} />
        </div>
      </div>

      <section className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4 shadow-lg">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-500/35 bg-purple-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/80">
              <Zap size={12} className="text-purple-300" aria-hidden="true" />
              AI creator platform
            </div>

            <h2 className="text-xl font-black uppercase tracking-[-0.03em] text-white sm:text-2xl">
              Product
              <span className="ml-2 bg-gradient-to-r from-violet-300 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                specs
              </span>
            </h2>

            <p className="mt-1 text-sm text-white/50">
              Details, variants and production info.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SpecCard
            icon={Package}
            label="Product"
            value={product?.title ?? "Custom product"}
            tone="text-purple-300"
          />

          <SpecCard
            icon={Palette}
            label="Colors"
            value={colorsText}
            tone="text-fuchsia-300"
          />

          <SpecCard
            icon={Ruler}
            label="Sizes"
            value={sizesText}
            tone="text-cyan-300"
          />

          <SpecCard
            icon={ShieldCheck}
            label="Stock"
            value={totalStock > 0 ? `${totalStock} available` : "Made on demand"}
            tone="text-emerald-300"
          />
        </div>
      </section>
    </div>
  );
}

function SpecCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.065] p-4">
      <Icon className={`mb-3 ${tone}`} size={19} aria-hidden="true" />

      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <p className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-white">
        {value}
      </p>
    </div>
  );
}