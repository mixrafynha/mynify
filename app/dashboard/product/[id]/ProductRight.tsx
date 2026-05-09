"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProductRight({ product, selectedVariant }: any) {
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const stock = selectedVariant?.stock ?? null;
  const isOutOfStock = typeof stock === "number" && stock <= 0;

  const price = Number(
    selectedVariant?.price ??
      product?.discount_price ??
      product?.price ??
      0
  );

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

      alert("Added to cart!");
      setQuantity(1);
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
    <div className="flex flex-col gap-7">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          {product?.title ?? "Untitled product"}
        </h1>

        <p className="text-sm text-gray-500">
          Premium customizable apparel
        </p>
      </div>

      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="text-3xl font-bold tracking-tight">
            ${price.toFixed(2)}
          </div>

          {product?.discount_price && (
            <div className="text-sm text-gray-400 line-through">
              ${Number(product.price).toFixed(2)}
            </div>
          )}
        </div>

        <div className="text-[11px] px-3 py-1 rounded-full bg-black text-white">
          Made on demand
        </div>
      </div>

      <div className="text-sm">
        {typeof stock === "number" ? (
          stock > 0 ? (
            <span className="text-green-600 font-medium">
              ● In stock ({stock})
            </span>
          ) : (
            <span className="text-red-500 font-medium">
              ● Out of stock
            </span>
          )
        ) : (
          <span className="text-gray-400">Select variant</span>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
        {selectedVariant?.sku && <span>SKU {selectedVariant.sku}</span>}
        {selectedVariant?.size && <span>Size {selectedVariant.size}</span>}
        {selectedVariant?.color && <span>Color {selectedVariant.color}</span>}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Quantity
        </span>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={decreaseQuantity}
            disabled={quantity <= 1 || loading}
            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-lg font-medium hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            -
          </button>

          <span className="min-w-8 text-center text-sm font-medium">
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
            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-lg font-medium hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        disabled={!selectedVariant || isOutOfStock || loading}
        onClick={handleAddToCart}
        className="w-full py-4 rounded-2xl bg-black text-white font-medium hover:opacity-90 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Adding..." : "Add to cart"}
      </button>

      <button
        type="button"
        disabled={!selectedVariant || loading}
        onClick={handleStartDesigning}
        className="w-full py-4 rounded-2xl border border-black text-black font-medium hover:bg-gray-100 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        🎨 Start Designing
      </button>

      <div className="text-sm text-gray-500 space-y-1">
        <p className="font-medium text-gray-700">Production & Delivery</p>
        <p>Production: 2–4 business days</p>
        <p>Shipping: 3–7 business days</p>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px] text-gray-600">
        <span className="px-3 py-1 rounded-full bg-gray-100">
          ✔ Secure checkout
        </span>
        <span className="px-3 py-1 rounded-full bg-gray-100">
          ✔ Quality tested
        </span>
        <span className="px-3 py-1 rounded-full bg-gray-100">
          ✔ Fast production
        </span>
        <span className="px-3 py-1 rounded-full bg-gray-100">
          ✔ Worldwide shipping
        </span>
      </div>
    </div>
  );
}
