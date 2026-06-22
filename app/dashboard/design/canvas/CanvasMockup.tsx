"use client";

import type { CanvasSide } from "./types";
import { MOCKUP_VISUAL_SCALE_BY_PRODUCT } from "./productConfig";

type Props = {
  mockup: string;
  mockupId: string;
  currentSide: CanvasSide;
  color?: string;
};

export default function CanvasMockup({
  mockup,
  mockupId,
  currentSide,
  color = "#ffffff",
}: Props) {
  const visualScale =
    MOCKUP_VISUAL_SCALE_BY_PRODUCT?.[mockupId]?.[currentSide] ?? 1;

  return (
    // Aplicamos o transform e o transformOrigin aqui, no container pai.
    // Assim, tudo o que for colocado dentro dele herdará a mesma escala.
    <div 
      className="pointer-events-none absolute inset-0 z-0 select-none aspect-square w-full max-w-full mx-auto"
      style={{
        transform: `scale(${visualScale})`,
        transformOrigin: "center center",
      }}
    >
      <img
        src={mockup}
        alt={`${mockupId}-${currentSide}`}
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover drop-shadow-[0_35px_45px_rgba(0,0,0,0.35)]"
      />

      <div
        className="absolute inset-0 mix-blend-multiply opacity-80"
        style={{
          backgroundColor: color,
          WebkitMaskImage: `url(${mockup})`,
          maskImage: `url(${mockup})`,
          WebkitMaskSize: "cover",
          maskSize: "cover",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
    </div>
  );
}