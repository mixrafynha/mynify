"use client";

import { useState } from "react";

export default function PreviewGallery({
  images,
  title,
  category,
  price,
  isAi,
}: {
  images: string[];
  title: string;
  category: string;
  price: number;
  isAi: boolean;
}) {
  const validImages = images.filter(Boolean);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectedImage =
    validImages[selectedIndex] || validImages[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
      {/* LEFT */}
      <section className="rounded-[32px] border border-white/10 bg-white/[0.035] p-3 shadow-[0_0_50px_rgba(168,85,247,0.12)] backdrop-blur-xl sm:p-5">
        {/* MAIN IMAGE */}
        <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-[28px] bg-gradient-to-br from-white/[0.08] to-white/[0.02] sm:min-h-[520px] lg:min-h-[640px]">
          <img
            src={selectedImage}
            alt={title}
            className="
              max-h-[74vh]
              w-full
              object-contain
              p-3
              sm:p-6
              transition-all duration-300
            "
          />

          <span className="absolute left-4 top-4 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-3 py-1 text-xs font-black text-white shadow-[0_0_25px_rgba(168,85,247,0.45)]">
            {isAi ? "AI Mockup" : "Base Mockup"}
          </span>
        </div>

        {/* THUMBNAILS */}
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {validImages.map((img, index) => {
            const active = selectedIndex === index;

            return (
              <button
                key={`${img}-${index}`}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`
                  relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border p-1
                  transition-all duration-300 sm:h-24 sm:w-24
                  ${
                    active
                      ? "border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.55)]"
                      : "border-white/10 hover:border-purple-500/40"
                  }
                `}
              >
                <img
                  src={img}
                  alt={`${title} ${index + 1}`}
                  className="h-full w-full rounded-xl object-cover"
                />

                {active && (
                  <div className="absolute inset-0 rounded-2xl ring-2 ring-purple-500/50" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* RIGHT INFO */}
      <aside className="h-fit rounded-[32px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_0_50px_rgba(168,85,247,0.12)] backdrop-blur-xl">
        <p className="text-sm text-white/40">
          Product
        </p>

        <h2 className="mt-1 text-2xl font-black leading-tight text-white">
          {title}
        </h2>

        <div className="mt-6 border-t border-white/10 pt-6">
          <p className="text-sm text-white/40">
            Final price
          </p>

          <p className="mt-1 text-3xl font-black text-fuchsia-400">
            ${price.toFixed(2)}
          </p>
        </div>

        <div className="mt-6 grid gap-3 border-t border-white/10 pt-6">
          <div className="rounded-2xl bg-white/[0.04] p-4">
            <p className="text-xs text-white/40">
              Preview type
            </p>

            <p className="font-black text-white">
              {isAi
                ? "AI realistic mockup"
                : "Base mockup"}
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.04] p-4">
            <p className="text-xs text-white/40">
              Category
            </p>

            <p className="font-black text-white">
              {category}
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.04] p-4">
            <p className="text-xs text-white/40">
              Images
            </p>

            <p className="font-black text-white">
              {validImages.length} previews
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}