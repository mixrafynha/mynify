"use client";

import { useEffect, useRef } from "react";
import type { CanvasSide } from "./types";

type Props = {
  mockup: string;
  mockupId: string;
  currentSide: CanvasSide;
  color?: string;
  visualScale?: number;
  tint?: boolean;
};

export default function CanvasMockup({
  mockup,
  mockupId,
  currentSide,
  color = "#ffffff",
  visualScale = 1,
  tint = true,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const normalizedColor = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(String(color).trim())
    ? String(color).trim().toLowerCase()
    : "#ffffff";

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    node.style.opacity = "0.999";
    const frame = requestAnimationFrame(() => {
      node.style.opacity = "1";
    });
    return () => cancelAnimationFrame(frame);
  }, [currentSide, mockup, normalizedColor, tint]);

  return (
    // Aplicamos o transform e o transformOrigin aqui, no container pai.
    // Assim, tudo o que for colocado dentro dele herdará a mesma escala.
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 z-0 mx-auto aspect-square w-full max-w-full select-none"
      style={{
        transform: `scale(${visualScale})`,
        transformOrigin: "center center",
      }}
    >
      <img
        key={`${currentSide}:${mockup}`}
        src={mockup}
        alt={`${mockupId}-${currentSide}`}
        draggable={false}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover md:drop-shadow-[0_35px_45px_rgba(0,0,0,0.35)]"
        style={{ imageRendering: "auto" }}
      />

      {tint && <div
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
        }}
      />}
    </div>
  );
}
