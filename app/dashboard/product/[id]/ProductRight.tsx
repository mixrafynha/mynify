"use client";

import StripeButton from "@/app/components/StripeButton";

export function ProductRight({ product, selectedVariant }: any) {
  const stock = selectedVariant?.stock ?? null;

  return (
    <div className="flex flex-col gap-7">

      {/* TITLE */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          {product?.title ?? "Untitled product"}
        </h1>

        <p className="text-sm text-gray-500">
          Premium customizable apparel
        </p>
      </div>

      {/* PRICE BLOCK */}
      <div className="flex items-end justify-between">

        <div className="space-y-1">
          <div className="text-3xl font-bold tracking-tight">
            $
            {Number(
              selectedVariant?.price ??
              product?.price ??
              0
            ).toFixed(2)}
          </div>

          {product?.discount_price && (
            <div className="text-sm text-gray-400 line-through">
              ${Number(product.discount_price).toFixed(2)}
            </div>
          )}
        </div>

        <div className="text-[11px] px-3 py-1 rounded-full bg-black text-white">
          Made on demand
        </div>

      </div>

      {/* STOCK STATUS (MODERNO) */}
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
          <span className="text-gray-400">
            Select variant
          </span>
        )}
      </div>

      {/* META INFO (SEM BOX) */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
        {selectedVariant?.sku && (
          <span>SKU {selectedVariant.sku}</span>
        )}
        {selectedVariant?.size && (
          <span>Size {selectedVariant.size}</span>
        )}
        {selectedVariant?.color && (
          <span>Color {selectedVariant.color}</span>
        )}
      </div>

      {/* PRIMARY CTA */}
      <button
        disabled={!selectedVariant}
        onClick={() => {
          if (!selectedVariant) return;
          window.location.href = `/dashboard/design/hoodie`;
        }}
        className="
          w-full py-4 rounded-2xl
          bg-black text-white
          font-medium
          hover:opacity-90 active:scale-[0.99]
          transition
        "
      >
        🎨 Start Designing
      </button>

      {/* STRIPE */}
      <div className="scale-[1.01]">
        <StripeButton product={{ ...product, variant: selectedVariant }} />
      </div>

      {/* DELIVERY INFO (SEM CAIXA) */}
      <div className="text-sm text-gray-500 space-y-1">
        <p className="font-medium text-gray-700">
          Production & Delivery
        </p>

        <p>Production: 2–4 business days</p>
        <p>Shipping: 3–7 business days</p>
      </div>

      {/* BADGES (MODERN LOOK) */}
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