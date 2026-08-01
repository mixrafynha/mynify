"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Expand, X } from "lucide-react";

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
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
    setFailedImages({});
    setFullscreenOpen(false);
  }, [safeImages]);

  const activeImage =
    safeImages[activeIndex] ?? safeImages[0] ?? PLACEHOLDER_IMAGE;

  const activeImageSrc = failedImages[activeImage]
    ? PLACEHOLDER_IMAGE
    : activeImage;

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
    <>
      <div className="space-y-2.5">
        <div className="relative rounded-[20px] border border-[#dfdfe8] bg-[#f3f3f1] p-2 sm:p-3">
          <div className="relative flex min-h-[455px] gap-3 sm:min-h-[555px] lg:min-h-[675px]">
            {safeImages.length > 1 && (
              <div className="hidden w-[76px] shrink-0 flex-col gap-2 overflow-y-auto pr-1 md:flex">
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
                      className={`relative h-[92px] w-[76px] overflow-hidden rounded-[12px] bg-[#efefee] transition ${
                        index === activeIndex
                          ? "ring-2 ring-fuchsia-400 ring-offset-2 ring-offset-[#f3f3f1]"
                          : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={thumbnailSrc}
                        alt={`${title?.trim() || "Product"} image ${index + 1}`}
                        fill
                        unoptimized
                        sizes="76px"
                        className="object-contain object-center"
                        onError={() => handleImageError(image)}
                      />
                    </button>
                  );
                })}
              </div>
            )}

            <div className="relative min-w-0 flex-1 overflow-hidden rounded-[16px] bg-[#f3f3f1]">
              <button
                type="button"
                onClick={() => setFullscreenOpen(true)}
                className="absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-full bg-[#1c1a26]/92 px-3 py-2 text-[11px] font-bold tracking-[0.02em] text-white shadow-[0_18px_40px_rgba(0,0,0,0.16)] backdrop-blur-sm transition hover:bg-[#1c1a26]"
                aria-label="Open full screen image"
              >
                <Expand size={14} strokeWidth={2} />
                <span>Full screen</span>
              </button>

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
                <>
                  <button
                    type="button"
                    onClick={showPreviousImage}
                    aria-label="Show previous product image"
                    className="absolute left-4 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-[#1c1a26]/92 text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition hover:scale-[1.02]"
                  >
                    <ArrowLeft size={17} strokeWidth={2.15} />
                  </button>

                  <button
                    type="button"
                    onClick={showNextImage}
                    aria-label="Show next product image"
                    className="absolute right-4 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-[#1c1a26]/92 text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition hover:scale-[1.02]"
                  >
                    <ArrowRight size={17} strokeWidth={2.15} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {safeImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
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
                  className={`relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-[14px] bg-[#f3f3f1] transition ${
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
                    sizes="72px"
                    className="object-contain object-center"
                    onError={() => handleImageError(image)}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {fullscreenOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 p-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setFullscreenOpen(false)}
            className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close full screen image"
          >
            <X size={18} />
          </button>

          <div className="relative flex h-full items-center justify-center">
            <div className="relative h-full max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[20px] bg-[#f3f3f1]">
              <Image
                src={activeImageSrc}
                alt={title?.trim() || "Product image"}
                fill
                unoptimized
                sizes="100vw"
                className="object-contain object-center"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
