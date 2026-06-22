export type DPIQuality = "excellent" | "good" | "poor" | "unknown";

export interface DPIResult {
  dpi: number | null;
  quality: DPIQuality;
  recommendedWidthCm: number;
  recommendedHeightCm: number;
  physicalWidthMm?: number;
  physicalHeightMm?: number;
}

export const TARGET_PRINT_DPI = 300;
const PRINT_DPI = TARGET_PRINT_DPI;
const CM_PER_INCH = 2.54;
const MM_PER_INCH = 25.4;

function safeNumber(value: any, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function calculateDPI(naturalWidth: number, renderedWidth: number): number {
  const source = safeNumber(naturalWidth, 0);
  const rendered = safeNumber(renderedWidth, 0);
  if (source <= 0 || rendered <= 0) return 0;

  /**
   * Legacy fallback used by older components.
   * Kept for compatibility, but production checks should use calculateElementDPI().
   */
  return Math.round((source / rendered) * PRINT_DPI);
}

export function calculatePhysicalSizeMm({
  elementWidth,
  elementHeight,
  printBoxWidth,
  printBoxHeight,
  printWidthMm,
  printHeightMm,
}: {
  elementWidth: number;
  elementHeight: number;
  printBoxWidth: number;
  printBoxHeight: number;
  printWidthMm: number;
  printHeightMm: number;
}) {
  const boxWidth = Math.max(1, safeNumber(printBoxWidth, 1));
  const boxHeight = Math.max(1, safeNumber(printBoxHeight, 1));

  return {
    widthMm: (Math.max(0, safeNumber(elementWidth, 0)) / boxWidth) * Math.max(1, safeNumber(printWidthMm, 1)),
    heightMm: (Math.max(0, safeNumber(elementHeight, 0)) / boxHeight) * Math.max(1, safeNumber(printHeightMm, 1)),
  };
}

export function calculateElementDPI({
  naturalWidth,
  naturalHeight,
  elementWidth,
  elementHeight,
  printBoxWidth,
  printBoxHeight,
  printWidthMm,
  printHeightMm,
}: {
  naturalWidth: number;
  naturalHeight: number;
  elementWidth: number;
  elementHeight: number;
  printBoxWidth: number;
  printBoxHeight: number;
  printWidthMm: number;
  printHeightMm: number;
}): DPIResult {
  const sourceWidth = safeNumber(naturalWidth, 0);
  const sourceHeight = safeNumber(naturalHeight, 0);

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return { dpi: null, quality: "unknown", recommendedWidthCm: 0, recommendedHeightCm: 0 };
  }

  const physical = calculatePhysicalSizeMm({
    elementWidth,
    elementHeight,
    printBoxWidth,
    printBoxHeight,
    printWidthMm,
    printHeightMm,
  });

  const widthInches = physical.widthMm / MM_PER_INCH;
  const heightInches = physical.heightMm / MM_PER_INCH;

  if (widthInches <= 0 || heightInches <= 0) {
    return { dpi: null, quality: "unknown", recommendedWidthCm: 0, recommendedHeightCm: 0 };
  }

  const widthDpi = sourceWidth / widthInches;
  const heightDpi = sourceHeight / heightInches;
  const dpi = Math.round(Math.min(widthDpi, heightDpi));

  const recommended = getRecommendedPrintSize(sourceWidth, sourceHeight);

  return {
    dpi,
    quality: getQualityLevel(dpi),
    recommendedWidthCm: Math.round(recommended.widthCm * 10) / 10,
    recommendedHeightCm: Math.round(recommended.heightCm * 10) / 10,
    physicalWidthMm: Math.round(physical.widthMm * 10) / 10,
    physicalHeightMm: Math.round(physical.heightMm * 10) / 10,
  };
}

export function getQualityLevel(dpi: number | null): DPIQuality {
  if (!dpi) return "unknown";
  if (dpi >= 250) return "excellent";
  if (dpi >= 150) return "good";
  return "poor";
}

export function getQualityStatusLabel(dpi: number | null): string {
  if (!dpi) return "Unknown";
  if (dpi >= TARGET_PRINT_DPI) return "Excellent";
  if (dpi >= 200) return "Good";
  if (dpi >= 150) return "Risk";
  return "Poor Print Quality";
}

export function getRecommendedPrintSize(naturalWidth: number, naturalHeight: number) {
  return {
    widthCm: (safeNumber(naturalWidth, 0) / PRINT_DPI) * CM_PER_INCH,
    heightCm: (safeNumber(naturalHeight, 0) / PRINT_DPI) * CM_PER_INCH,
  };
}

export function analyzeImageQuality(naturalWidth: number, naturalHeight: number, renderedWidth: number): DPIResult {
  const dpi = calculateDPI(naturalWidth, renderedWidth);
  const recommended = getRecommendedPrintSize(naturalWidth, naturalHeight);

  return {
    dpi,
    quality: getQualityLevel(dpi),
    recommendedWidthCm: Math.round(recommended.widthCm * 10) / 10,
    recommendedHeightCm: Math.round(recommended.heightCm * 10) / 10,
  };
}
