"use client";

import { useId } from "react";
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
  const filterId = `mockup-tint-${useId().replace(/:/g, "")}`;
  const normalizedColor = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(
    String(color).trim(),
  )
    ? String(color).trim().toLowerCase()
    : "#ffffff";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 mx-auto aspect-square w-full max-w-full select-none"
      style={{
        transform: `scale(${visualScale})`,
        transformOrigin: "center center",
      }}
    >
      {tint && (
        <svg aria-hidden="true" className="absolute h-0 w-0">
          <defs>
            <filter
              id={filterId}
              x="-10%"
              y="-10%"
              width="120%"
              height="120%"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodColor={normalizedColor} result="tintColor" />
              <feComposite
                in="tintColor"
                in2="SourceAlpha"
                operator="in"
                result="coloredShape"
              />
              <feBlend
                in="SourceGraphic"
                in2="coloredShape"
                mode="multiply"
              />
            </filter>
          </defs>
        </svg>
      )}

      <img
        src={mockup}
        alt={`${mockupId}-${currentSide}`}
        draggable={false}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover md:drop-shadow-[0_35px_45px_rgba(0,0,0,0.35)]"
        style={{
          imageRendering: "auto",
          filter: tint ? `url(#${filterId})` : undefined,
        }}
      />
    </div>
  );
}
