"use client";

type Direction = "br" | "tr" | "bl" | "tl";

type Props = {
  resizeElement: (e: React.PointerEvent, direction: Direction) => void;
};

const handleClass =
  "pointer-events-auto absolute h-5 w-5 touch-none rounded-full border border-white/70 bg-violet-600 shadow-lg active:scale-110";

export default function ResizeHandles({ resizeElement }: Props) {
  return (
    <>
      <span
        onPointerDown={(e) => resizeElement(e, "tl")}
        className={`${handleClass} -left-3 -top-3 cursor-nwse-resize`}
      />

      <span
        onPointerDown={(e) => resizeElement(e, "tr")}
        className={`${handleClass} -right-3 -top-3 cursor-nesw-resize`}
      />

      <span
        onPointerDown={(e) => resizeElement(e, "bl")}
        className={`${handleClass} -bottom-3 -left-3 cursor-nesw-resize`}
      />

      <span
        onPointerDown={(e) => resizeElement(e, "br")}
        className={`${handleClass} -bottom-3 -right-3 cursor-nwse-resize`}
      />
    </>
  );
}