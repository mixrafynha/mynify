"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Minus,
  Palette,
  Plus,
  ShoppingCart,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

export function ProductRight({
  product,
  selectedVariant,
}: any) {
  const router = useRouter();
  const title = String(product?.title ?? "Untitled product").trim();
  const [titleFirstWord, ...titleRemainingWords] = title.split(/\s+/);
  const titleRemaining = titleRemainingWords.join(" ");

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

    if (!selectedVariant) {
      showToast("error", "This product has no available variant.");
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
            className={`rounded-2xl border px-5 py-4 shadow-lg ${
              toast.type === "success"
                ? "border-emerald-400/40 bg-[#1b1424] text-emerald-100 shadow-emerald-500/20"
                : "border-red-400/40 bg-[#1b1424] text-red-100 shadow-red-500/20"
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
                    <span className="rounded-full border border-emerald-300/20 bg-[#1b1424] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-300">
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

      <style jsx global>{`\n        @keyframes toastBar {\n          from {\n            width: 100%;\n          }\n\n          to {\n            width: 0%;\n          }\n        }\n      `}</style>

      <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
        <div className="space-y-2 text-left">
          <h1
            className="max-w-[11ch] text-[1.79rem] uppercase leading-[0.98] tracking-[-0.03em] text-white sm:text-[2.21rem] lg:text-[2.76rem]"
            style={{ fontFamily: 'var(--font-logo)' }}
          >
            <span className="block">{titleFirstWord}</span>
            {titleRemaining ? (
              <span className="block whitespace-nowrap text-white/92">{titleRemaining}</span>
            ) : null}
          </h1>

          <p className="max-w-[30rem] text-[11px] font-semibold uppercase tracking-[0.08em] text-white/42 sm:text-[12px]">
            Premium customizable products made for creators, online brands and RYFIO stores.
          </p>
        </div>

        <div className="border border-white/[0.07] bg-[#1b1424] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <div className="text-[1.85rem] font-black tracking-tight text-white sm:text-[2.2rem]">
                €{price.toFixed(2)}
              </div>

              {originalPrice && (
                <div className="text-sm text-white/38 line-through">
                  €{originalPrice.toFixed(2)}
                </div>
              )}

              <div className="inline-flex max-w-full items-center gap-1.5 border border-fuchsia-300/24 bg-fuchsia-400/[0.08] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-fuchsia-50">
                <span className="text-sm leading-none text-fuchsia-300">+</span>
                <span className="truncate">{selectedVariantLabel}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 text-sm">
            {typeof stock === "number" ? (
              stock > 0 ? (
                <div
                  className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/52"
                  aria-label={`In stock (${stock})`}
                  title={`In stock (${stock})`}
                >
                  <span>Stock</span>
                  <span className="inline-flex h-3 w-3 rounded-full bg-[#22c55e]" />
                </div>
              ) : (
                <div
                  className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/52"
                  aria-label="Out of stock"
                  title="Out of stock"
                >
                  <span>Stock</span>
                  <span className="inline-flex h-3 w-3 rounded-full bg-[#ef4444]" />
                </div>
              )
            ) : (
              <span className="text-white/50">Select variant</span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/48">
              Quantity
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={quantity <= 1 || loading}
                className="flex h-9 w-9 items-center justify-center border border-white/[0.08] bg-[#1b1424] text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 md:hover:border-fuchsia-300/20"
              >
                <Minus size={14} />
              </button>

              <span className="min-w-7 text-center text-sm font-black text-white">
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
                className="flex h-9 w-9 items-center justify-center border border-white/[0.08] bg-[#1b1424] text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 md:hover:border-fuchsia-300/20"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 border border-white/[0.10] bg-white px-3 py-2 text-[#111111] shadow-[0_1px_0_rgba(255,255,255,0.5)_inset]">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#6b7280]">
            <span>Shipping from</span>
            <span className="grid h-4 w-4 place-items-center border border-[#cfd4dc] text-[9px] leading-none">i</span>
          </div>

          <div className="mt-0.5 text-[1.45rem] font-black leading-none tracking-[-0.04em] text-[#111111]">
            €7.65
          </div>

          <div className="mt-1 text-[10px] font-medium text-[#6b7280]">
            5-6 business days
          </div>

          <div className="mt-2">
            <div className="text-[10px] font-medium text-[#6b7280]">Delivery to</div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[10px] font-semibold text-[#111111]">
                <span className="text-base leading-none">🇦🇺</span>
                <span>Australia</span>
              </div>
              <span className="text-[10px] leading-none text-[#6b7280]">▾</span>
            </div>
          </div>

          <div className="mt-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#6b7280]">Available</div>
        </div>

        <div className="mt-3 flex gap-2.5">
          <button
            type="button"
            disabled={!selectedVariant || isOutOfStock || loading}
            onClick={handleAddToCart}
            className="group relative flex h-[56px] flex-1 items-center justify-center gap-2 overflow-hidden rounded-[12px] border border-fuchsia-300/22 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 px-5 text-[12px] font-black uppercase tracking-[0.12em] text-white transition-colors duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 md:hover:brightness-110"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-black/18 ring-1 ring-white/10">
              {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <ShoppingCart size={15} />}
            </span>
            <span className="relative">{loading ? "Adding..." : "Add to cart"}</span>
            {!loading && <Zap className="relative text-yellow-200" size={14} />}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleStartDesigning}
            className="group relative flex h-[56px] flex-1 items-center justify-center gap-2 overflow-hidden rounded-[12px] border border-[#22c55e]/28 bg-[linear-gradient(135deg,#03140a_0%,#0b3b1b_34%,#22c55e_100%)] px-5 text-[12px] font-black uppercase tracking-[0.1em] text-white transition-colors duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 md:hover:brightness-110"
          >
            <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.08)),radial-gradient(circle_at_82%_18%,rgba(187,247,208,0.18),transparent_26%)] opacity-90" />
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-black/20 ring-1 ring-white/10">
              <Palette size={15} />
            </span>
            <span className="relative">Start Designing</span>
          </button>
        </div>

        {verifiedReviews.length > 0 && (
          <div className="rounded-2xl border border-white/[0.07] bg-[#1b1424] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-black text-white">Verified reviews</p>
              <div className="flex items-center gap-1 text-yellow-300">
                {[1, 2, 3, 4, 5].map((item) => (
                  <Star key={item} size={13} fill="currentColor" />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
