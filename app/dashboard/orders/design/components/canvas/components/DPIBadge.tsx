"use client";

import { memo, useMemo } from "react";
import { analyzeElementPrintQuality } from "../engine/printQuality";

interface DPIBadgeProps {
  element: any;
  printBox?: { width: number; height: number };
  gelatoPrintSize?: { widthMm: number; heightMm: number };
}

function tone(quality: string) {
  if (quality === "excellent" || quality === "vector") return "border-emerald-400/25 bg-emerald-500/85 text-white";
  if (quality === "good") return "border-lime-300/25 bg-lime-500/85 text-black";
  if (quality === "risk") return "border-amber-300/30 bg-amber-400/90 text-black";
  if (quality === "poor") return "border-rose-300/30 bg-rose-500/90 text-white";
  return "border-white/15 bg-neutral-800/85 text-white";
}

function labelFor(element: any, dpi: number | null, quality: string) {
  const type = String(element?.type || "element").toLowerCase();
  const vector = ["text", "shape", "svg", "qr", "barcode"].includes(type) || quality === "vector";
  if (vector) return "VECTOR";
  if (!dpi) return "DPI —";
  if (type === "sticker") return `${dpi} DPI sticker`;
  if (type === "logo") return `${dpi} DPI logo`;
  return `${dpi} DPI`;
}

function DPIBadge({ element, printBox, gelatoPrintSize }: DPIBadgeProps) {
  const analysis = useMemo(() => {
    if (!element) return null;

    if (printBox && gelatoPrintSize) {
      return analyzeElementPrintQuality(element, printBox, gelatoPrintSize);
    }

    const dpi = Number(element?.meta?.effectiveDpi ?? element?.meta?.dpi ?? 0);
    if (Number.isFinite(dpi) && dpi > 0) {
      return {
        dpi: Math.round(dpi),
        quality: element?.meta?.dpiQuality || element?.meta?.quality || "unknown",
        physicalWidthMm: Number(element?.meta?.printWidthMm ?? element?.meta?.printWidth ?? 0),
        physicalHeightMm: Number(element?.meta?.printHeightMm ?? element?.meta?.printHeight ?? 0),
      };
    }

    return null;
  }, [element, printBox, gelatoPrintSize]);

  if (!analysis?.dpi && analysis?.quality !== "vector") return null;

  const label = labelFor(element, analysis.dpi, analysis.quality);

  return (
    <div
      className={`pointer-events-none absolute left-1 top-1 z-[80] rounded-md border px-1.5 py-0.5 text-[9px] font-black leading-none shadow-sm ${tone(analysis.quality)}`}
      title={`${label} • ${analysis.physicalWidthMm}×${analysis.physicalHeightMm}mm`}
    >
      {label}
    </div>
  );
}

export default memo(DPIBadge);
