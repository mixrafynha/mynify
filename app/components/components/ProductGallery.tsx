"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProductGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const safeImages =
    Array.isArray(images) && images.length > 0
      ? images
      : ["/placeholder.png"];

  const [activeIndex, setActiveIndex] = useState(0);

  const activeImage = safeImages[activeIndex];

  return (
    <div className="space-y-4">

      {/* MAIN IMAGE */}
      <div className="relative w-full h-[450px] bg-gray-100 rounded-xl overflow-hidden">

        <Image
          key={activeImage}
          src={activeImage}
          alt={title}
          fill
          className="object-cover"
          priority
          unoptimized
        />

        <button
          type="button"
          onClick={() =>
            setActiveIndex((prev) =>
              prev + 1 >= safeImages.length ? 0 : prev + 1
            )
          }
          className="absolute bottom-4 right-4 bg-black text-white px-4 py-2 rounded-full text-sm"
        >
          Next
        </button>
      </div>

      {/* THUMBNAILS */}
      <div className="flex gap-2 overflow-x-auto">

        {safeImages.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={`relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2
              ${i === activeIndex ? "border-green-500" : "border-gray-200"}
            `}
          >
            <Image
              src={img}
              alt={`thumb-${i}`}
              fill
              className="object-cover"
              unoptimized
            />
          </button>
        ))}

      </div>

    </div>
  );
}