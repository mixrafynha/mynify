"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Expand } from "lucide-react";

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
    <div className="space-y-2.5">
      <div className="relative h-[455px] w-full overflow-hidden rounded-[20px] border border-[#dfdfe8] bg-[#f3f3f1] sm:h-[555px] lg:h-[675px]">
        <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-full bg-[#1c1a26]/92 px-3 py-2 text-[11px] font-bold tracking-[0.02em] text-white shadow-[0_18px_40px_rgba(0,0,0,0.16)] backdrop-blur-sm">
          <Expand size={14} strokeWidth={2} />
          <span>Full screen</span>
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
            className="absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-[#1c1a26]/92 text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition hover:scale-[1.02]"
          >
            <ArrowRight size={18} strokeWidth={2.1} />
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
                className={`relative h-[74px] w-[74px] flex-shrink-0 overflow-hidden rounded-[14px] bg-[#f3f3f1] transition ${
                  index === activeIndex
                    ? "ring-2 ring-fuchsia-400 ring-offset-2 ring-offset-[#15101d]"
                    : "opacity-88 hover:opacity-100"
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
