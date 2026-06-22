import { TARGET_PRINT_DPI, calculateDPI } from "./dpi";
import { getElementSize, getOverflowAmount } from "../canvasMath";

export type PrintSeverity = "ready" | "good" | "warning" | "error";
export type PrintWarningType =
  | "PRINT_READY"
  | "GOOD"
  | "LOW_QUALITY"
  | "OUTSIDE_PRINT_AREA"
  | "LOW_DPI"
  | "TRANSPARENT_ISSUES"
  | "EXPORT_RISK"
  | "TEXT_TOO_SMALL";

export type PrintWarning = {
  id: string;
  type: PrintWarningType;
  severity: Exclude<PrintSeverity, "ready">;
  label: string;
  message: string;
  elementId?: string;
};

export type PrintDiagnostics = {
  status: "Print Ready" | "Good" | "Low Quality" | "Export Risk";
  severity: PrintSeverity;
  score: number;
  warnings: PrintWarning[];
  warningCount: number;
  minDpi: number | null;
  resolution: string;
  exportSize: string;
  layerCount: number;
};

const DEFAULT_EXPORT_SIZE = 1024;

function finite(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function hasTransparentRisk(element: any) {
  if (element.type !== "image") return false;
  const src = String(element.src || element.previewUrl || element.printUrl || "").toLowerCase();
  const name = String(element.meta?.fileName || element.meta?.name || "").toLowerCase();
  const mime = String(element.meta?.mimeType || "").toLowerCase();
  return (src.includes("jpg") || src.includes("jpeg") || name.endsWith(".jpg") || name.endsWith(".jpeg") || mime === "image/jpeg") && element.meta?.requiresTransparency;
}

export function getPrintDiagnostics(elements: any[] = [], safeArea: any, exportSize = DEFAULT_EXPORT_SIZE): PrintDiagnostics {
  const warnings: PrintWarning[] = [];
  let minDpi: number | null = null;

  for (const element of Array.isArray(elements) ? elements : []) {
    const size = getElementSize(element);
    const elementId = String(element.id || crypto.randomUUID?.() || Math.random());

    if (["text", "shape", "svg", "qr", "barcode"].includes(String(element.type || ""))) {
      minDpi = minDpi === null ? TARGET_PRINT_DPI : Math.min(minDpi, TARGET_PRINT_DPI);
    }

    if (["image", "logo", "sticker", "template"].includes(String(element.type || ""))) {
      const naturalWidth = finite(element.meta?.naturalWidth ?? element.meta?.originalWidth, 0);
      const width = finite(size.width ?? element.width, 0);

      if (naturalWidth > 0 && width > 0) {
        const dpi = calculateDPI(naturalWidth, width);
        minDpi = minDpi === null ? dpi : Math.min(minDpi, dpi);

        if (dpi < 200) {
          warnings.push({
            id: `${elementId}:LOW_DPI`,
            type: "LOW_DPI",
            severity: "error",
            label: "Low DPI",
            message: `${dpi} DPI. Use a larger source image for production print.`,
            elementId,
          });
        } else if (dpi < 300) {
          warnings.push({
            id: `${elementId}:LOW_QUALITY`,
            type: "LOW_QUALITY",
            severity: "warning",
            label: "Low Quality",
            message: `${dpi} DPI. Acceptable, but 400 DPI is ideal for premium print.`,
            elementId,
          });
        }
      } else {
        warnings.push({
          id: `${elementId}:EXPORT_RISK`,
          type: "EXPORT_RISK",
          severity: "warning",
          label: "Export Risk",
          message: "Image source resolution is unknown.",
          elementId,
        });
      }

      if (hasTransparentRisk(element)) {
        warnings.push({
          id: `${elementId}:TRANSPARENT_ISSUES`,
          type: "TRANSPARENT_ISSUES",
          severity: "warning",
          label: "Transparent Issues",
          message: "JPG files cannot keep transparent backgrounds.",
          elementId,
        });
      }
    }

    if (element.type === "text") {
      const fontSize = finite(element.meta?.fontSize ?? element.fontSize, 16);
      if (fontSize < 12) {
        warnings.push({
          id: `${elementId}:TEXT_TOO_SMALL`,
          type: "TEXT_TOO_SMALL",
          severity: "warning",
          label: "Low Quality",
          message: "Small text may be unreadable after printing.",
          elementId,
        });
      }
    }

    const overflow = getOverflowAmount(element, safeArea);
    if (overflow.left || overflow.top || overflow.right || overflow.bottom) {
      warnings.push({
        id: `${elementId}:OUTSIDE_PRINT_AREA`,
        type: "OUTSIDE_PRINT_AREA",
        severity: "error",
        label: "Outside Print Area",
        message: "Move or resize this layer inside the print area.",
        elementId,
      });
    }
  }

  const errors = warnings.filter((w) => w.severity === "error").length;
  const warns = warnings.length - errors;
  const score = Math.max(0, 100 - errors * 34 - warns * 14);
  const severity: PrintSeverity = errors ? "error" : warns ? "warning" : elements.length ? "ready" : "good";
  const status = errors ? "Export Risk" : warns ? "Good" : elements.length ? "Print Ready" : "Good";

  return {
    status,
    severity,
    score,
    warnings,
    warningCount: warnings.length,
    minDpi,
    resolution: `${exportSize} × ${exportSize}px`,
    exportSize: `${exportSize}px PNG`,
    layerCount: Array.isArray(elements) ? elements.length : 0,
  };
}
