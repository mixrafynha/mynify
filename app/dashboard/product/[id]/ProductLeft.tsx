"use client";

import { useEffect, useState } from "react";

import ProductGallery from "@/app/components/ProductGallery";
import ColorSelector from "@/app/components/ColorSelector";
import SizeSelector from "@/app/components/SizeSelector";

type Props = {
  images: string[];
  product: any;
  variants: any[];
  availableVariants: any[];
  colors: {
    name: string | null | undefined;
    hex: string;
    variant: any;
  }[];
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
  colors,
  selectedColor,
  selectedVariant,
  onColorChange,
  onSizeChange,
}: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);

  void colors;

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const res = await fetch(
          `/api/product-reviews?productId=${product?.id}`,
          {
            cache: "no-store",
          }
        );

        const json = await res.json();

        setReviews(json?.reviews || []);
      } catch (err) {
        console.error(err);
      }
    };

    if (product?.id) {
      loadReviews();
    }
  }, [product?.id]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl overflow-hidden">
        <ProductGallery images={images} title={product?.title} />
      </div>

      <div className="space-y-4">
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

      {reviews.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Verified customers
          </p>

          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">
                  {r.name?.[0] ?? "U"}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{r.name}</p>

                    {r.verified && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                        verified
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500">{r.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
