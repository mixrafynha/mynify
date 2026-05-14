"use client";

type PrintBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type SafeAreaProps = {
  printBox: PrintBox;
  selected?: boolean;
};

export default function SafeArea({
  printBox,
  selected = true,
}: SafeAreaProps) {
  // padding visual mínimo
  const padding = 0.5;

  return (
    <div
      className="pointer-events-none absolute z-30"
      style={{
        left: `${printBox.x + padding}px`,
        top: `${printBox.y + padding}px`,

        width: `${printBox.width - padding * 2}px`,
        height: `${printBox.height - padding * 2}px`,

        boxSizing: "border-box",

        border: selected
          ? "1px solid rgba(185,185,185,0.92)"
          : "1px solid rgba(185,185,185,0.45)",

        background: "transparent",

        borderRadius: 0,

        opacity: 1,

        transform: "translateZ(0)",

        willChange: "transform",
      }}
    />
  );
}