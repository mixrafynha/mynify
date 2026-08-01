"use client";

import ProductGallery from "@/app/components/ProductGallery";

type Props = {
  images: string[];
  product: any;
};

export function ProductLeft({ images, product }: Props) {
  return (
    <div className="min-w-0 bg-transparent">
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
      `}</style>

      <div className="ryfio-gallery-polish overflow-hidden rounded-[26px] border border-white/10 bg-[#f5f5f7]">
        <ProductGallery images={images} title={product?.title} />
      </div>
    </div>
  );
}
