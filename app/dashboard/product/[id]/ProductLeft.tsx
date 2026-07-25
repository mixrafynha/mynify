"use client";

import { useEffect, useState } from "react";
import { Box, ShieldCheck, Truck } from "lucide-react";

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
    <div className="min-w-0 space-y-4 bg-transparent">
      <style jsx global>{`
        .ryfio-product-gallery {
          isolation: isolate;
          background: #15111d !important;
        }

        .ryfio-product-gallery img {
          object-fit: cover !important;
          object-position: center !important;
        }

        .ryfio-product-gallery [class*="overflow-x"] {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .ryfio-product-gallery [class*="overflow-x"]::-webkit-scrollbar {
          display: none;
        }

        .ryfio-variant-panel button[aria-pressed="true"],
        .ryfio-variant-panel button[data-selected="true"],
        .ryfio-variant-panel [data-selected="true"],
        .ryfio-variant-panel [data-state="checked"],
        .ryfio-variant-panel .selected {
          border-color: rgb(217 70 239 / 0.9) !important;
          background: rgb(168 85 247 / 0.12) !important;
          color: white !important;
          box-shadow: 0 0 0 1px rgb(34 211 238 / 0.35) !important;
        }
      `}</style>

      <div className="ryfio-product-gallery overflow-hidden rounded-2xl border border-white/10 bg-[#15111d]">
        <ProductGallery images={images} title={product?.title} />
      </div>

      <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-fuchsia-400/35 bg-[#17121f]">
        <Benefit icon={Box} title="Production" text="2–4 business days" tone="text-fuchsia-300" />
        <Benefit icon={Truck} title="Shipping" text="3–7 business days" tone="text-cyan-300" border />
        <Benefit icon={ShieldCheck} title="Secure checkout" text="Safe & encrypted" tone="text-emerald-300" border />
      </div>

      <div className="ryfio-variant-panel rounded-2xl border border-white/10 bg-[#17121f] p-4 sm:p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="min-w-0 sm:border-r sm:border-white/10 sm:pr-5">
            <ColorSelector
              variants={variants}
              selectedColor={selectedColor}
              selectedVariant={selectedVariant}
              onChange={onColorChange}
            />
          </div>

          <div className="min-w-0 sm:pl-1">
            <SizeSelector
              variants={availableVariants}
              selectedVariant={selectedVariant}
              selectedColor={selectedColor}
              onChange={onSizeChange}
            />
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

function Benefit({ icon: Icon, title, text, tone, border = false }: any) {
  return (
    <div className={`flex min-w-0 items-center gap-3 px-3 py-4 sm:px-5 ${border ? "border-l border-white/10" : ""}`}>
      <Icon size={25} className={`hidden shrink-0 sm:block ${tone}`} strokeWidth={1.8} />
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold uppercase tracking-wide text-white/55 sm:text-xs">
          {title}
        </p>
        <p className="mt-1 truncate text-[10px] text-white/80 sm:text-xs">{text}</p>
      </div>
    </div>
  );
}
