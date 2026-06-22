"use client";

import { memo, useCallback } from "react";

export type Direction = "tl" | "tr" | "bl" | "br" | "t" | "r" | "b" | "l";

type Props = {
  resizeElement: (e: React.PointerEvent, direction: Direction) => void;
  isSelected?: boolean;
  size?: "small" | "medium" | "large";
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
}: Props) {
  const s = SIZE_MAP[size] || SIZE_MAP.medium;

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
      <span
        data-resize-handle="tl"
        onPointerDown={startResize("tl")}
        className={`${cornerBase} ${s.corner} ${s.cornerOffset} left-0 top-0 cursor-nwse-resize`}
      />
      <span
        data-resize-handle="tr"
        onPointerDown={startResize("tr")}
        className={`${cornerBase} ${s.corner} ${s.cornerOffset} right-0 top-0 cursor-nesw-resize`}
      />
      <span
        data-resize-handle="bl"
        onPointerDown={startResize("bl")}
        className={`${cornerBase} ${s.corner} ${s.cornerOffset} bottom-0 left-0 cursor-nesw-resize`}
      />
      <span
        data-resize-handle="br"
        onPointerDown={startResize("br")}
        className={`${cornerBase} ${s.corner} ${s.cornerOffset} bottom-0 right-0 cursor-nwse-resize`}
      />

      <span
        data-resize-handle="t"
        onPointerDown={startResize("t")}
        className={`${sideBase} ${s.sideH} ${s.sideOffset} left-1/2 top-0 -translate-x-1/2 cursor-ns-resize`}
      />
      <span
        data-resize-handle="b"
        onPointerDown={startResize("b")}
        className={`${sideBase} ${s.sideH} ${s.sideOffset} bottom-0 left-1/2 -translate-x-1/2 cursor-ns-resize`}
      />
      <span
        data-resize-handle="l"
        onPointerDown={startResize("l")}
        className={`${sideBase} ${s.sideV} ${s.sideOffset} left-0 top-1/2 -translate-y-1/2 cursor-ew-resize`}
      />
      <span
        data-resize-handle="r"
        onPointerDown={startResize("r")}
        className={`${sideBase} ${s.sideV} ${s.sideOffset} right-0 top-1/2 -translate-y-1/2 cursor-ew-resize`}
      />
    </>
  );
});

ResizeHandles.displayName = "ResizeHandles";

export default ResizeHandles;
