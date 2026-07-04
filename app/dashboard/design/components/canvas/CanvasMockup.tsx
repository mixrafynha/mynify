"use client";

import { memo, useMemo, type CSSProperties } from "react";
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
  const normalizedColor = typeof color === "string" && color.trim() ? color.trim() : "#ffffff";
  const isWhite = /^#fff(?:fff)?$/i.test(normalizedColor);

  const maskStyle = useMemo<CSSProperties | undefined>(
    () =>
      safeMockup
        ? {
            backgroundColor: normalizedColor,
            WebkitMaskImage: `url(${safeMockup})`,
            maskImage: `url(${safeMockup})`,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskSize: "cover",
            maskSize: "cover",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }
        : undefined,
    [normalizedColor, safeMockup],
  );

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 isolate mx-auto aspect-square w-full max-w-full select-none"
      style={{
        transform: `scale(${Number.isFinite(visualScale) ? visualScale : 1})`,
        transformOrigin: "center center",
      }}
    >
      {safeMockup && !isWhite && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 opacity-95"
          style={maskStyle}
        />
      )}

      {safeMockup && (
        <img
          src={safeMockup}
          alt={`${mockupId}-${currentSide}`}
          draggable={false}
          className="absolute inset-0 z-10 h-full w-full object-cover drop-shadow-[0_35px_45px_rgba(0,0,0,0.35)]"
          style={{
            mixBlendMode: isWhite ? "normal" : "multiply",
            opacity: isWhite ? 1 : 0.84,
            transform: "translateZ(0)",
            WebkitTransform: "translateZ(0)",
          }}
        />
      )}

      {safeMockup && !isWhite && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-20 mix-blend-multiply"
          style={{ ...(maskStyle || {}), opacity: 0.72 }}
        />
      )}
    </div>
  );
}

export default memo(CanvasMockup);
