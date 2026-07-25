"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Heart } from "lucide-react";

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
      className="group block min-w-0 focus-visible:outline-none"
    >
      <article className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#11111d] transition-[transform,border-color,background-color] duration-300 ease-out hover:-translate-y-1 hover:border-white/[0.16] hover:bg-[#141421] active:translate-y-0">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#f4f3f1]">
          <Image
            src={product.image}
            alt={product.title || "Product image"}
            fill
            unoptimized
            className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.035]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />

          <div className="absolute left-3 top-3 flex items-center gap-2">
            {hasDiscount && (
              <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-black shadow-sm">
                Sale
              </span>
            )}

            {product.is_new && (
              <span className="rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                New
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
            className={`absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border transition-[transform,background-color,border-color,color] duration-200 active:scale-90 ${
              isLiked
                ? "border-rose-300/40 bg-rose-500 text-white"
                : "border-white/20 bg-black/50 text-white hover:bg-white hover:text-black"
            }`}
          >
            <Heart
              size={17}
              strokeWidth={2.2}
              className={isLiked ? "fill-current" : ""}
            />
          </button>
        </div>

        <div className="p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/45">
              {product.category || "Product"}
            </p>

            <ArrowUpRight
              size={16}
              className="shrink-0 text-white/35 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
            />
          </div>

          <h3 className="line-clamp-2 min-h-[42px] text-[15px] font-bold leading-[1.35] tracking-[-0.02em] text-white sm:text-base">
            {product.title?.slice(0, 80) || "Untitled product"}
          </h3>

          <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/[0.07] pt-4">
            <div className="min-w-0">
              <p className="text-lg font-black tracking-[-0.04em] text-white">
                {symbols[currency]} {convertPrice(currentPrice, currency)}
              </p>

              {hasDiscount && (
                <p className="mt-0.5 text-[11px] font-semibold text-white/35 line-through">
                  {symbols[currency]} {convertPrice(regularPrice, currency)}
                </p>
              )}
            </div>

            <span className="shrink-0 rounded-full border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/70 transition-colors duration-200 group-hover:border-white/20 group-hover:bg-white group-hover:text-black">
              View
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
