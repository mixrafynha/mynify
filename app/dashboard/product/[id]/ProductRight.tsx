"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  Sparkles,
  Star,
  Zap,
  ShoppingCart,
  Palette,
} from "lucide-react";

export function ProductRight({
  product,
  selectedVariant,
  hasExplicitSizeSelection = false,
}: any) {
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

  const selectedVariantLabel = selectedVariant
    ? [selectedVariant.color, selectedVariant.size].filter(Boolean).join(" / ") ||
      selectedVariant.sku ||
      "Selected variant"
    : "Choose color and size";

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

  const handleStartDesigning = async () => {
    if (!product?.id || loading) return;

    if (!selectedVariant || !hasExplicitSizeSelection) {
      showToast("error", "Choose a size before opening the editor.");
      return;
    }

    setLoading(true);

    try {
      const mockup = getMockup();

      const selection = {
        productId: product.id,
        product_id: product.id,
        variantId: selectedVariant.id,
        variant_id: selectedVariant.id,
        selectedVariantId: selectedVariant.id,
        selected_variant_id: selectedVariant.id,
        size: selectedVariant.size ?? null,
        selectedSize: selectedVariant.size ?? null,
        selected_size: selectedVariant.size ?? null,
        color: selectedVariant.color ?? null,
        initialColor: selectedVariant.color ?? null,
        initial_color: selectedVariant.color ?? null,
        colorEditable: true,
        color_editable: true,
        sku: selectedVariant.sku ?? null,
        productColorId: selectedVariant.product_color_id ?? null,
        product_color_id: selectedVariant.product_color_id ?? null,
        title: product?.title ?? null,
        image: product?.image ?? product?.images?.[0] ?? null,
        source: "product-page",
        savedAt: new Date().toISOString(),
      };

      try {
        const payload = JSON.stringify(selection);
        window.localStorage.setItem("ryfio:selected-design-variant", payload);
        window.localStorage.setItem("ryfio:design-selection", payload);
        window.localStorage.setItem("ryfio:editor-initial-variant", payload);
        window.sessionStorage.setItem("ryfio:selected-design-variant", payload);
        window.sessionStorage.setItem("ryfio:design-selection", payload);
        window.sessionStorage.setItem("ryfio:editor-initial-variant", payload);
      } catch {
        // Storage can fail in private mode; navigation should still work.
      }

            const params = new URLSearchParams({
        productId: product.id,
        product_id: product.id,
        variantId: selectedVariant.id,
        variant_id: selectedVariant.id,
        selectedVariantId: selectedVariant.id,
        colorEditable: "true",
      });

      if (selectedVariant.size) {
        params.set("size", selectedVariant.size);
        params.set("selectedSize", selectedVariant.size);
      }
      if (selectedVariant.color) {
        params.set("color", selectedVariant.color);
        params.set("initialColor", selectedVariant.color);
      }
      if (selectedVariant.sku) params.set("sku", selectedVariant.sku);
      if (selectedVariant.product_color_id) {
        params.set("productColorId", selectedVariant.product_color_id);
      }

      router.push(`/dashboard/design/${mockup}?${params.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && (
        <div className="fixed left-4 right-4 top-24 z-[9999] sm:left-auto sm:right-6 sm:top-28 sm:w-[360px]">
          <div
            className={`rounded-3xl border px-5 py-4 shadow-2xl backdrop-blur-xl ${
              toast.type === "success"
                ? "border-emerald-400/40 bg-white/[0.025] text-emerald-100 shadow-emerald-500/20"
                : "border-red-400/40 bg-white/[0.025] text-red-100 shadow-red-500/20"
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
                    <span className="rounded-full bg-white/[0.025] border border-emerald-300/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-300">
                      success
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs leading-relaxed text-white/60">
                  {toast.message}
                </p>

                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.08]">
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
          <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/20 bg-white/[0.025] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-100">
            <Sparkles size={13} aria-hidden="true" />
            Made on demand
          </div>

          <h1 className="text-3xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
            {product?.title ?? "Untitled product"}
          </h1>

          <p className="text-sm leading-relaxed text-white/58 sm:text-base">
            Premium customizable products made for creators, online brands and RYFIO stores.
          </p>
        </div>

        <div className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <div className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                €{price.toFixed(2)}
              </div>

              {originalPrice && (
                <div className="text-sm text-white/38 line-through">
                  €{originalPrice.toFixed(2)}
                </div>
              )}

              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-fuchsia-300/30 bg-fuchsia-400/[0.10] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-fuchsia-50 shadow-[0_0_24px_rgba(168,85,247,0.16)]">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,0.9)]" />
                <span className="truncate">{selectedVariantLabel}</span>
              </div>
            </div>

            <div className="shrink-0 rounded-full border border-cyan-300/20 bg-white/[0.025] px-3 py-1 text-[11px] font-bold text-cyan-100">
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
              <span className="text-white/50">Select variant</span>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-white/75">Quantity</span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={quantity <= 1 || loading}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.025] text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 md:hover:border-fuchsia-300/20"
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
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.025] text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 md:hover:border-fuchsia-300/20"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {!hasExplicitSizeSelection && (
          <div className="rounded-3xl border border-fuchsia-300/20 bg-fuchsia-500/[0.06] px-4 py-3 text-sm font-semibold text-fuchsia-100 shadow-[0_0_22px_rgba(168,85,247,0.14)]">
            Choose a size before opening the editor. Your selected variant will be saved for the design step.
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            disabled={!selectedVariant || isOutOfStock || loading}
            onClick={handleAddToCart}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-[28px] border border-fuchsia-300/30 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 px-7 py-5 text-base font-black uppercase tracking-[0.14em] text-white shadow-[0_0_44px_rgba(168,85,247,0.34)] transition-all duration-300 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 md:hover:-translate-y-1 md:hover:scale-[1.02] md:hover:shadow-[0_0_64px_rgba(217,70,239,0.38)]"
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
            disabled={loading}
            onClick={handleStartDesigning}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-[28px] border border-fuchsia-300/25 bg-white/[0.025] px-7 py-5 text-base font-black uppercase tracking-[0.12em] text-white shadow-[0_0_28px_rgba(168,85,247,0.20)] transition-all duration-300 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 md:hover:-translate-y-1 md:hover:border-fuchsia-300/35 md:hover:shadow-[0_0_50px_rgba(217,70,239,0.30)]"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-fuchsia-500/20 to-cyan-400/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-fuchsia-300/20">
              <Palette size={20} />
            </span>

            <span className="relative">Start Designing</span>
          </button>
        </div>

        {verifiedReviews.length > 0 && (
          <div className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-4">
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
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-xs font-black text-white">
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

                  <p className="text-xs leading-relaxed text-white/58">
                    {review.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-[11px] font-bold text-white/65">
          <span className="rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1">
            ✔ Secure checkout
          </span>
          <span className="rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1">
            ✔ Quality tested
          </span>
          <span className="rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1">
            ✔ Fast production
          </span>
          <span className="rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1">
            ✔ Worldwide shipping
          </span>
        </div>
      </div>
    </>
  );
}
