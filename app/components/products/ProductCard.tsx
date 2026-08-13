"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='950' viewBox='0 0 800 950'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23111827'/%3E%3Cstop offset='100%25' stop-color='%23080912'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='950' fill='url(%23g)'/%3E%3Crect x='120' y='150' width='560' height='560' rx='64' fill='%23ffffff' fill-opacity='0.06'/%3E%3Cpath d='M260 505l92-96 112 114 65-68 111 116H160z' fill='%23ffffff' fill-opacity='0.18'/%3E%3Ccircle cx='325' cy='360' r='46' fill='%23ffffff' fill-opacity='0.18'/%3E%3Ctext x='400' y='795' fill='%23ffffff' fill-opacity='0.55' font-family='Arial, sans-serif' font-size='34' font-weight='700' text-anchor='middle'%3ENo image available%3C/text%3E%3C/svg%3E";

export default memo(function ProductCard({
  id,
  title,
  price,
  image,
}: any) {
  const router = useRouter();
  const [imageSrc, setImageSrc] = useState<string>(image || PLACEHOLDER_IMAGE);

  useEffect(() => {
    setImageSrc(image || PLACEHOLDER_IMAGE);
  }, [image]);

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
          src={imageSrc}
          alt={title}
          fill
          className="object-cover group-hover:scale-110 transition-transform"
          onError={() => {
            if (imageSrc !== PLACEHOLDER_IMAGE) {
              setImageSrc(PLACEHOLDER_IMAGE);
            }
          }}
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
