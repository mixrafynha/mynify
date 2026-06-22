"use client";

import { useMemo } from "react";
import { analyzeElementPrintQuality } from "../engine/printQuality";

export interface DPIInfo {
  dpi: number | null;
  quality: "excellent" | "good" | "risk" | "poor" | "vector" | "unknown";
  recommendedWidthCm?: number;
  recommendedHeightCm?: number;
  physicalWidthMm?: number;
  physicalHeightMm?: number;
}

export function useElementDPI(
  element: any,
  safeArea?: { width: number; height: number },
  printSize?: { widthMm: number; heightMm: number }
): DPIInfo | null {
  return useMemo(() => {
    if (!element || !safeArea?.width || !safeArea?.height || !printSize?.widthMm || !printSize?.heightMm) return null;
    const quality = analyzeElementPrintQuality(element, safeArea, printSize);
    return {
      dpi: quality.dpi,
      quality: quality.quality,
      physicalWidthMm: quality.physicalWidthMm,
      physicalHeightMm: quality.physicalHeightMm,
    };
  }, [element, safeArea, printSize]);
}
