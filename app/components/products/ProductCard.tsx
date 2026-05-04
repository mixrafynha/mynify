"use client";

import { memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";

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

    router.push(`/dashboard/product/${id}`);
  }, [router, id]);

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group text-left"
    >

      <div className="relative aspect-[1/1.15] overflow-hidden rounded-xl">

        <Image
          src={image}
          alt={title}
          fill
          className="object-cover group-hover:scale-110 transition-transform"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute bottom-0 p-3 text-white">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs opacity-80">{price}</p>
        </div>

      </div>

    </motion.button>
  );
});