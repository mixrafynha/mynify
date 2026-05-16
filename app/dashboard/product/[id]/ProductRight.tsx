"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Zap,
} from "lucide-react";

export function ProductRight({ product, selectedVariant }: any) {
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const stock = selectedVariant?.stock ?? null;
  const isOutOfStock = typeof stock === "number" && stock <= 0;

  const price = Number(
    selectedVariant?.price ?? product?.discount_price ?? product?.price ?? 0
  );

  const originalPrice =
    product?.discount_price && product?.price
      ? Number(product.price)
      : null;

  const verifiedReviews = useMemo(() => {
    const reviews = Array.isArray(product?.reviews) ? product.reviews : [];

    return reviews
      .filter((review: any) => review?.verified === true)
      .slice(0, 3);
  }, [product?.reviews]);

  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const increaseQuantity = () => {
    if (typeof stock === "number") {
      setQuantity((prev) => Math.min(stock, prev + 1));
      return;
    }

    setQuantity((prev) => prev + 1);
  };

  const getMockup = () => {
    const mockup = String(product?.mockup || "").toLowerCase().trim();

    if (mockup === "tshirt" || mockup === "t-shirt" || mockup === "shirt") {
      return "tshirt";
    }

    if (mockup === "hoodie" || mockup === "hooded" || mockup === "sweatshirt") {
      return "hoodie";
    }

    const value = `${product?.type || ""} ${product?.category || ""} ${
      product?.title || ""
    }`.toLowerCase();

    if (
      value.includes("tshirt") ||
      value.includes("t-shirt") ||
      value.includes("t shirt") ||
      value.includes("tee")
    ) {
      return "tshirt";
    }

    if (
      value.includes("hoodie") ||
      value.includes("hooded") ||
      value.includes("sweatshirt")
    ) {
      return "hoodie";
    }

    return "hoodie";
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || isOutOfStock || loading) return;

    setLoading(true);

    try {
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product?.id,
          variantId: selectedVariant?.id,
          color: selectedVariant?.color,
          size: selectedVariant?.size,
          sku: selectedVariant?.sku,
          title: product?.title,
          image: product?.image ?? product?.images?.[0] ?? null,
          price,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to add to cart");
      }

      setQuantity(1);
      router.refresh();
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Error adding to cart");
    } finally {
      setLoading(false);
    }
  };

  const handleStartDesigning = () => {
    if (!product?.id || !selectedVariant || loading) return;

    const mockup = getMockup();

    router.push(
      `/dashboard/design/${mockup}?productId=${encodeURIComponent(product.id)}`
    );
  };

  return (
    <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-purple-200">
          <Sparkles size={13} aria-hidden="true" />
          Made on demand
        </div>

        <h1 className="text-3xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
          {product?.title ?? "Untitled product"}
        </h1>

        <p className="text-sm leading-relaxed text-white/55 sm:text-base">
          Premium customizable apparel made for creators, gamers and online
          brands.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              €{price.toFixed(2)}
            </div>

            {originalPrice && (
              <div className="text-sm text-white/35 line-through">
                €{originalPrice.toFixed(2)}
              </div>
            )}
          </div>

          <div className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold text-cyan-200">
            No inventory needed
          </div>
        </div>

        <div className="mt-4 text-sm">
          {typeof stock === "number" ? (
            stock > 0 ? (
              <span className="font-bold text-emerald-300">
                ● In stock ({stock})
              </span>
            ) : (
              <span className="font-bold text-red-300">● Out of stock</span>
            )
          ) : (
            <span className="text-white/45">Select variant</span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/55">
          {selectedVariant?.sku && (
            <span className="rounded-full bg-white/5 px-3 py-1">
              SKU {selectedVariant.sku}
            </span>
          )}
          {selectedVariant?.size && (
            <span className="rounded-full bg-white/5 px-3 py-1">
              Size {selectedVariant.size}
            </span>
          )}
          {selectedVariant?.color && (
            <span className="rounded-full bg-white/5 px-3 py-1">
              Color {selectedVariant.color}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-bold text-white/75">Quantity</span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={decreaseQuantity}
              disabled={quantity <= 1 || loading}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 md:hover:bg-white/10"
            >
              <Minus size={16} />
            </button>

            <span className="min-w-8 text-center text-sm font-black text-white">
              {quantity}
            </span>

            <button
              type="button"
              onClick={increaseQuantity}
              disabled={
                loading ||
                isOutOfStock ||
                (typeof stock === "number" && quantity >= stock)
              }
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 md:hover:bg-white/10"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          disabled={!selectedVariant || isOutOfStock || loading}
          onClick={handleAddToCart}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 px-6 py-4 text-base font-black text-white shadow-lg transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 md:hover:scale-[1.01] md:shadow-[0_0_35px_rgba(168,85,247,0.45)]"
        >
          <Zap size={18} />
          {loading ? "Adding..." : "Add to cart"}
        </button>

        <button
          type="button"
          disabled={!selectedVariant || loading}
          onClick={handleStartDesigning}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-base font-bold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 md:hover:border-purple-500/40 md:hover:bg-white/10"
        >
          🎨 Start Designing
        </button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
        <p className="mb-3 text-sm font-black text-white">
          Production & Delivery
        </p>

        <div className="space-y-2 text-sm text-white/55">
          <p className="flex items-center gap-2">
            <CheckCircle size={15} className="text-purple-300" />
            Production: 2–4 business days
          </p>
          <p className="flex items-center gap-2">
            <Truck size={15} className="text-cyan-300" />
            Shipping: 3–7 business days
          </p>
          <p className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-emerald-300" />
            Secure checkout
          </p>
        </div>
      </div>

      {verifiedReviews.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-black text-white">
              Verified reviews
            </p>

            <div className="flex items-center gap-1 text-yellow-300">
              {[1, 2, 3, 4, 5].map((item) => (
                <Star key={item} size={13} fill="currentColor" />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {verifiedReviews.map((review: any) => (
              <div
                key={review.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-3"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 text-xs font-black text-white">
                    {review.name?.[0]?.toUpperCase() ?? "U"}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">
                      {review.name ?? "Verified customer"}
                    </p>
                    <p className="text-[11px] font-bold text-emerald-300">
                      verified account
                    </p>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-white/55">
                  {review.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-[11px] font-bold text-white/65">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
          ✔ Secure checkout
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
          ✔ Quality tested
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
          ✔ Fast production
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
          ✔ Worldwide shipping
        </span>
      </div>
    </div>
  );
}