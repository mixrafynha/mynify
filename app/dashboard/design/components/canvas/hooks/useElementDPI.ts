"use client";

import { useState, useEffect } from "react";
import { calculateDPI, getQualityLevel, getRecommendedPrintSize } from "../engine/dpi";

export interface DPIInfo {
  dpi: number;
  quality: "excellent" | "good" | "poor" | "unknown";
  recommendedWidthCm: number;
  recommendedHeightCm: number;
}

export function useElementDPI(element: any) {
  const [dpiInfo, setDpiInfo] = useState<DPIInfo | null>(null);

  useEffect(() => {
    // Verifica se é imagem
    if (!element || element.type !== "image") {
      setDpiInfo(null);
      return;
    }

    // Pega as dimensões naturais do meta (já salvas pelo useUpload)
    const naturalWidth = element.meta?.naturalWidth;
    const naturalHeight = element.meta?.naturalHeight;
    const currentWidth = element.width;


    if (naturalWidth && naturalHeight && currentWidth) {
      const dpi = calculateDPI(naturalWidth, currentWidth);
      const quality = getQualityLevel(dpi);
      const recommended = getRecommendedPrintSize(naturalWidth, naturalHeight);


      setDpiInfo({
        dpi,
        quality,
        recommendedWidthCm: Math.round(recommended.widthCm * 10) / 10,
        recommendedHeightCm: Math.round(recommended.heightCm * 10) / 10,
      });
    } else {
      setDpiInfo(null);
    }
  }, [element]);

  return dpiInfo;
}
