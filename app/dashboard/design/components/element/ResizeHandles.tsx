"use client";

import { memo, useCallback } from "react";

export type Direction = "tl" | "tr" | "bl" | "br" | "t" | "r" | "b" | "l";

type Props = {
  resizeElement: (e: React.PointerEvent, direction: Direction) => void;
  isSelected?: boolean;
  size?: "small" | "medium" | "large";
  isMobile?: boolean;
};

const SIZE_MAP = {
  small: {
    corner: "h-3 w-3",
    sideH: "h-2 w-7",
    sideV: "h-7 w-2",
    cornerOffset: "-m-1.5",
    sideOffset: "-m-1",
  },
  medium: {
    corner: "h-4 w-4",
    sideH: "h-2.5 w-9",
    sideV: "h-9 w-2.5",
    cornerOffset: "-m-2",
    sideOffset: "-m-1.5",
  },
  large: {
    corner: "h-6 w-6",
    sideH: "h-3 w-11",
    sideV: "h-11 w-3",
    cornerOffset: "-m-3",
    sideOffset: "-m-2",
  },
} as const;

const MOBILE_HANDLE_STYLE = {
  corner: "h-[18px] w-[18px]",
  sideH: "h-[18px] w-[18px]",
  sideV: "h-[18px] w-[18px]",
  cornerHit: "h-[44px] w-[44px] -m-[22px]",
  sideHit: "h-[44px] w-[44px] -m-[22px]",
} as const;

const cornerBase = `
  pointer-events-auto absolute z-50 rounded-full
  border-2 border-white bg-violet-600 shadow-lg
  transition-transform duration-100 hover:scale-110 active:scale-95
  touch-none select-none
`;

const sideBase = `
  pointer-events-auto absolute z-50 rounded-full
  border border-white bg-cyan-400 shadow-md
  transition-transform duration-100 hover:scale-110 active:scale-95
  touch-none select-none
`;

const ResizeHandles = memo(function ResizeHandles({
  resizeElement,
  isSelected = true,
  size = "medium",
  isMobile = false,
}: Props) {
  const s = SIZE_MAP[size] || SIZE_MAP.medium;
  const cornerSize = isMobile ? MOBILE_HANDLE_STYLE.corner : s.corner;
  const sideHSize = isMobile ? MOBILE_HANDLE_STYLE.sideH : s.sideH;
  const sideVSize = isMobile ? MOBILE_HANDLE_STYLE.sideV : s.sideV;
  const cornerHit = isMobile ? MOBILE_HANDLE_STYLE.cornerHit : s.cornerOffset;
  const sideHit = isMobile ? MOBILE_HANDLE_STYLE.sideHit : s.sideOffset;

  const startResize = useCallback(
    (direction: Direction) => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      resizeElement(e, direction);
    },
    [resizeElement]
  );

  if (!isSelected) return null;

  return (
    <>
      <span data-resize-handle="tl" onPointerDown={startResize("tl")} className={`absolute left-0 top-0 z-50 ${isMobile ? `${cornerHit} touch-none` : cornerHit}`}>
        <span className={`${cornerBase} ${cornerSize} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize`} />
      </span>
      <span data-resize-handle="tr" onPointerDown={startResize("tr")} className={`absolute right-0 top-0 z-50 ${isMobile ? `${cornerHit} touch-none` : cornerHit}`}>
        <span className={`${cornerBase} ${cornerSize} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-nesw-resize`} />
      </span>
      <span data-resize-handle="bl" onPointerDown={startResize("bl")} className={`absolute bottom-0 left-0 z-50 ${isMobile ? `${cornerHit} touch-none` : cornerHit}`}>
        <span className={`${cornerBase} ${cornerSize} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-nesw-resize`} />
      </span>
      <span data-resize-handle="br" onPointerDown={startResize("br")} className={`absolute bottom-0 right-0 z-50 ${isMobile ? `${cornerHit} touch-none` : cornerHit}`}>
        <span className={`${cornerBase} ${cornerSize} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize`} />
      </span>

      <span data-resize-handle="t" onPointerDown={startResize("t")} className={`absolute left-1/2 top-0 z-50 -translate-x-1/2 ${isMobile ? `${sideHit} touch-none` : sideHit}`}>
        <span className={`${sideBase} ${sideHSize} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize`} />
      </span>
      <span data-resize-handle="b" onPointerDown={startResize("b")} className={`absolute bottom-0 left-1/2 z-50 -translate-x-1/2 ${isMobile ? `${sideHit} touch-none` : sideHit}`}>
        <span className={`${sideBase} ${sideHSize} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize`} />
      </span>
      <span data-resize-handle="l" onPointerDown={startResize("l")} className={`absolute left-0 top-1/2 z-50 -translate-y-1/2 ${isMobile ? `${sideHit} touch-none` : sideHit}`}>
        <span className={`${sideBase} ${sideVSize} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize`} />
      </span>
      <span data-resize-handle="r" onPointerDown={startResize("r")} className={`absolute right-0 top-1/2 z-50 -translate-y-1/2 ${isMobile ? `${sideHit} touch-none` : sideHit}`}>
        <span className={`${sideBase} ${sideVSize} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize`} />
      </span>
    </>
  );
});

ResizeHandles.displayName = "ResizeHandles";

export default ResizeHandles;
