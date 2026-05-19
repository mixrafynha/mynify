"use client";

import { memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";

export default memo(function ProductCard({
  id,
  title,
  price,
  image,
}: any) {
  const router = useRouter();

  const handleClick = useCallback(() => {
    const now = Date.now();

    if ((window as any)._lastNav > now - 300) return;

    (window as any)._lastNav = now;

    router.push(`/dashboard/product/${encodeURIComponent(id)}`);
  }, [router, id]);

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileHover={{ y: -4, scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      className="group min-w-0 text-left"
    >
      <article className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-[#1b1830] via-[#131325] to-[#0f1020] p-2 transition duration-300 hover:border-fuchsia-400/25 hover:shadow-[0_25px_80px_rgba(217,70,239,0.16)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-[#18182d]">
          <Image
            src={image || "/placeholder.png"}
            alt={title || "Product image"}
            fill
            className="object-cover transition duration-700 group-hover:scale-[1.06]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          <div className="absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/35 text-white backdrop-blur-xl transition group-hover:bg-white/10">
            <Eye size={16} className="text-white/85" />
          </div>
        </div>

        <div className="relative px-1 pb-1 pt-3">
          <p className="mb-1 truncate text-[10px] font-black uppercase tracking-[0.14em] text-[#b8b9d9]">
            Product
          </p>

          <h3 className="line-clamp-2 min-h-[34px] text-[13px] font-extrabold leading-tight tracking-[-0.03em] text-[#f3f4ff] sm:text-sm">
            {title || "Untitled product"}
          </h3>

          <div className="mt-3 flex items-end justify-between gap-2">
            <p className="text-sm font-extrabold text-white sm:text-base">
              {price}
            </p>

            <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#d9dbff] backdrop-blur-xl transition group-hover:bg-white/[0.14]">
              View
            </span>
          </div>
        </div>
      </article>
    </motion.button>
  );
});