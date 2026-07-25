"use client";

import { useEffect, useState } from "react";
import { CheckCircle, ShieldCheck, Truck } from "lucide-react";

import ProductGallery from "@/app/components/ProductGallery";
import ColorSelector from "@/app/components/ColorSelector";
import SizeSelector from "@/app/components/SizeSelector";

type Props = {
  images: string[];
  product: any;
  variants: any[];
  availableVariants: any[];
  colors: any[];
  selectedColor: string | null;
  selectedVariant: any;
  onColorChange: (color: string, variant?: any) => void;
  onSizeChange: (variant: any) => void;
};

type Review = {
  id: string;
  name: string;
  verified: boolean;
  message: string;
};

export function ProductLeft({
  images,
  product,
  variants,
  availableVariants,
  selectedColor,
  selectedVariant,
  onColorChange,
  onSizeChange,
}: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!product?.id) return;

    const controller = new AbortController();

    const loadReviews = async () => {
      try {
        const res = await fetch(
          `/api/product-reviews?productId=${product.id}`,
          {
            signal: controller.signal,
          }
        );

        if (!res.ok) return;

        const json = await res.json();

        setReviews(Array.isArray(json?.reviews) ? json.reviews : []);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("LOAD REVIEWS ERROR:", err);
        }
      }
    };

    const timeoutId = window.setTimeout(loadReviews, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [product?.id]);

  return (
    <div className="min-w-0 space-y-4 bg-transparent">
      <style jsx global>{`
        .ryfio-gallery-polish {
          isolation: isolate;
          width: 100%;
          background: #ffffff !important;
          contain: layout paint;
        }

        /* Let ProductGallery use the full left column instead of keeping
           the main product image inside a narrow internal wrapper. */
        .ryfio-gallery-polish > * {
          width: 100% !important;
          max-width: none !important;
        }

        .ryfio-gallery-polish img {
          object-fit: contain !important;
          object-position: center !important;
          image-rendering: auto;
          transform: translateZ(0);
        }

        .ryfio-gallery-polish [class*="max-w-"] {
          max-width: none !important;
        }

        .ryfio-gallery-polish [class*="backdrop-blur"],
        .ryfio-gallery-polish [class*="blur-"] {
          backdrop-filter: none !important;
          filter: none !important;
        }

        @media (min-width: 1024px) {
          .ryfio-gallery-polish {
            min-height: 620px;
          }
        }

        .ryfio-gallery-polish [class*="overflow-x"] {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .ryfio-gallery-polish [class*="overflow-x"]::-webkit-scrollbar {
          display: none;
        }

        .ryfio-variant-panel button[aria-pressed="true"],
        .ryfio-variant-panel button[data-selected="true"],
        .ryfio-variant-panel [data-selected="true"],
        .ryfio-variant-panel [data-state="checked"],
        .ryfio-variant-panel .selected {
          border-color: rgb(217 70 239 / 0.75) !important;
          background: rgb(168 85 247 / 0.14) !important;
          color: white !important;
          box-shadow: 0 0 0 1px rgb(217 70 239 / 0.18) !important;
        }
      `}</style>

      <div className="ryfio-gallery-polish overflow-hidden rounded-2xl border border-white/10 bg-white">
        <ProductGallery images={images} title={product?.title} />
      </div>

      <div className="ryfio-variant-panel border-t border-white/[0.08] pt-4">
        <div className="rounded-xl border border-fuchsia-300/20 bg-fuchsia-400/[0.06] px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-200">
            Selected variant
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {selectedVariant
              ? [selectedVariant.color, selectedVariant.size].filter(Boolean).join(" / ") ||
                selectedVariant.sku ||
                "Variant selected"
              : "Choose color and size"}
          </p>
        </div>

        <div className="mt-5 grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(230px,300px)]">
          <div className="min-w-0 space-y-5">
            <ColorSelector
              variants={variants}
              selectedColor={selectedColor}
              selectedVariant={selectedVariant}
              onChange={onColorChange}
            />

            <SizeSelector
              variants={availableVariants}
              selectedVariant={selectedVariant}
              selectedColor={selectedColor}
              onChange={onSizeChange}
            />
          </div>

          <div className="md:mt-0 pt-1">
            <p className="mb-2 text-sm font-black text-white">
              Production & Delivery
            </p>

            <div className="space-y-2 text-sm text-white/70">
              <p className="flex items-center gap-2">
                <CheckCircle size={15} className="shrink-0 text-fuchsia-200" />
                <span>Production: 2–4 business days</span>
              </p>
              <p className="flex items-center gap-2">
                <Truck size={15} className="shrink-0 text-cyan-300" />
                <span>Shipping: 3–7 business days</span>
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck size={15} className="shrink-0 text-emerald-300" />
                <span>Secure checkout</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {reviews.length > 0 && (
        <div className="border-t border-white/[0.08] pt-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-200">
            Verified customers
          </p>

          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.04] border border-fuchsia-300/25 text-xs font-black text-white">
                  {review.name?.[0]?.toUpperCase() ?? "U"}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-white">
                      {review.name || "Customer"}
                    </p>

                    {review.verified && (
                      <span className="rounded-full bg-white/[0.04] border border-emerald-300/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        verified
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs leading-relaxed text-white/50">
                    {review.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}