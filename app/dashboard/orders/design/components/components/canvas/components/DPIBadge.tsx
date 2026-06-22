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
  if (!dpi) return "DPI —";
  if (quality === "vector" || ["shape", "svg", "qr", "barcode"].includes(type)) return "VECTOR";
  if (type === "text") return `${dpi} DPI`;
  return `${dpi} DPI`;
}

function qualityLabel(quality: string) {
  if (quality === "vector") return "OK";
  if (quality === "excellent") return "EXCELLENT";
  if (quality === "good") return "GOOD";
  if (quality === "risk") return "RISK";
  if (quality === "poor") return "LOW";
  return "CHECK";
}

function DPIBadge({ element, printBox, gelatoPrintSize }: DPIBadgeProps) {
  const analysis = useMemo(() => {
    if (!element || !printBox || !gelatoPrintSize) return null;
    return analyzeElementPrintQuality(element, printBox, gelatoPrintSize);
  }, [element, printBox, gelatoPrintSize]);

  if (!analysis?.dpi) return null;

  const label = labelFor(element, analysis.dpi, analysis.quality);
  const status = qualityLabel(analysis.quality);

  return (
    <div
      className={`pointer-events-none absolute left-1 top-1 z-[80] rounded-md border px-1.5 py-0.5 text-[9px] font-black leading-none shadow-sm ${tone(analysis.quality)}`}
      title={`${label} • ${status} • ${analysis.physicalWidthMm}×${analysis.physicalHeightMm}mm`}
    >
      {label} <span className="font-extrabold opacity-80">{status}</span>
    </div>
  );
}

export default memo(DPIBadge);
