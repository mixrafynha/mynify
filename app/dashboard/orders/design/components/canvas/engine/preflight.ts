// canvas/engine/preflight.ts

import { calculateDPI } from "./dpi";
import { getElementSize, getOverflowAmount } from "../canvasMath";

export type WarningType =
  | "LOW_DPI"
  | "OUTSIDE_SAFE_AREA"
  | "TEXT_TOO_SMALL"
  | "TEXT_OVERFLOW";

export interface WarningItem {
  type: WarningType;
  severity: "warning" | "error";
  message: string;
}

interface SafeArea {
  x?: number;
  y?: number;
  width: number;
  height: number;
}

interface CanvasElement {
  id: string;
  type: "image" | "text" | "shape";
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  content?: string;
  meta?: Record<string, any>;
}

export function validateElement(element: CanvasElement, safeArea: SafeArea): WarningItem[] {
  const warnings: WarningItem[] = [];
  const size = getElementSize(element);

  if (element.type === "image" && element.meta?.naturalWidth && size.width) {
    const dpi = calculateDPI(element.meta.naturalWidth, size.width);
    if (dpi < 150) {
      warnings.push({
        type: "LOW_DPI",
        severity: "warning",
        message: `Low image quality (${dpi} DPI)`,
      });
    }
  }

  const overflow = getOverflowAmount(element, safeArea);
  const outsideSafeArea = overflow.left || overflow.top || overflow.right || overflow.bottom;

  if (outsideSafeArea) {
    warnings.push({
      type: "OUTSIDE_SAFE_AREA",
      severity: "warning",
      message: "Element outside safe area",
    });
  }

  if (element.type === "text" && Number(element.meta?.fontSize) < 12) {
    warnings.push({
      type: "TEXT_TOO_SMALL",
      severity: "warning",
      message: "Text may be unreadable when printed",
    });
  }

  return warnings;
}
