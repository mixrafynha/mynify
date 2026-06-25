"use client";

import { MOCKUP_AREA } from "./canvas/constants";

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

export default function SafeArea({ printBox, selected = false }: SafeAreaProps) {
  if (!selected) return null;

  const left = (printBox.x / MOCKUP_AREA.width) * 100;
  const top = (printBox.y / MOCKUP_AREA.height) * 100;
  const right = 100 - left - (printBox.width / MOCKUP_AREA.width) * 100;
  const bottom = 100 - top - (printBox.height / MOCKUP_AREA.height) * 100;

  return (
    <div
      data-editor-only="true"
      className="pointer-events-none absolute z-50"
      style={{
        inset: `${top}% ${right}% ${bottom}% ${left}%`,
        outline: "1px solid rgba(139, 92, 246, 0.65)",
        outlineOffset: "-0.5px",
      }}
    />
  );
}
