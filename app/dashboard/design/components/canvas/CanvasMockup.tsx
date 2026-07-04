"use client";

import { memo } from "react";
import type { CanvasSide } from "./types";

type Props = {
  mockup: string;
  mockupId: string;
  currentSide: CanvasSide;
  color?: string;
  visualScale?: number;
};

function CanvasMockup({
  mockup,
  mockupId,
  currentSide,
  color = "#ffffff",
  visualScale = 1,
}: Props) {
  const safeMockup = typeof mockup === "string" && mockup.trim() ? mockup : "";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 mx-auto aspect-square w-full max-w-full select-none"
      style={{
        transform: `scale(${Number.isFinite(visualScale) ? visualScale : 1})`,
        transformOrigin: "center center",
      }}
    >
      {safeMockup && (
        <img
          src={safeMockup}
          alt={`${mockupId}-${currentSide}`}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover drop-shadow-[0_35px_45px_rgba(0,0,0,0.35)]"
        />
      )}

      {safeMockup && (
        <div
          key={`mockup-tint-${currentSide}-${color}`}
          className="absolute inset-0 opacity-80 mix-blend-multiply"
          style={{
            backgroundColor: color,
            WebkitMaskImage: `url(${safeMockup})`,
            maskImage: `url(${safeMockup})`,
            WebkitMaskSize: "cover",
            maskSize: "cover",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
          }}
        />
      )}
    </div>
  );
}

export default memo(CanvasMockup);
