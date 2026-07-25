"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  Zap,
  ShoppingCart,
  Palette,
  BadgeCheck,
  ShieldCheck,
  Globe2,
} from "lucide-react";

export function ProductRight({
  product,
  selectedVariant,
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
            className={`rounded-2xl border bg-[#17121f] px-5 py-4 shadow-xl ${
              toast.type === "success"
                ? "border-emerald-400/40 text-emerald-100"
                : "border-red-400/40 text-red-100"
            }`}
          >
            <p className="text-sm font-black text-white">
              {toast.type === "success" ? "Added to cart" : "Something went wrong"}
            </p>
            <p className="mt-1 text-xs text-white/60">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col gap-5">
        <div className="space-y-3">
          <h1 className="text-3xl font-black uppercase leading-[0.96] tracking-[-0.045em] text-white sm:text-4xl xl:text-[46px]">
            {product?.title ?? "Untitled product"}
          </h1>

          <p className="max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
            {product?.description ||
              "Premium customizable products made for creators, online brands and RYFIO stores."}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#191421] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                €{price.toFixed(2)}
              </div>

              {originalPrice && (
                <div className="mt-1 text-sm text-white/35 line-through">
                  €{originalPrice.toFixed(2)}
                </div>
              )}

              <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-fuchsia-100">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300" />
                <span className="truncate">{selectedVariantLabel}</span>
              </div>
            </div>

            <span className="shrink-0 rounded-full border border-cyan-300/20 bg-cyan-400/[0.04] px-3 py-1.5 text-[10px] font-bold text-cyan-100">
              No inventory needed
            </span>
          </div>

          <div className="mt-3 text-xs">
            {typeof stock === "number" ? (
              stock > 0 ? (
                <span className="font-bold text-emerald-300">● In stock ({stock})</span>
              ) : (
                <span className="font-bold text-red-300">● Out of stock</span>
              )
            ) : (
              <span className="text-white/45">Variant optional</span>
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-white/75">Variant</p>
          <div className="flex min-h-14 items-center justify-between rounded-2xl border border-white/10 bg-[#191421] px-4 text-sm text-white">
            <span className="truncate">{selectedVariantLabel}</span>
            <span className="ml-3 text-white/55">⌄</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 py-1">
          <span className="text-sm font-medium text-white/75">Quantity</span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={decreaseQuantity}
              disabled={quantity <= 1 || loading}
              className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-[#1b1624] text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Decrease quantity"
            >
              <Minus size={17} />
            </button>

            <span className="min-w-8 text-center text-sm font-black text-white">{quantity}</span>

            <button
              type="button"
              onClick={increaseQuantity}
              disabled={loading || isOutOfStock || (typeof stock === "number" && quantity >= stock)}
              className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-[#1b1624] text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Increase quantity"
            >
              <Plus size={17} />
            </button>
          </div>
        </div>

        <button
          type="button"
          disabled={!selectedVariant || isOutOfStock || loading}
          onClick={handleAddToCart}
          className="flex w-full items-center justify-center gap-4 rounded-2xl border border-fuchsia-300/30 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 px-7 py-5 text-base font-black uppercase tracking-[0.12em] text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 md:hover:brightness-110"
        >
          {loading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <ShoppingCart size={22} />
          )}
          <span>{loading ? "Adding..." : "Add to cart"}</span>
          {!loading && <Zap size={20} className="text-yellow-200" />}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={handleStartDesigning}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/12 bg-[#17121f] px-7 py-5 text-base font-black uppercase tracking-[0.1em] text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 md:hover:border-fuchsia-300/35"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-fuchsia-500/20 text-fuchsia-200">
            <Palette size={20} />
          </span>
          Start designing
        </button>

        <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-4 sm:grid-cols-4">
          <Feature icon={BadgeCheck} label="Quality tested" tone="text-cyan-300" />
          <Feature icon={Zap} label="Fast production" tone="text-fuchsia-300" />
          <Feature icon={ShieldCheck} label="Secure checkout" tone="text-sky-300" />
          <Feature icon={Globe2} label="Worldwide shipping" tone="text-yellow-300" />
        </div>
      </div>
    </>
  );
}

function Feature({ icon: Icon, label, tone }: any) {
  return (
    <div className="flex min-h-24 flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-[#191421] px-2 py-3 text-center">
      <span className={`grid h-10 w-10 place-items-center rounded-full border border-white/10 ${tone}`}>
        <Icon size={20} strokeWidth={1.8} />
      </span>
      <span className="mt-2 text-[10px] leading-tight text-white/75">{label}</span>
    </div>
  );
}
