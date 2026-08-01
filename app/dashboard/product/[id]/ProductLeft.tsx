"use client";

import { useEffect, useState } from "react";
import { CheckCircle, PencilLine, ShieldCheck, Truck } from "lucide-react";

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
        const res = await fetch(`/api/product-reviews?productId=${product.id}`, {
          signal: controller.signal,
        });

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
    <div className="min-w-0 space-y-5 bg-transparent">
      <style jsx global>{`
        .ryfio-gallery-polish {
          isolation: isolate;
          background: #f5f5f7 !important;
        }

        .ryfio-gallery-polish img {
          object-fit: contain !important;
          object-position: center !important;
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

      <div className="ryfio-gallery-polish overflow-hidden rounded-[26px] border border-white/10 bg-[#f5f5f7]">
        <ProductGallery images={images} title={product?.title} />
      </div>

      <div className="ryfio-variant-panel rounded-[26px] border border-white/10 bg-[#15101d] px-5 py-5 sm:px-6">
        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.55fr)]">
          <div className="order-2 min-w-0 space-y-6 lg:order-1">
            <SizeSelector
              variants={availableVariants}
              selectedVariant={selectedVariant}
              selectedColor={selectedColor}
              onChange={onSizeChange}
            />

            <ColorSelector
              variants={variants}
              selectedColor={selectedColor}
              selectedVariant={selectedVariant}
              onChange={onColorChange}
            />

            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/62 transition hover:text-white/82"
            >
              <PencilLine size={14} className="text-fuchsia-300" />
              Size guide
            </button>
          </div>

          <div className="order-1 space-y-5 lg:order-2">
            <div className="grid gap-3 sm:grid-cols-3">
              <DeliveryCard
                icon={CheckCircle}
                title="Production"
                value="2-4 business days"
                iconClassName="text-fuchsia-300"
              />
              <DeliveryCard
                icon={Truck}
                title="Shipping"
                value="3-7 business days"
                iconClassName="text-fuchsia-300"
              />
              <DeliveryCard
                icon={ShieldCheck}
                title="Delivery"
                value="5-11 business days"
                iconClassName="text-white"
              />
            </div>

            <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-200">
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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-fuchsia-300/25 bg-white/[0.04] text-xs font-black text-white">
                  {review.name?.[0]?.toUpperCase() ?? "U"}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-white">
                      {review.name || "Customer"}
                    </p>

                    {review.verified && (
                      <span className="rounded-full border border-emerald-300/20 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold text-emerald-300">
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

function DeliveryCard({
  icon: Icon,
  title,
  value,
  iconClassName,
}: {
  icon: any;
  title: string;
  value: string;
  iconClassName?: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] px-4 py-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-fuchsia-300/20 bg-fuchsia-400/[0.06]">
        <Icon size={17} className={iconClassName} />
      </div>
      <p className="text-[13px] font-bold text-white">{title}</p>
      <p className="mt-1 text-sm text-white/62">{value}</p>
    </div>
  );
}
