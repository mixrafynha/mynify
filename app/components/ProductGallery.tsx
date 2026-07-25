"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const PLACEHOLDER_IMAGE = "/placeholder.png";

function normalizeImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const url = value.trim();

  if (!url) return null;

  // Suporta imagens locais e URLs externas.
  if (
    url.startsWith("/") ||
    url.startsWith("https://") ||
    url.startsWith("http://")
  ) {
    return url;
  }

  return null;
}

export default function ProductGallery({
  images,
  title,
}: {
  images?: string[] | null;
  title?: string | null;
}) {
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

  const activeImage =
    safeImages[activeIndex] ?? safeImages[0] ?? PLACEHOLDER_IMAGE;

  const activeImageSrc = failedImages[activeImage]
    ? PLACEHOLDER_IMAGE
    : activeImage;

  const handleNextImage = () => {
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
    <div className="space-y-3">
      {/* MAIN IMAGE */}
      <div className="relative h-[460px] w-full overflow-hidden rounded-2xl bg-[#f3f3f1] sm:h-[560px] lg:h-[680px]">
        <Image
          key={activeImageSrc}
          src={activeImageSrc}
          alt={title?.trim() || "Product image"}
          fill
          priority
          unoptimized
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-contain object-center"
          onError={() => handleImageError(activeImage)}
        />

        {safeImages.length > 1 && (
          <button
            type="button"
            onClick={handleNextImage}
            aria-label="Show next product image"
            className="absolute bottom-4 right-4 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white"
          >
            Next
          </button>
        )}
      </div>

      {/* THUMBNAILS */}
      {safeImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {safeImages.map((image, index) => {
            const thumbnailSrc = failedImages[image]
              ? PLACEHOLDER_IMAGE
              : image;

            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show product image ${index + 1}`}
                aria-pressed={index === activeIndex}
                className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border bg-[#f3f3f1] ${
                  index === activeIndex
                    ? "border-black"
                    : "border-black/10"
                }`}
              >
                <Image
                  src={thumbnailSrc}
                  alt={`${title?.trim() || "Product"} image ${index + 1}`}
                  fill
                  unoptimized
                  sizes="80px"
                  className="object-contain object-center"
                  onError={() => handleImageError(image)}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}