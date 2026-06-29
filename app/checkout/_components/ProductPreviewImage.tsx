"use client";

import { Package } from "lucide-react";

export default function ProductPreviewImage({ image, title }: { image?: string | null; title: string }) {
  return (
    <div className="h-[132px] w-[132px] overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] shadow-[0_18px_55px_rgba(0,0,0,0.25)] sm:h-[168px] sm:w-[168px]">
      {image ? (
        <img src={image} alt={title} className="h-full w-full object-contain p-2" loading="eager" decoding="async" />
      ) : (
        <div className="grid h-full w-full place-items-center text-white/35">
          <Package size={36} />
        </div>
      )}
    </div>
  );
}
