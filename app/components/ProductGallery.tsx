"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Expand, X } from "lucide-react";

type ProductGalleryProps = {
  src: string;
  title?: string | null;
  canNavigate: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export default function ProductGallery({
  src,
  title,
  canNavigate,
  onPrevious,
  onNext,
}: ProductGalleryProps) {
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!fullscreenOpen) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;

    body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFullscreenOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fullscreenOpen]);

  return (
    <>
      <div className="relative h-[500px] overflow-hidden bg-white sm:h-[650px] lg:h-[740px]">
        <button
          type="button"
          onClick={() => setFullscreenOpen(true)}
          className="absolute left-4 top-4 z-[3] inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.01em] text-[#111111] transition hover:opacity-65"
          aria-label="Open full screen image"
        >
          <Expand size={13} strokeWidth={2} />
          <span>Full screen</span>
        </button>

        <Image
          key={src}
          src={src}
          alt={title?.trim() || "Product image"}
          fill
          priority
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 42vw"
          className="translate-y-[5%] scale-[1.1] object-contain object-center sm:translate-y-[6%] sm:scale-[1.13] lg:translate-y-[7%] lg:scale-[1.16]"
        />

        {canNavigate && (
          <>
            <button
              type="button"
              onClick={onPrevious}
              aria-label="Show previous product image"
              className="absolute left-4 top-1/2 z-[2] grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-[#17141d] text-white transition hover:opacity-85 sm:h-9 sm:w-9"
            >
              <ArrowLeft size={14} strokeWidth={2.2} />
            </button>

            <button
              type="button"
              onClick={onNext}
              aria-label="Show next product image"
              className="absolute right-4 top-1/2 z-[2] grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-[#17141d] text-white transition hover:opacity-85 sm:h-9 sm:w-9"
            >
              <ArrowRight size={14} strokeWidth={2.2} />
            </button>
          </>
        )}
      </div>

      {mounted &&
        fullscreenOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/88 p-4"
            onClick={() => setFullscreenOpen(false)}
          >
            <button
              type="button"
              onClick={() => setFullscreenOpen(false)}
              className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close full screen image"
            >
              <X size={16} />
            </button>

            <div className="relative flex h-full items-center justify-center">
              <div
                className="relative h-full max-h-[92vh] w-full max-w-6xl overflow-hidden bg-white"
                onClick={(event) => event.stopPropagation()}
              >
                <Image
                  src={src}
                  alt={title?.trim() || "Product image"}
                  fill
                  unoptimized
                  sizes="100vw"
                  className="object-contain object-center"
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
