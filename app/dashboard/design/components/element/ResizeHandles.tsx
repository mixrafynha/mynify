"use client";

import { memo, useCallback, type CSSProperties } from "react";

export type Direction = "tl" | "tr" | "bl" | "br" | "t" | "r" | "b" | "l";

type Props = {
  resizeElement: (e: React.PointerEvent, direction: Direction) => void;
  isSelected?: boolean;
  size?: "small" | "medium" | "large";
  isMobile?: boolean;
  zoom?: number;
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
  visual: 20,
  hit: 44,
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
  zoom = 1,
}: Props) {
  const s = SIZE_MAP[size] || SIZE_MAP.medium;
  const safeZoom = Number.isFinite(Number(zoom)) && Number(zoom) > 0 ? Number(zoom) : 1;
  const mobileHitSize = MOBILE_HANDLE_STYLE.hit / safeZoom;
  const mobileVisualSize = MOBILE_HANDLE_STYLE.visual / safeZoom;
  const mobileHitStyle: CSSProperties | undefined = isMobile
    ? {
        width: mobileHitSize,
        height: mobileHitSize,
        margin: -mobileHitSize / 2,
        touchAction: "none",
      }
    : undefined;
  const mobileVisualStyle: CSSProperties | undefined = isMobile
    ? {
        width: mobileVisualSize,
        height: mobileVisualSize,
      }
    : undefined;
  const cornerSize = isMobile ? "" : s.corner;
  const sideHSize = isMobile ? "" : s.sideH;
  const sideVSize = isMobile ? "" : s.sideV;
  const cornerHit = isMobile ? "" : s.cornerOffset;
  const sideHit = isMobile ? "" : s.sideOffset;

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
      <span data-resize-handle="tl" onPointerDown={startResize("tl")} style={mobileHitStyle} className={`absolute left-0 top-0 z-50 ${isMobile ? "touch-none" : cornerHit}`}>
        <span style={mobileVisualStyle} className={`${cornerBase} ${cornerSize} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize`} />
      </span>
      <span data-resize-handle="tr" onPointerDown={startResize("tr")} style={mobileHitStyle} className={`absolute right-0 top-0 z-50 ${isMobile ? "touch-none" : cornerHit}`}>
        <span style={mobileVisualStyle} className={`${cornerBase} ${cornerSize} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-nesw-resize`} />
      </span>
      <span data-resize-handle="bl" onPointerDown={startResize("bl")} style={mobileHitStyle} className={`absolute bottom-0 left-0 z-50 ${isMobile ? "touch-none" : cornerHit}`}>
        <span style={mobileVisualStyle} className={`${cornerBase} ${cornerSize} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-nesw-resize`} />
      </span>
      <span data-resize-handle="br" onPointerDown={startResize("br")} style={mobileHitStyle} className={`absolute bottom-0 right-0 z-50 ${isMobile ? "touch-none" : cornerHit}`}>
        <span style={mobileVisualStyle} className={`${cornerBase} ${cornerSize} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize`} />
      </span>

      <span data-resize-handle="t" onPointerDown={startResize("t")} style={mobileHitStyle} className={`absolute left-1/2 top-0 z-50 -translate-x-1/2 ${isMobile ? "touch-none" : sideHit}`}>
        <span style={mobileVisualStyle} className={`${sideBase} ${sideHSize} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize`} />
      </span>
      <span data-resize-handle="b" onPointerDown={startResize("b")} style={mobileHitStyle} className={`absolute bottom-0 left-1/2 z-50 -translate-x-1/2 ${isMobile ? "touch-none" : sideHit}`}>
        <span style={mobileVisualStyle} className={`${sideBase} ${sideHSize} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize`} />
      </span>
      <span data-resize-handle="l" onPointerDown={startResize("l")} style={mobileHitStyle} className={`absolute left-0 top-1/2 z-50 -translate-y-1/2 ${isMobile ? "touch-none" : sideHit}`}>
        <span style={mobileVisualStyle} className={`${sideBase} ${sideVSize} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize`} />
      </span>
      <span data-resize-handle="r" onPointerDown={startResize("r")} style={mobileHitStyle} className={`absolute right-0 top-1/2 z-50 -translate-y-1/2 ${isMobile ? "touch-none" : sideHit}`}>
        <span style={mobileVisualStyle} className={`${sideBase} ${sideVSize} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize`} />
      </span>
    </>
  );
});

ResizeHandles.displayName = "ResizeHandles";

export default ResizeHandles;
