"use client";

import { useEffect, useState, useCallback } from "react";
import { getQualityLevel } from "../engine/dpi";
import type { DpiQuality } from "../engine/printQuality";

interface DPIBadgeProps {
  element: any;
  printBox?: { width: number; height: number };
  gelatoPrintSize?: { widthMm: number; heightMm: number };
}

export default function DPIBadge({
  element,
  printBox,
  gelatoPrintSize,
}: DPIBadgeProps) {
  const [dpi, setDpi] = useState<number | null>(null);
  const [quality, setQuality] = useState<DpiQuality | null>(null);
  const [naturalDimensions, setNaturalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const isVector = Boolean(
    element?.meta?.isVector ||
    String(element?.src || "").startsWith("data:image/svg") ||
    String(element?.src || "").endsWith(".svg"),
  );

  const MM_PER_INCH = 25.4;

  const loadNaturalDimensions = useCallback(
    (src: string): Promise<{ width: number; height: number }> => {
      return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () =>
          resolve({
            width: img.naturalWidth,
            height: img.naturalHeight,
          });

        img.onerror = reject;
        img.src = src;
      });
    },
    []
  );

  useEffect(() => {
    if (!element || element.type !== "image" || isVector) return;

    if (element.meta?.naturalWidth && element.meta?.naturalHeight) {
      setNaturalDimensions({
        width: element.meta.naturalWidth,
        height: element.meta.naturalHeight,
      });
      return;
    }

    if (element.src && !naturalDimensions && !loading) {
      setLoading(true);

      loadNaturalDimensions(element.src)
        .then((dims) => {
          setNaturalDimensions(dims);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [element, isVector, naturalDimensions, loading, loadNaturalDimensions]);

  const calculateGelatoDPI = useCallback(() => {
    if (
      !naturalDimensions ||
      !element?.width ||
      !printBox?.width ||
      !gelatoPrintSize?.widthMm
    ) {
      return null;
    }

    const printBoxWidthPx = printBox.width;
    const productPrintWidthMm = gelatoPrintSize.widthMm;
    const imageRatio = element.width / printBoxWidthPx;
    const imagePrintWidthMm = productPrintWidthMm * imageRatio;
    const imagePrintWidthInches = imagePrintWidthMm / MM_PER_INCH;

    if (!imagePrintWidthInches || imagePrintWidthInches <= 0) {
      return null;
    }

    return Math.round(naturalDimensions.width / imagePrintWidthInches);
  }, [naturalDimensions, element?.width, printBox?.width, gelatoPrintSize?.widthMm]);

  useEffect(() => {
    const calculatedDpi = calculateGelatoDPI();

    if (calculatedDpi !== null) {
      const calculatedQuality = getQualityLevel(calculatedDpi);

      setDpi(calculatedDpi);
      setQuality(calculatedQuality);
      return;
    }

    setDpi(null);
    setQuality(null);
  }, [calculateGelatoDPI]);

  if (isVector) {
    return <div className="absolute left-1 top-1 z-30 rounded-md bg-green-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-md" title="Vector artwork; rasterized only in the final 300 DPI production PNG.">Vector</div>;
  }

  if (loading || !dpi || !quality) return null;

  const getColor = () => {
    switch (quality) {
      case "excellent":
      case "vector":
        return "bg-green-500/90 text-white";

      case "good":
        return "bg-yellow-500/90 text-black";

      case "risk":
        return "bg-orange-500/90 text-white";

      case "poor":
        return "bg-red-500/90 text-white";

      case "unknown":
      default:
        return "bg-gray-500/90 text-white";
    }
  };

  const getTitle = () => {
    switch (quality) {
      case "excellent":
      case "vector":
        return "Excelente para impressão";

      case "good":
        return "Boa qualidade";

      case "risk":
        return "Qualidade em risco";

      case "poor":
        return "Baixa qualidade";

      case "unknown":
      default:
        return "Qualidade desconhecida";
    }
  };

  return (
    <div
      className={`absolute left-1 top-1 z-30 rounded-md px-1.5 py-0.5 text-[10px] font-bold shadow-md ${getColor()}`}
      title={`DPI: ${dpi} - ${getTitle()}`}
    >
      {dpi} DPI
    </div>
  );
}
