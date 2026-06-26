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
            cache: "no-store",
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

    loadReviews();

    return () => controller.abort();
  }, [product?.id]);

  return (
    <div className="min-w-0 space-y-4 bg-transparent">
      <style jsx global>{`
        .ryfio-gallery-polish {
          isolation: isolate;
          background:
            radial-gradient(circle at 16% 0%, rgba(168, 85, 247, 0.24), transparent 34%),
            radial-gradient(circle at 88% 8%, rgba(217, 70, 239, 0.14), transparent 32%),
            radial-gradient(circle at 50% 100%, rgba(14, 165, 233, 0.08), transparent 38%),
            linear-gradient(180deg, #160b24 0%, #12091f 46%, #0d0718 100%) !important;
        }

        .ryfio-gallery-polish,
        .ryfio-gallery-polish * {
          border-color: rgba(255, 255, 255, 0.07) !important;
        }

        .ryfio-gallery-polish > * {
          background: transparent !important;
        }

        /* Hide only the visible gallery scrollbars. The thumbnail row can still scroll by swipe/trackpad. */
        .ryfio-gallery-polish [class*="overflow-x"],
        .ryfio-gallery-polish [class*="overflow-y"],
        .ryfio-gallery-polish [class*="overflow-auto"],
        .ryfio-gallery-polish [class*="overflow-scroll"] {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }

        .ryfio-gallery-polish [class*="overflow-x"]::-webkit-scrollbar,
        .ryfio-gallery-polish [class*="overflow-y"]::-webkit-scrollbar,
        .ryfio-gallery-polish [class*="overflow-auto"]::-webkit-scrollbar,
        .ryfio-gallery-polish [class*="overflow-scroll"]::-webkit-scrollbar {
          width: 0 !important;
          height: 0 !important;
          display: none !important;
        }

        .ryfio-gallery-polish {
          max-height: none !important;
        }

        .ryfio-gallery-polish > div {
          max-height: none !important;
        }

        /* Main gallery image: do not shrink it with max-height. Let it fill the white/product canvas. */
        .ryfio-gallery-polish img {
          width: 100% !important;
          height: 100% !important;
          max-width: none !important;
          max-height: none !important;
          object-fit: contain !important;
          object-position: center !important;
          padding: 2px !important;
        }

        /* Product photo should feel larger, but without cropping the product. */
        .ryfio-gallery-polish picture img,
        .ryfio-gallery-polish img:not([width="40"]):not([height="40"]) {
          transform: scale(1.18) !important;
          transform-origin: center !important;
        }

        /* Keep thumbnails fixed and clean, only hide their scrollbar. */
        .ryfio-gallery-polish [class*="overflow-x"] img {
          transform: scale(1.04) !important;
          padding: 1px !important;
        }

        .ryfio-gallery-polish button,
        .ryfio-gallery-polish a {
          background: rgba(255, 255, 255, 0.04) !important;
          backdrop-filter: none !important;
        }

        .ryfio-variant-panel button[aria-pressed="true"],
        .ryfio-variant-panel button[data-selected="true"],
        .ryfio-variant-panel [data-selected="true"],
        .ryfio-variant-panel [data-state="checked"],
        .ryfio-variant-panel .selected {
          border-color: rgba(217, 70, 239, 0.72) !important;
          background: rgba(168, 85, 247, 0.18) !important;
          color: rgba(255, 255, 255, 0.98) !important;
          box-shadow: 0 0 0 1px rgba(217, 70, 239, 0.24), 0 0 26px rgba(168, 85, 247, 0.22) !important;
        }

        .ryfio-variant-panel button:focus-visible {
          outline: 2px solid rgba(217, 70, 239, 0.75) !important;
          outline-offset: 3px !important;
        }

        @media (max-width: 767px) {
          .ryfio-gallery-polish {
            border-radius: 22px !important;
          }

          .ryfio-gallery-polish img {
            max-height: none !important;
            padding: 2px !important;
          }

          .ryfio-gallery-polish picture img,
          .ryfio-gallery-polish img:not([width="40"]):not([height="40"]) {
            transform: scale(1.2) !important;
          }

          .ryfio-gallery-polish [class*="overflow-x"] img {
            transform: scale(1.05) !important;
          }
        }
      `}</style>

      <div className="ryfio-gallery-polish overflow-hidden rounded-[26px] border border-white/[0.07] shadow-[0_18px_52px_rgba(0,0,0,0.24)]">
        <ProductGallery images={images} title={product?.title} />
      </div>

      <div className="ryfio-variant-panel border-t border-white/[0.08] pt-4">
        <div className="rounded-2xl border border-fuchsia-300/25 bg-fuchsia-400/[0.08] px-4 py-3 shadow-[0_0_26px_rgba(168,85,247,0.12)]">
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