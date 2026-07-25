"use client";

import { useEffect, useRef, useState } from "react";
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
  const galleryRef = useRef<HTMLDivElement | null>(null);



  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;

    let frame = 0;

    const polishGallery = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const images = Array.from(gallery.querySelectorAll<HTMLImageElement>("img"));
        if (!images.length) return;

        const visibleImages = images.filter((image) => {
          const rect = image.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });

        const mainImage = visibleImages.reduce<HTMLImageElement | null>((largest, image) => {
          if (!largest) return image;
          const area = image.getBoundingClientRect().width * image.getBoundingClientRect().height;
          const largestArea =
            largest.getBoundingClientRect().width * largest.getBoundingClientRect().height;
          return area > largestArea ? image : largest;
        }, null);

        images.forEach((image) => {
          image.removeAttribute("data-ryfio-main-image");
          image.removeAttribute("data-ryfio-thumbnail-image");
        });

        gallery
          .querySelectorAll<HTMLElement>(
            "[data-ryfio-main-frame], [data-ryfio-thumbnail-button]"
          )
          .forEach((element) => {
            element.removeAttribute("data-ryfio-main-frame");
            element.removeAttribute("data-ryfio-thumbnail-button");
          });

        if (mainImage) {
          mainImage.setAttribute("data-ryfio-main-image", "true");

          const naturalRatio =
            mainImage.naturalWidth > 0 && mainImage.naturalHeight > 0
              ? mainImage.naturalWidth / mainImage.naturalHeight
              : 1;

          const zoom = naturalRatio > 1.3 ? 1.06 : naturalRatio < 0.78 ? 1.1 : 1.18;
          mainImage.style.setProperty("--ryfio-smart-zoom", String(zoom));

          let parent: HTMLElement | null = mainImage.parentElement;
          const imageRect = mainImage.getBoundingClientRect();

          while (parent && parent !== gallery) {
            const rect = parent.getBoundingClientRect();
            const isMainFrame =
              rect.width >= imageRect.width * 0.85 &&
              rect.height >= imageRect.height * 0.85 &&
              rect.width > 320 &&
              rect.height > 300;

            if (isMainFrame) {
              parent.setAttribute("data-ryfio-main-frame", "true");
              break;
            }

            parent = parent.parentElement;
          }
        }

        visibleImages.forEach((image) => {
          if (image === mainImage) return;
          const rect = image.getBoundingClientRect();

          if (rect.width <= 180 && rect.height <= 180) {
            image.setAttribute("data-ryfio-thumbnail-image", "true");
            const button = image.closest<HTMLElement>("button, [role='button']");
            button?.setAttribute("data-ryfio-thumbnail-button", "true");
          }
        });
      });
    };

    const observer = new MutationObserver(polishGallery);
    observer.observe(gallery, { childList: true, subtree: true });

    const resizeObserver = new ResizeObserver(polishGallery);
    resizeObserver.observe(gallery);

    gallery.addEventListener("load", polishGallery, true);
    polishGallery();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      gallery.removeEventListener("load", polishGallery, true);
    };
  }, [images]);

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
          background: #ffffff !important;
          contain: layout paint;
        }

        .ryfio-gallery-polish,
        .ryfio-gallery-polish > * {
          min-height: 0 !important;
        }

        .ryfio-gallery-polish > * {
          height: auto !important;
        }

        .ryfio-gallery-polish * {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }

        .ryfio-gallery-polish img {
          object-fit: contain !important;
          object-position: center !important;
          -webkit-user-drag: none;
          user-select: none;
        }

        .ryfio-gallery-polish [data-ryfio-main-frame="true"] {
          min-height: clamp(430px, 47vw, 650px) !important;
          max-height: 650px !important;
          overflow: hidden !important;
          background: #fff !important;
        }

        .ryfio-gallery-polish img[data-ryfio-main-image="true"] {
          transform: scale(var(--ryfio-smart-zoom, 1.16)) !important;
          transform-origin: center center !important;
          transition: transform 220ms ease, opacity 180ms ease !important;
          will-change: auto !important;
        }

        .ryfio-gallery-polish [data-ryfio-thumbnail-button="true"] {
          width: 80px !important;
          height: 80px !important;
          flex: 0 0 80px !important;
          overflow: hidden !important;
          border-radius: 10px !important;
          border: 1px solid #d9dde5 !important;
          background: #fff !important;
          padding: 3px !important;
          box-shadow: none !important;
          transition: border-color 140ms ease, transform 140ms ease !important;
        }

        .ryfio-gallery-polish [data-ryfio-thumbnail-button="true"]:hover {
          transform: translateY(-1px) !important;
          border-color: rgb(168 85 247 / 0.7) !important;
        }

        .ryfio-gallery-polish [data-ryfio-thumbnail-button="true"][aria-current="true"],
        .ryfio-gallery-polish [data-ryfio-thumbnail-button="true"][aria-pressed="true"],
        .ryfio-gallery-polish [data-ryfio-thumbnail-button="true"][data-active="true"],
        .ryfio-gallery-polish [data-ryfio-thumbnail-button="true"][data-selected="true"] {
          border-color: #00d874 !important;
          box-shadow: 0 0 0 1px #00d874 !important;
        }

        .ryfio-gallery-polish img[data-ryfio-thumbnail-image="true"] {
          width: 100% !important;
          height: 100% !important;
          transform: scale(1.08) !important;
          border-radius: 7px !important;
        }

        .ryfio-gallery-polish [class*="overflow-x"] {
          scrollbar-width: none;
          -ms-overflow-style: none;
          overscroll-behavior-inline: contain;
          scroll-snap-type: x proximity;
        }

        .ryfio-gallery-polish [class*="overflow-x"]::-webkit-scrollbar {
          display: none;
        }

        .ryfio-gallery-polish [data-ryfio-thumbnail-button="true"] {
          scroll-snap-align: start;
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

        @media (max-width: 640px) {
          .ryfio-gallery-polish [data-ryfio-main-frame="true"] {
            min-height: 390px !important;
            max-height: 520px !important;
          }

          .ryfio-gallery-polish img[data-ryfio-main-image="true"] {
            --ryfio-smart-zoom: 1.1 !important;
          }

          .ryfio-gallery-polish [data-ryfio-thumbnail-button="true"] {
            width: 68px !important;
            height: 68px !important;
            flex-basis: 68px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ryfio-gallery-polish img,
          .ryfio-gallery-polish [data-ryfio-thumbnail-button="true"] {
            transition: none !important;
          }
        }
      `}</style>

      <div ref={galleryRef} className="ryfio-gallery-polish overflow-hidden rounded-2xl border border-white/10 bg-white">
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