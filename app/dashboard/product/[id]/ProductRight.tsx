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
  ShoppingCart,
  Palette,
} from "lucide-react";

export function ProductRight({ product, selectedVariant }: any) {
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<null | {
    type: "success" | "error";
    message: string;
  }>(null);

  const stock = selectedVariant?.stock ?? null;
  const isOutOfStock = typeof stock === "number" && stock <= 0;

  const price = Number(
    selectedVariant?.price ?? product?.discount_price ?? product?.price ?? 0
  );

  const originalPrice =
    product?.discount_price && product?.price ? Number(product.price) : null;

  const verifiedReviews = useMemo(() => {
    const reviews = Array.isArray(product?.reviews) ? product.reviews : [];

    return reviews
      .filter((review: any) => review?.verified === true)
      .slice(0, 3);
  }, [product?.reviews]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

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
      showToast("success", "Product added to cart!");

      setTimeout(() => {
        router.refresh();
      }, 700);
    } catch (error) {
      console.error("Error adding to cart:", error);
      showToast("error", "Error adding to cart.");
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
    <>
      {toast && (
        <div className="fixed left-4 right-4 top-24 z-[9999] sm:left-auto sm:right-6 sm:top-28 sm:w-[360px]">
          <div
            className={`rounded-3xl border px-5 py-4 shadow-2xl backdrop-blur-xl ${
              toast.type === "success"
                ? "border-emerald-400/40 bg-[#0f1720]/95 text-emerald-100 shadow-emerald-500/20"
                : "border-red-400/40 bg-[#0f1720]/95 text-red-100 shadow-red-500/20"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-black shadow-lg ${
                  toast.type === "success"
                    ? "bg-gradient-to-br from-emerald-400 to-emerald-500 text-black"
                    : "bg-gradient-to-br from-red-400 to-red-500 text-black"
                }`}
              >
                {toast.type === "success" ? "✓" : "!"}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black tracking-wide text-white">
                    {toast.type === "success"
                      ? "Added to cart"
                      : "Something went wrong"}
                  </p>

                  {toast.type === "success" && (
                    <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-300">
                      success
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs leading-relaxed text-white/60">
                  {toast.message}
                </p>

                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full animate-[toastBar_3s_linear_forwards] rounded-full ${
                      toast.type === "success" ? "bg-emerald-400" : "bg-red-400"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes toastBar {
          from {
            width: 100%;
          }

          to {
            width: 0%;
          }
        }
      `}</style>

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
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-[28px] border border-white/20 bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-400 px-7 py-5 text-base font-black uppercase tracking-[0.14em] text-white shadow-[0_0_45px_rgba(217,70,239,0.45)] transition-all duration-300 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 md:hover:-translate-y-1 md:hover:scale-[1.02] md:hover:shadow-[0_0_70px_rgba(34,211,238,0.55)]"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-black/25">
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <ShoppingCart size={20} />
              )}
            </span>

            <span className="relative">
              {loading ? "Adding..." : "Add to cart"}
            </span>

            {!loading && <Zap className="relative text-yellow-200" size={20} />}
          </button>

          <button
            type="button"
            disabled={!selectedVariant || loading}
            onClick={handleStartDesigning}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-[28px] border border-purple-400/40 bg-purple-500/15 px-7 py-5 text-base font-black uppercase tracking-[0.12em] text-white shadow-[0_0_30px_rgba(168,85,247,0.25)] transition-all duration-300 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 md:hover:-translate-y-1 md:hover:bg-purple-500/25 md:hover:shadow-[0_0_55px_rgba(168,85,247,0.45)]"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-fuchsia-500/25 to-cyan-400/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-purple-400/25">
              <Palette size={20} />
            </span>

            <span className="relative">Start Designing</span>
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
              <p className="text-sm font-black text-white">Verified reviews</p>

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
    </>
  );
}
