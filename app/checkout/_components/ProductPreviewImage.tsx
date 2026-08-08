"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Package } from "lucide-react";

type ProductPreviewImageProps = {
  title: string;
  frontImage?: string | null;
  backImage?: string | null;
};

function cleanUrl(value?: string | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export default function ProductPreviewImage({ title, frontImage, backImage }: ProductPreviewImageProps) {
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");

  const images = useMemo(
    () => ({
      front: cleanUrl(frontImage),
      back: cleanUrl(backImage),
    }),
    [frontImage, backImage],
  );

  const hasFront = Boolean(images.front);
  const hasBack = Boolean(images.back);
  const activeImage = activeSide === "back" ? images.back || images.front : images.front || images.back;
  const canToggle = hasFront && hasBack;

  const toggleSide = () => {
    if (!canToggle) return;
    setActiveSide((current) => (current === "front" ? "back" : "front"));
  };

  return (
    <div className="relative h-[132px] w-[132px] overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] shadow-[0_18px_55px_rgba(0,0,0,0.25)] sm:h-[168px] sm:w-[168px]">
      {activeImage ? (
        <button
          type="button"
          onClick={toggleSide}
          className="relative block h-full w-full"
          aria-label={canToggle ? `Toggle ${title} preview side` : `${title} preview`}
        >
          <img
            src={activeImage}
            alt={`${title} ${activeSide}`}
            className="h-full w-full object-contain p-2"
            loading="eager"
            decoding="async"
          />
          {canToggle ? (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/80 backdrop-blur-md">
              <ArrowLeftRight size={11} />
              {activeSide}
            </span>
          ) : null}
        </button>
      ) : (
        <div className="grid h-full w-full place-items-center text-white/35">
          <Package size={36} />
        </div>
      )}
    </div>
  );
}
