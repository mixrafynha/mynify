"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function HeroSection({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="relative w-full h-[260px] md:h-[320px] overflow-hidden rounded-xl cursor-pointer"
    >
      <Image
        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c"
        alt="Hero"
        fill
        className="object-cover"
      />

      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
        <h3 className="text-2xl font-semibold">
          Promote your service
        </h3>

        <p className="text-sm opacity-80 mt-1">
          Turn traffic into customers
        </p>
      </div>
    </motion.div>
  );
}