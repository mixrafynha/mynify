"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Box } from "lucide-react";

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
      <div className="relative h-[460px] w-full overflow-hidden rounded-[22px] border border-[#dfdfe8] bg-[#f3f3f1] sm:h-[560px] lg:h-[680px]">
        <div className="absolute left-4 top-4 z-10 flex h-14 w-14 flex-col items-center justify-center rounded-[18px] border border-black/10 bg-[#1c1a26] text-white shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
          <Box size={17} strokeWidth={1.8} />
          <span className="mt-1 text-[11px] font-black tracking-[-0.02em]">3D</span>
        </div>

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
            className="absolute right-5 top-1/2 z-10 grid h-14 w-14 -translate-y-1/2 place-items-center rounded-full border border-white/60 bg-[#1c1a26] text-white shadow-[0_18px_40px_rgba(0,0,0,0.2)] transition hover:scale-[1.02]"
          >
            <ArrowRight size={22} strokeWidth={1.9} />
          </button>
        )}
      </div>

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
                className={`relative h-[82px] w-[82px] flex-shrink-0 overflow-hidden rounded-[16px] border bg-[#f3f3f1] transition ${
                  index === activeIndex
                    ? "border-fuchsia-400 shadow-[0_0_0_1px_rgba(232,121,249,0.45)]"
                    : "border-white/10"
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
