"use client";

import type { CanvasSide } from "./types";

type Props = {
  mockup: string;
  mockupId: string;
  currentSide: CanvasSide;
  color?: string;
  visualScale?: number;
};

export default function CanvasMockup({
  mockup,
  mockupId,
  currentSide,
  color = "#ffffff",
  visualScale = 1,
}: Props) {
  const normalizedColor = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(String(color).trim())
    ? String(color).trim().toLowerCase()
    : "#ffffff";

  return (
    // Aplicamos o transform e o transformOrigin aqui, no container pai.
    // Assim, tudo o que for colocado dentro dele herdará a mesma escala.
    <div 
      className="pointer-events-none absolute inset-0 z-0 mx-auto aspect-square w-full max-w-full select-none isolate"
      style={{
        transform: `scale(${visualScale})`,
        transformOrigin: "center center",
        contain: "layout paint",
      }}
    >
      <img
        src={mockup}
        alt={`${mockupId}-${currentSide}`}
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover md:drop-shadow-[0_35px_45px_rgba(0,0,0,0.35)]"
        style={{ imageRendering: "auto", transform: "translateZ(0)" }}
      />

      <div
        key={`${currentSide}:${mockup}:${normalizedColor}`}
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundColor: normalizedColor,
          mixBlendMode: "multiply",
          WebkitMaskImage: `url("${mockup}")`,
          maskImage: `url("${mockup}")`,
          WebkitMaskSize: "cover",
          maskSize: "cover",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
        }}
      />
    </div>
  );
}
