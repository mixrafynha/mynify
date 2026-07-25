"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, LoaderCircle } from "lucide-react";

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
  const router = useRouter();
  const [isOpening, setIsOpening] = useState(false);

  if (!product?.id || !product?.image) return null;

  const href = `/dashboard/product/${encodeURIComponent(product.id)}`;
  const prefetchProduct = () => router.prefetch(href);
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

  const price = hasDiscount ? discountPrice : regularPrice;

  return (
    <Link
      key={product.id}
      href={href}
      prefetch
      onPointerEnter={prefetchProduct}
      onPointerDown={prefetchProduct}
      onTouchStart={prefetchProduct}
      onClick={() => setIsOpening(true)}
      aria-busy={isOpening}
      className={`group min-w-0 ${isOpening ? "pointer-events-none" : ""}`}
    >
      <article className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-[#1b1830] via-[#131325] to-[#0f1020] p-2 transition-colors duration-200 active:scale-[0.99] md:transition md:duration-300 md:hover:-translate-y-1 md:hover:border-fuchsia-400/25 md:hover:shadow-[0_25px_80px_rgba(217,70,239,0.16)]">
        {isOpening && (
          <div className="absolute inset-0 z-30 grid place-items-center bg-[#0f1020]/72 backdrop-blur-sm">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-4 py-2 text-xs font-black text-white shadow-xl">
              <LoaderCircle size={16} className="animate-spin" />
              Opening product…
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 opacity-100">
          <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-[#18182d]">
          <Image
            src={product.image}
            alt={product.title || "Product image"}
            fill
            className="object-cover md:transition md:duration-700 md:group-hover:scale-[1.06]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {hasDiscount && (
            <div className="absolute left-2.5 top-2.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white shadow-lg">
              Sale
            </div>
          )}

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              toggleLike?.(product.id);
            }}
            className={`absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full border backdrop-blur-sm transition active:scale-95 md:backdrop-blur-xl ${
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

          <div className="mt-3 flex items-end justify-between gap-2">
            <div>
              <p className="text-sm font-extrabold text-white sm:text-base">
                {symbols[currency]} {convertPrice(price, currency)}
              </p>

              {hasDiscount && (
                <p className="text-[10px] font-bold text-[#8d90b3] line-through">
                  {symbols[currency]} {convertPrice(regularPrice, currency)}
                </p>
              )}
            </div>

            <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#d9dbff] transition md:backdrop-blur-xl md:group-hover:bg-white/[0.14]">
              View
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
