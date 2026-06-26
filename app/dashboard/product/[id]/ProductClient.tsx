"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  BadgeCheck,
  Factory,
  Package,
  Palette,
  Ruler,
  ShieldCheck,
  Sparkles,
  Truck,
  WashingMachine,
  Zap,
} from "lucide-react";

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

type InfoItem = [string, string];

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];

const normalizeSize = (size: unknown) =>
  String(size ?? "").trim().toUpperCase();

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

    return sizes.length ? sizes.join(", ") : "Select size";
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
    <div className="w-full min-w-0 space-y-4 bg-transparent">
      <div className="px-1">
        <ProductBreadcrumb title={product?.title} />
      </div>

      <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] xl:gap-5">
        <div className="min-w-0 rounded-[24px] border border-white/[0.06] bg-[#090811]/70 p-2 shadow-[0_18px_52px_rgba(0,0,0,0.22)] sm:p-3">
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

        <div className="min-w-0 rounded-[24px] border border-white/[0.06] bg-[#090811]/70 p-3 shadow-[0_18px_52px_rgba(0,0,0,0.22)] sm:p-4 lg:sticky lg:top-20">
          <ProductRight product={product} selectedVariant={selectedVariant} />
        </div>
      </div>

      <section className="overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#090811]/70 shadow-[0_18px_52px_rgba(0,0,0,0.22)]">
        <div className="relative overflow-hidden border-b border-white/[0.06] px-4 py-5 sm:px-6 sm:py-6">
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#090811]/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/65">
              <Zap size={14} className="text-fuchsia-200" aria-hidden="true" />
              Product details
            </div>

            <h2 className="max-w-3xl text-2xl font-black tracking-[-0.05em] text-white sm:text-3xl">
              Everything you need to know
            </h2>

            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-white/50">
              Materials, fit, sizing, production, care and delivery details to
              help customers buy with confidence.
            </p>
          </div>
        </div>

        <div className="space-y-3 p-3 sm:space-y-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SpecCard
              icon={Package}
              label="Article"
              value={product?.title ?? "Custom product"}
              tone="text-violet-200"
            />

            <SpecCard
              icon={Palette}
              label="Colors"
              value={colorsText}
              tone="text-fuchsia-200"
            />

            <SpecCard
              icon={Ruler}
              label="Sizes"
              value={sizesText}
              tone="text-cyan-200"
            />

            <SpecCard
              icon={ShieldCheck}
              label="Availability"
              value={
                totalStock > 0 ? `${totalStock} available` : "Made on demand"
              }
              tone="text-emerald-200"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <InfoBox
              icon={Sparkles}
              title="Product quality"
              accent="bg-fuchsia-400/12"
              items={[
                [
                  "Material",
                  product?.material ||
                    "Premium cotton blend with soft-touch finish",
                ],
                ["Fit", product?.fit || "Regular fit for everyday comfort"],
                [
                  "Print",
                  product?.print_type ||
                    "High-quality DTG print with vibrant colors",
                ],
                [
                  "Feel",
                  product?.feel || "Breathable, lightweight and soft on skin",
                ],
              ]}
            />

            <InfoBox
              icon={Ruler}
              title="Size guide"
              accent="bg-cyan-400/12"
              items={[
                ["Available sizes", sizesText],
                ["Selected size", selectedVariant?.size || "Choose a size"],
                [
                  "Measurements",
                  product?.measurements ||
                    product?.size_guide ||
                    "See product photos for sizing reference",
                ],
                [
                  "Recommendation",
                  product?.size_tip || "For oversized style choose one size up",
                ],
              ]}
            />

            <InfoBox
              icon={WashingMachine}
              title="Care instructions"
              accent="bg-emerald-400/12"
              items={[
                ["Wash", product?.care_wash || "Machine wash cold, max 30°C"],
                [
                  "Inside out",
                  product?.care_inside_out ||
                    "Wash inside out to preserve print",
                ],
                ["Dry", product?.care_dry || "Air dry recommended"],
                [
                  "Iron",
                  product?.care_iron || "Do not iron directly on design",
                ],
              ]}
            />

            <InfoBox
              icon={Factory}
              title="Production"
              accent="bg-orange-400/12"
              items={[
                [
                  "Type",
                  product?.production_type || "Made on demand after purchase",
                ],
                [
                  "Processing",
                  product?.processing_time ||
                    "2–5 business days production time",
                ],
                [
                  "Provider",
                  product?.provider || "Professional print partner fulfillment",
                ],
                [
                  "Waste",
                  product?.sustainability ||
                    "Produced only when ordered to reduce waste",
                ],
              ]}
            />

            <InfoBox
              icon={Truck}
              title="Shipping"
              accent="bg-sky-400/12"
              items={[
                ["Shipping", product?.shipping || "Calculated at checkout"],
                [
                  "Delivery",
                  product?.delivery_time || "Depends on destination country",
                ],
                [
                  "Tracking",
                  product?.tracking || "Tracking provided after shipment",
                ],
                [
                  "Packaging",
                  product?.packaging || "Secure packaging for safe delivery",
                ],
              ]}
            />

            <InfoBox
              icon={BadgeCheck}
              title="Selected variant"
              accent="bg-violet-400/12"
              items={[
                [
                  "Color",
                  selectedVariant?.color || selectedColor || "Choose color",
                ],
                ["Size", selectedVariant?.size || "Choose size"],
                [
                  "SKU",
                  selectedVariant?.sku || product?.sku || "Not available",
                ],
                [
                  "Stock",
                  selectedVariant?.stock != null
                    ? `${selectedVariant.stock} available`
                    : totalStock > 0
                    ? `${totalStock} total`
                    : "Made on demand",
                ],
              ]}
            />
          </div>
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
    <div className="rounded-[24px] border border-white/[0.08] bg-[#090811]/70 p-4 transition-colors duration-200 hover:border-fuchsia-300/18">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-13 w-13 items-center justify-center rounded-[18px] border border-white/[0.08] bg-[#090811]/70 p-3">
          <Icon className={tone} size={26} strokeWidth={2.35} aria-hidden />
        </div>
      </div>

      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <p className="mt-1 line-clamp-2 text-[15px] font-black leading-snug text-white">
        {value}
      </p>
    </div>
  );
}

function InfoBox({
  icon: Icon,
  title,
  accent,
  items,
}: {
  icon: any;
  title: string;
  accent: string;
  items: InfoItem[];
}) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#090811]/70 p-4 transition-colors duration-200 hover:border-fuchsia-300/18">
      <div className={`pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-bl-full ${accent}`} />

      <div className="relative mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-white/[0.08] bg-[#090811]/70">
          <Icon size={25} strokeWidth={2.35} className="text-white" aria-hidden />
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-base font-black tracking-[-0.03em] text-white">
            {title}
          </h3>
          <p className="mt-0.5 text-xs font-semibold text-white/35">
            Product information
          </p>
        </div>
      </div>

      <div className="relative grid gap-2">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="rounded-[18px] border border-white/[0.07] bg-[#090811]/70 p-3"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30">
              {label}
            </p>

            <p className="mt-1 text-sm font-extrabold leading-snug text-white/78">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
