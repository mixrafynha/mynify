"use client";

import { useMemo } from "react";
import { getElementSize, getOverflowAmount } from "../canvasMath";
import { analyzeElementPrintQuality } from "../engine/printQuality";

export interface WarningItem {
  id: string;
  type: "LOW_DPI" | "OUTSIDE_SAFE_AREA" | "TEXT_TOO_SMALL" | "TEXT_OVERFLOW" | "UNKNOWN_DPI";
  severity: "warning" | "error";
  message: string;
  elementId: string;
  dpi?: number | null;
}

type SafeArea = { width: number; height: number };
type PrintSize = { widthMm: number; heightMm: number };

function elementLabel(element: any) {
  const type = String(element?.type || "element");
  if (type === "text") return "Text";
  if (type === "logo") return "Logo";
  if (type === "sticker") return "Sticker";
  if (type === "template") return "Template";
  if (type === "shape") return "Shape";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function useCanvasWarnings(elements: any[], safeArea: SafeArea, printSize?: PrintSize) {
  return useMemo(() => {
    const list = Array.isArray(elements) ? elements : [];
    const warnings: WarningItem[] = [];

    list.forEach((element) => {
      const size = getElementSize(element);
      const dpi = analyzeElementPrintQuality(element, safeArea, printSize);
      const label = elementLabel(element);

      if (dpi.quality === "vector" || dpi.quality === "excellent") {
        // Text, shapes, SVGs, QR codes and other vector-like elements scale cleanly for print.
      } else if (dpi.quality === "poor") {
        warnings.push({
          id: `${element.id}-LOW_DPI`,
          type: "LOW_DPI",
          severity: "error",
          message: `${label}: ${dpi.dpi} DPI is too low. Use a higher resolution asset or reduce its size before production.`,
          elementId: element.id,
          dpi: dpi.dpi,
        });
      } else if (dpi.quality === "risk") {
        warnings.push({
          id: `${element.id}-LOW_DPI`,
          type: "LOW_DPI",
          severity: "warning",
          message: `${label}: ${dpi.dpi} DPI is risky. 300+ DPI is safer, 400+ DPI is ideal.`,
          elementId: element.id,
          dpi: dpi.dpi,
        });
      } else if (dpi.quality === "good") {
        warnings.push({
          id: `${element.id}-LOW_DPI`,
          type: "LOW_DPI",
          severity: "warning",
          message: `${label}: ${dpi.dpi} DPI is good, but 400+ DPI is ideal for premium print quality.`,
          elementId: element.id,
          dpi: dpi.dpi,
        });
      } else if (dpi.quality === "unknown" && !["text", "shape", "svg", "qr", "barcode"].includes(String(element?.type || ""))) {
        warnings.push({
          id: `${element.id}-UNKNOWN_DPI`,
          type: "UNKNOWN_DPI",
          severity: "warning",
          message: `${label}: source resolution is unknown, so print DPI cannot be verified.`,
          elementId: element.id,
          dpi: null,
        });
      }

      const overflow = getOverflowAmount(element, safeArea);
      const outsideSafeArea = overflow.left || overflow.top || overflow.right || overflow.bottom;

      if (outsideSafeArea) {
        warnings.push({
          id: `${element.id}-OUTSIDE_SAFE_AREA`,
          type: "OUTSIDE_SAFE_AREA",
          severity: "warning",
          message: `${label} is outside the editable print area.`,
          elementId: element.id,
        });
      }

      const fontSize = Number(element?.meta?.fontSize || element?.fontSize || 0);
      if (element?.type === "text" && fontSize > 0 && fontSize < 12) {
        warnings.push({
          id: `${element.id}-TEXT_TOO_SMALL`,
          type: "TEXT_TOO_SMALL",
          severity: "warning",
          message: "Text may be too small to print clearly.",
          elementId: element.id,
        });
      }

      if (element?.type === "text" && (size.width <= 4 || size.height <= 4)) {
        warnings.push({
          id: `${element.id}-TEXT_OVERFLOW`,
          type: "TEXT_OVERFLOW",
          severity: "warning",
          message: "Text box is too small for reliable production preview.",
          elementId: element.id,
        });
      }
    });

    const warningCount = warnings.length;
    const hasError = warnings.some((warning) => warning.severity === "error");
    const quality: "Excellent" | "Good" | "Poor" = warningCount === 0 ? "Excellent" : hasError ? "Poor" : "Good";

    return { warnings, warningCount, quality };
  }, [elements, safeArea, printSize]);
}
