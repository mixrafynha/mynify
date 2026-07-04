import { getGelatoPrintSizeMm, type ProductDisplayConfig } from "../../canvas/productConfig";
import type { EditorSide } from "../types";

type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ProductionElement = Record<string, unknown> & {
  id?: string;
  type?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  text?: string;
  content?: string;
  src?: string;
  color?: string;
  fill?: string;
  fontSize?: number;
  meta?: Record<string, unknown>;
};

export type ProductionIssueSeverity = "info" | "warning" | "error";

export type ProductionIssue = {
  code: string;
  severity: ProductionIssueSeverity;
  message: string;
  elementId?: string;
  side?: EditorSide;
};

export type ProductionQualityStatus = "ready" | "review" | "blocked";

const MIN_IMAGE_DPI = 150;
const GOOD_IMAGE_DPI = 300;
const MIN_TEXT_HEIGHT_MM = 5;
const MIN_LINE_WIDTH_MM = 1;
const MIN_OPACITY = 0.15;
const WHITE = "#ffffff";
const BLACK = "#000000";

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeHex(value: unknown) {
  if (typeof value !== "string") return null;
  const raw = value.trim().toLowerCase();

  if (/^#[0-9a-f]{6}$/.test(raw)) return raw;

  if (/^#[0-9a-f]{3}$/.test(raw)) {
    const chars = raw.slice(1).split("");
    return `#${chars.map((char) => `${char}${char}`).join("")}`;
  }

  return null;
}

function getElementColor(element: ProductionElement) {
  return (
    normalizeHex(element.color) ||
    normalizeHex(element.fill) ||
    normalizeHex(element.meta?.color) ||
    normalizeHex(element.meta?.fill) ||
    normalizeHex(element.meta?.strokeColor)
  );
}

function getElementOpacity(element: ProductionElement) {
  return asNumber(element.opacity ?? element.meta?.opacity, 1);
}

function getNaturalImageSize(element: ProductionElement) {
  const meta = element.meta || {};

  return {
    width: asNumber(
      meta.naturalWidth ?? meta.originalWidth ?? meta.widthPx ?? meta.sourceWidth,
      0,
    ),
    height: asNumber(
      meta.naturalHeight ?? meta.originalHeight ?? meta.heightPx ?? meta.sourceHeight,
      0,
    ),
  };
}

function elementIntersectsBox(element: ProductionElement, box: Box) {
  const x = asNumber(element.x);
  const y = asNumber(element.y);
  const width = Math.max(1, asNumber(element.width, 1));
  const height = Math.max(1, asNumber(element.height, 1));

  return x < box.width && x + width > 0 && y < box.height && y + height > 0;
}

function elementOverflowsBox(element: ProductionElement, box: Box) {
  const x = asNumber(element.x);
  const y = asNumber(element.y);
  const width = Math.max(1, asNumber(element.width, 1));
  const height = Math.max(1, asNumber(element.height, 1));

  return x < 0 || y < 0 || x + width > box.width || y + height > box.height;
}

function getSidePrintSizeMm(category: string, side: EditorSide, productConfig?: ProductDisplayConfig | null) {
  return getGelatoPrintSizeMm(category, side, productConfig);
}

function pxToMm(valuePx: number, axisPx: number, axisMm: number) {
  if (!axisPx || !axisMm) return 0;
  return (valuePx / axisPx) * axisMm;
}

function calculateImageDpi(element: ProductionElement, safeArea: Box, printSizeMm: { widthMm: number; heightMm: number }) {
  const natural = getNaturalImageSize(element);
  const widthPx = Math.max(1, asNumber(element.width, 1));
  const heightPx = Math.max(1, asNumber(element.height, 1));

  if (!natural.width || !natural.height) return null;

  const printWidthIn = pxToMm(widthPx, safeArea.width, printSizeMm.widthMm) / 25.4;
  const printHeightIn = pxToMm(heightPx, safeArea.height, printSizeMm.heightMm) / 25.4;

  if (!printWidthIn || !printHeightIn) return null;

  const dpiX = natural.width / printWidthIn;
  const dpiY = natural.height / printHeightIn;
  const dpi = Math.floor(Math.min(dpiX, dpiY));

  return Number.isFinite(dpi) ? dpi : null;
}

export function buildProductionQualityReport(args: {
  category: string;
  side: EditorSide;
  elements: ProductionElement[];
  safeArea: Box;
  mockupColor?: string;
  productConfig?: ProductDisplayConfig | null;
}) {
  const issues: ProductionIssue[] = [];
  const printSize = getSidePrintSizeMm(args.category, args.side, args.productConfig);
  const garmentColor = normalizeHex(args.mockupColor) || WHITE;

  args.elements.forEach((element) => {
    const elementId = typeof element.id === "string" ? element.id : undefined;
    const type = String(element.type || "");
    const color = getElementColor(element);
    const opacity = getElementOpacity(element);

    if (!elementIntersectsBox(element, args.safeArea)) {
      issues.push({
        code: "outside_print_area",
        severity: "error",
        side: args.side,
        elementId,
        message: "Element is completely outside the printable area and will not be produced.",
      });
    } else if (elementOverflowsBox(element, args.safeArea)) {
      issues.push({
        code: "partially_outside_print_area",
        severity: "warning",
        side: args.side,
        elementId,
        message: "Element is partially outside the printable area and may be clipped on production export.",
      });
    }

    if (opacity > 0 && opacity < MIN_OPACITY) {
      issues.push({
        code: "low_opacity",
        severity: "warning",
        side: args.side,
        elementId,
        message: "Very low opacity can disappear or look dirty when printed.",
      });
    }

    if (color && color === garmentColor) {
      issues.push({
        code: "same_color_as_product",
        severity: "warning",
        side: args.side,
        elementId,
        message: "Design color is too close to the product color and may disappear.",
      });
    }

    if (color === WHITE && garmentColor === WHITE) {
      issues.push({
        code: "white_on_white",
        severity: "warning",
        side: args.side,
        elementId,
        message: "White artwork on a white product will have very low visibility.",
      });
    }

    if (color === BLACK && garmentColor === BLACK) {
      issues.push({
        code: "black_on_black",
        severity: "warning",
        side: args.side,
        elementId,
        message: "Black artwork on a black product will have very low visibility.",
      });
    }

    if (type === "image") {
      const dpi = calculateImageDpi(element, args.safeArea, printSize);

      if (dpi !== null && dpi < MIN_IMAGE_DPI) {
        issues.push({
          code: "low_image_dpi",
          severity: "error",
          side: args.side,
          elementId,
          message: `Image resolution is too low for production: ${dpi} DPI. Use at least ${MIN_IMAGE_DPI} DPI, ideally ${GOOD_IMAGE_DPI} DPI.`,
        });
      } else if (dpi !== null && dpi < GOOD_IMAGE_DPI) {
        issues.push({
          code: "medium_image_dpi",
          severity: "warning",
          side: args.side,
          elementId,
          message: `Image resolution is acceptable but not ideal: ${dpi} DPI. ${GOOD_IMAGE_DPI} DPI is recommended for sharper print.`,
        });
      } else if (dpi === null && element.src) {
        issues.push({
          code: "unknown_image_dpi",
          severity: "warning",
          side: args.side,
          elementId,
          message: "Image DPI could not be verified because original image dimensions are missing.",
        });
      }
    }

    if (type === "text") {
      const heightMm = pxToMm(
        Math.max(1, asNumber(element.height, asNumber(element.fontSize ?? element.meta?.fontSize, 40))),
        args.safeArea.height,
        printSize.heightMm,
      );

      if (heightMm < MIN_TEXT_HEIGHT_MM) {
        issues.push({
          code: "small_text",
          severity: "warning",
          side: args.side,
          elementId,
          message: "Text may be too small to read clearly after printing.",
        });
      }
    }

    const strokeWidthPx = asNumber(element.meta?.strokeWidth, 0);
    if (strokeWidthPx > 0) {
      const strokeWidthMm = pxToMm(strokeWidthPx, args.safeArea.width, printSize.widthMm);

      if (strokeWidthMm < MIN_LINE_WIDTH_MM) {
        issues.push({
          code: "thin_line",
          severity: "warning",
          side: args.side,
          elementId,
          message: "Very thin lines can break, fade or disappear in textile printing.",
        });
      }
    }
  });

  const hasError = issues.some((issue) => issue.severity === "error");
  const hasWarning = issues.some((issue) => issue.severity === "warning");

  return {
    status: (hasError ? "blocked" : hasWarning ? "review" : "ready") as ProductionQualityStatus,
    printReady: !hasError,
    minImageDpi: MIN_IMAGE_DPI,
    recommendedImageDpi: GOOD_IMAGE_DPI,
    transparentBackgroundRequired: true,
    preferredFormat: "png-rgba",
    issues,
  };
}

export function buildProductionRules() {
  return {
    saveEditableJson: true,
    keepOriginalAssets: true,
    preserveTransparentBackground: true,
    productionExportFormat: "png-rgba",
    previewIsNotProductionFile: true,
    flattenOnlyOnOrder: true,
    avoid: {
      jpegForProduction: true,
      whiteBackground: true,
      rasterizedTextInDatabase: true,
      lowOpacityBelow: MIN_OPACITY,
      imageDpiBelow: MIN_IMAGE_DPI,
      textBelowMm: MIN_TEXT_HEIGHT_MM,
      lineBelowMm: MIN_LINE_WIDTH_MM,
      sameColorAsProduct: true,
      whiteOnWhite: true,
      blackOnBlack: true,
    },
  };
}
