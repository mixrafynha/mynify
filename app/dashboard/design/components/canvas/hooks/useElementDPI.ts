"use client";

import { useEffect, useState } from "react";
import { calculateDPI, getQualityLevel, getRecommendedPrintSize } from "../engine/dpi";

export interface DPIInfo {
  dpi: number | null;
  isVector?: boolean;
  quality: "excellent" | "good" | "poor" | "unknown";
  recommendedWidthCm: number;
  recommendedHeightCm: number;
}

export function useElementDPI(element: any) {
  const [dpiInfo, setDpiInfo] = useState<DPIInfo | null>(null);

  useEffect(() => {
    const vector = Boolean(
      element?.meta?.isVector ||
      element?.meta?.svg ||
      (element?.type === "sticker-element" && (element?.svg || element?.value)),
    );

    if (vector) {
      setDpiInfo({
        dpi: null,
        isVector: true,
        quality: "excellent",
        recommendedWidthCm: 0,
        recommendedHeightCm: 0,
      });
      return;
    }

    if (!element || (element.type !== "image" && element.type !== "sticker-element")) {
      setDpiInfo(null);
      return;
    }

    const naturalWidth = Number(element.meta?.naturalWidth || 0);
    const naturalHeight = Number(element.meta?.naturalHeight || 0);
    const currentWidth = Number(element.width || 0);

    if (currentWidth > 0 && naturalWidth > 0 && naturalHeight > 0) {
      const dpi = calculateDPI(naturalWidth, currentWidth);
      const recommended = getRecommendedPrintSize(naturalWidth, naturalHeight);
      setDpiInfo({
        dpi,
        isVector: false,
        quality: getQualityLevel(dpi),
        recommendedWidthCm: Math.round(recommended.widthCm * 10) / 10,
        recommendedHeightCm: Math.round(recommended.heightCm * 10) / 10,
      });
      return;
    }

    setDpiInfo(null);
  }, [element]);

  return dpiInfo;
}
