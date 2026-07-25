"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";

import { convertPrice, symbols } from "@/lib/currency";
import type { Currency, Product } from "./types";

type ProductCardProps = {
  product: Product;
  currency: Currency;
  likes: Record<string, boolean>;
  toggleLike?: (id: string) => void;
};

export default function ProductCard({
  product,
  currency,
  likes,
  toggleLike,
}: ProductCardProps) {
  if (!product?.id || !product?.image) return null;

  const isLiked = Boolean(likes?.[product.id]);

  const regularPrice = Number(product.price ?? 0);
  const discountPrice =
    product.discount_price === null || product.discount_price === undefined
      ? null
      : Number(product.discount_price);

  const hasDiscount =
    discountPrice !== null &&
    Number.isFinite(discountPrice) &&
    discountPrice > 0 &&
    discountPrice < regularPrice;

  const currentPrice = hasDiscount ? discountPrice : regularPrice;

  return (
    <Link
      href={`/dashboard/product/${encodeURIComponent(product.id)}`}
      className="group block min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0d]"
    >
      <article
        className="
          relative overflow-hidden rounded-[18px]
          border border-white/[0.08]
          bg-[#101012]
          transition-transform duration-200 ease-out
          hover:-translate-y-1
          active:translate-y-0
          [content-visibility:auto]
          [contain:layout_paint]
        "
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-[#f3f3f1]">
          <Image
            src={product.image}
            alt={product.title || "Product image"}
            fill
            unoptimized
            loading="lazy"
            className="object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />

          <div className="absolute left-3 top-3 flex items-center gap-2">
            {product.is_new && (
              <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-black">
                New
              </span>
            )}

            {hasDiscount && (
              <span className="rounded-full bg-black px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                Sale
              </span>
            )}
          </div>

          <button
            type="button"
            aria-label={
              isLiked
                ? `Remove ${product.title || "product"} from favourites`
                : `Add ${product.title || "product"} to favourites`
            }
            aria-pressed={isLiked}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              toggleLike?.(product.id);
            }}
            className={`
              absolute right-3 top-3
              grid h-9 w-9 place-items-center rounded-full
              border transition duration-200 active:scale-90
              ${
                isLiked
                  ? "border-black bg-black text-white"
                  : "border-black/10 bg-white text-black hover:bg-black hover:text-white"
              }
            `}
          >
            <Heart
              size={16}
              strokeWidth={2}
              className={isLiked ? "fill-current" : ""}
            />
          </button>
        </div>

        <div className="p-4">
          <p className="mb-1.5 truncate text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
            {product.category || "Product"}
          </p>

          <h3 className="line-clamp-2 min-h-[40px] text-[14px] font-semibold leading-[1.35] tracking-[-0.02em] text-white sm:text-[15px]">
            {product.title?.slice(0, 80) || "Untitled product"}
          </h3>

          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[17px] font-black tracking-[-0.04em] text-white">
                {symbols[currency]} {convertPrice(currentPrice, currency)}
              </p>

              {hasDiscount && (
                <p className="mt-0.5 text-[10px] font-medium text-white/35 line-through">
                  {symbols[currency]} {convertPrice(regularPrice, currency)}
                </p>
              )}
            </div>

            <ArrowRight
              size={18}
              strokeWidth={1.8}
              className="shrink-0 text-white/45 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-white"
            />
          </div>
        </div>
      </article>
    </Link>
  );
}
