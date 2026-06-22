"use client";

type Props = {
  box: {
    x: number;
    y: number;
    w: number;
    h: number;
  } | null;
};

export default function SelectionBox({
  box,
}: Props) {
  if (!box) return null;

  return (
    <div
      className="
        pointer-events-none
        absolute
        z-[999]
        border
        border-violet-500
        bg-violet-500/10
      "
      style={{
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
      }}
    />
  );
}