"use client";

import { useMemo } from "react";
import { getElementSize, getOverflowAmount } from "../canvasMath";
import { calculateElementDPI } from "../engine/dpi";

export interface WarningItem {
  id: string;
  type: "LOW_DPI" | "OUTSIDE_SAFE_AREA" | "TEXT_TOO_SMALL" | "TEXT_OVERFLOW";
  severity: "warning" | "error";
  message: string;
  elementId: string;
  dpi?: number | null;
}

type SafeArea = { width: number; height: number };
type PrintSize = { widthMm: number; heightMm: number };

function imageDpiForElement(element: any, safeArea: SafeArea, printSize?: PrintSize) {
  if (element?.type !== "image") return null;

  const size = getElementSize(element);
  const naturalWidth = Number(element?.meta?.naturalWidth || element?.naturalWidth || 0);
  const naturalHeight = Number(element?.meta?.naturalHeight || element?.naturalHeight || 0);

  if (!naturalWidth || !naturalHeight || !size.width || !size.height || !printSize?.widthMm || !printSize?.heightMm) {
    return null;
  }

  return calculateElementDPI({
    naturalWidth,
    naturalHeight,
    elementWidth: size.width,
    elementHeight: size.height,
    printBoxWidth: safeArea.width,
    printBoxHeight: safeArea.height,
    printWidthMm: printSize.widthMm,
    printHeightMm: printSize.heightMm,
  });
}

export function useCanvasWarnings(elements: any[], safeArea: SafeArea, printSize?: PrintSize) {
  return useMemo(() => {
    const list = Array.isArray(elements) ? elements : [];
    const warnings: WarningItem[] = [];

    list.forEach((element) => {
      const size = getElementSize(element);

      if (element?.type === "image") {
        const dpi = imageDpiForElement(element, safeArea, printSize);
        if (dpi?.dpi && dpi.dpi < 150) {
          warnings.push({
            id: `${element.id}-LOW_DPI`,
            type: "LOW_DPI",
            severity: "error",
            message: `Low DPI: ${dpi.dpi}. Use a higher resolution image or make it smaller before production.`,
            elementId: element.id,
            dpi: dpi.dpi,
          });
        } else if (dpi?.dpi && dpi.dpi < 250) {
          warnings.push({
            id: `${element.id}-LOW_DPI`,
            type: "LOW_DPI",
            severity: "warning",
            message: `Good but not ideal: ${dpi.dpi} DPI. 250+ DPI is safer for production.`,
            elementId: element.id,
            dpi: dpi.dpi,
          });
        }
      }

      const overflow = getOverflowAmount(element, safeArea);
      const outsideSafeArea = overflow.left || overflow.top || overflow.right || overflow.bottom;

      if (outsideSafeArea) {
        warnings.push({
          id: `${element.id}-OUTSIDE_SAFE_AREA`,
          type: "OUTSIDE_SAFE_AREA",
          severity: "warning",
          message: "Element is outside the editable print area.",
          elementId: element.id,
        });
      }

      if (element?.type === "text" && Number(element?.meta?.fontSize || 0) > 0 && Number(element?.meta?.fontSize || 0) < 12) {
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
