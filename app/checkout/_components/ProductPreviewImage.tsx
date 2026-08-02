"use client";

import { useMemo } from "react";
import { Package } from "lucide-react";

type ProductPreviewImageProps = {
  title: string;
  frontImage?: string | null;
  backImage?: string | null;
};

function cleanUrl(value?: string | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export default function ProductPreviewImage({ title, frontImage, backImage }: ProductPreviewImageProps) {
  const images = useMemo(
    () => ({
      front: cleanUrl(frontImage),
      back: cleanUrl(backImage),
    }),
    [frontImage, backImage],
  );

  const hasFront = Boolean(images.front);
  const hasBack = Boolean(images.back);

  return (
    <div className="flex h-[132px] w-[132px] flex-col gap-2 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] p-2 shadow-[0_18px_55px_rgba(0,0,0,0.25)] sm:h-[168px] sm:w-[168px]">
      {hasFront ? (
        <div className="relative flex-1 overflow-hidden rounded-[20px] border border-white/10 bg-black/20">
          <img
            src={images.front as string}
            alt={`${title} front`}
            className="h-full w-full object-contain p-2"
            loading="eager"
            decoding="async"
          />
          <span className="absolute left-2 top-2 rounded-full border border-white/10 bg-black/50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/80 backdrop-blur-md">
            front
          </span>
        </div>
      ) : (
        <div className="grid flex-1 place-items-center text-white/35">
          <Package size={32} />
        </div>
      )}
      {hasBack ? (
        <div className="relative flex-1 overflow-hidden rounded-[20px] border border-white/10 bg-black/20">
          <img
            src={images.back as string}
            alt={`${title} back`}
            className="h-full w-full object-contain p-2"
            loading="eager"
            decoding="async"
          />
          <span className="absolute left-2 top-2 rounded-full border border-white/10 bg-black/50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/80 backdrop-blur-md">
            back
          </span>
        </div>
      ) : null}
    </div>
  );
}
