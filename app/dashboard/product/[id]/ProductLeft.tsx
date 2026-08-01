"use client";

import { useEffect, useMemo, useState } from "react";
import ProductGallery from "@/app/components/ProductGallery";
import ProductGalleryThumbnails from "@/app/components/ProductGalleryThumbnails";

type Props = {
  images: string[];
  product: any;
};

const PLACEHOLDER_IMAGE = "/placeholder.png";

function normalizeImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const url = value.trim();
  if (!url) return null;

  if (
    url.startsWith("/") ||
    url.startsWith("https://") ||
    url.startsWith("http://")
  ) {
    return url;
  }

  return null;
}

export function ProductLeft({ images, product }: Props) {
  const safeImages = useMemo(() => {
    const normalizedImages = Array.isArray(images)
      ? images
          .map(normalizeImageUrl)
          .filter((image): image is string => Boolean(image))
      : [];

    return normalizedImages.length > 0
      ? Array.from(new Set(normalizedImages))
      : [PLACEHOLDER_IMAGE];
  }, [images]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setActiveIndex(0);
    setFailedImages({});
  }, [safeImages]);

  const activeImage = safeImages[activeIndex] ?? safeImages[0] ?? PLACEHOLDER_IMAGE;
  const activeImageSrc = failedImages[activeImage] ? PLACEHOLDER_IMAGE : activeImage;

  const showPreviousImage = () => {
    setActiveIndex((currentIndex) =>
      currentIndex - 1 < 0 ? safeImages.length - 1 : currentIndex - 1
    );
  };

  const showNextImage = () => {
    setActiveIndex((currentIndex) =>
      currentIndex + 1 >= safeImages.length ? 0 : currentIndex + 1
    );
  };

  const handleImageError = (imageUrl: string) => {
    setFailedImages((current) => ({
      ...current,
      [imageUrl]: true,
    }));
  };

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

      <div className="space-y-2">
        <div className="ryfio-gallery-polish overflow-hidden bg-white">
          <ProductGallery
            src={activeImageSrc}
            title={product?.title}
            canNavigate={safeImages.length > 1}
            onPrevious={showPreviousImage}
            onNext={showNextImage}
          />
        </div>

        {safeImages.length > 1 && (
          <ProductGalleryThumbnails
            images={safeImages}
            title={product?.title}
            activeIndex={activeIndex}
            failedImages={failedImages}
            onSelect={setActiveIndex}
            onError={handleImageError}
          />
        )}
      </div>
    </div>
  );
}
