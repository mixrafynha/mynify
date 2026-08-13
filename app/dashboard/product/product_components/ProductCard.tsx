"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";

import type { Currency, Product } from "./types";

type ProductCardProps = {
  product: Product;
  currency: Currency;
  likes: Record<string, boolean>;
  toggleLike?: (id: string) => void;
};

const PLACEHOLDER_IMAGE = "/placeholder.png";

function resolveProductImage(product: Product): string | undefined {
  if (typeof product.image === "string" && product.image.trim()) {
    return product.image.trim();
  }

  if (Array.isArray(product.images)) {
    return product.images
      .find((image) => typeof image === "string" && image.trim())
      ?.trim();
  }

  return undefined;
}

export default function ProductCard({
  product,
  currency,
  likes,
  toggleLike,
}: ProductCardProps) {
  if (!product?.id) return null;

  const productImage = resolveProductImage(product);
  const [imageSrc, setImageSrc] = useState(
    productImage || PLACEHOLDER_IMAGE
  );

  useEffect(() => {
    setImageSrc(productImage || PLACEHOLDER_IMAGE);
  }, [productImage]);

  const isLiked = Boolean(likes?.[product.id]);

  const swatches = useMemo(() => {
    const colors: Array<{ name?: string | null; hex: string }> = [];
    const seen = new Set<string>();

    if (Array.isArray(product.variants)) {
      for (const variant of product.variants as Array<{
        color?: string | null;
        color_hex?: string | null;
      }>) {
        const hex = String(variant?.color_hex ?? "").trim();
        const name = String(variant?.color ?? "").trim();

        if (!hex) continue;

        const key = `${name.toLowerCase()}|${hex.toLowerCase()}`;

        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
        colors.push({ name: name || null, hex });

        if (colors.length >= 6) break;
      }
    }

    if (
      !colors.length &&
      typeof product.color === "string" &&
      product.color.trim()
    ) {
      colors.push({
        name: product.color.trim(),
        hex: "#d1d5db",
      });
    }

    return colors;
  }, [product.color, product.variants]);

  const audienceLabel =
    product.audience === "unisex"
      ? "Unisex"
      : product.audience
        ? String(product.audience).toUpperCase()
        : "Unisex";

  const discountLabel =
    Number(product.discount_price ?? 0) > 0 ? "Discount" : audienceLabel;

  return (
    <Link
      href={`/dashboard/product/${encodeURIComponent(product.id)}`}
      className="group min-w-0"
    >
      <article className="relative overflow-hidden border border-white/[0.08] bg-gradient-to-b from-[#1b1830] via-[#131325] to-[#0f1020] p-2 transition duration-300 active:scale-[0.99] hover:-translate-y-1 hover:border-fuchsia-400/25 hover:shadow-[0_25px_80px_rgba(217,70,239,0.16)]">
        <div className="pointer-events-none absolute inset-0 opacity-100">
          <div className="absolute -left-16 top-0 h-40 w-40 bg-fuchsia-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-40 w-40 bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative aspect-[4/5] overflow-hidden bg-[#18182d]">
          <Image
            src={imageSrc}
            alt={product.title || "Product image"}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover object-center transition duration-700 group-hover:scale-[1.06]"
            onError={() => {
              if (imageSrc !== PLACEHOLDER_IMAGE) {
                setImageSrc(PLACEHOLDER_IMAGE);
              }
            }}
          />

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          <div className="absolute left-2.5 top-2.5 border border-white/10 bg-black/50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/90 backdrop-blur-xl">
            {discountLabel}
          </div>

          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 border border-white/10 bg-black/40 px-2 py-1 backdrop-blur-xl">
            {swatches.length > 0 &&
              swatches.map((swatch) => (
                <span
                  key={`${swatch.hex}-${swatch.name || "color"}`}
                  className="h-2 w-2 rounded-full border border-white/30 shadow-[0_0_0_1px_rgba(0,0,0,0.18)]"
                  style={{ backgroundColor: swatch.hex }}
                  aria-label={swatch.name || "Color"}
                  title={swatch.name || swatch.hex}
                />
              ))}
          </div>

          {product.is_new && (
            <div className="absolute right-14 top-2.5 border border-white/10 bg-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/90 backdrop-blur-xl">
              New
            </div>
          )}

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              toggleLike?.(product.id);
            }}
            className={`absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full border backdrop-blur-xl transition active:scale-95 ${
              isLiked
                ? "border-rose-300/40 bg-rose-400/20 text-rose-100 shadow-[0_0_24px_rgba(251,113,133,0.35)]"
                : "border-white/10 bg-black/35 text-white hover:bg-white/10 hover:text-rose-100"
            }`}
          >
            <Heart
              size={17}
              className={
                isLiked ? "fill-rose-300 text-rose-200" : "text-white/85"
              }
            />
          </button>
        </div>

        <div className="relative px-1 pb-1 pt-3">
          <p className="mb-1 truncate text-[10px] font-black uppercase tracking-[0.14em] text-[#b8b9d9]">
            {product.category || "Product"}
          </p>

          <h3 className="line-clamp-2 min-h-[34px] text-[13px] font-extrabold leading-tight tracking-[-0.03em] text-[#f3f4ff] sm:text-sm">
            {product.title?.slice(0, 80) || "Untitled product"}
          </h3>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="min-h-[14px]">
              {discountLabel && (
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                  {discountLabel}
                </p>
              )}
            </div>
            <span className="border border-white/10 bg-white/[0.08] px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#d9dbff] backdrop-blur-xl transition group-hover:bg-white/[0.14]">
              View
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
