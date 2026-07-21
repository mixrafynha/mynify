import {
  TARGET_PRINT_DPI,
  calculateElementDPI,
  calculatePhysicalSizeMm,
  getQualityStatusLabel,
} from "./dpi";

export type DpiQuality =
  | "excellent"
  | "good"
  | "risk"
  | "poor"
  | "vector"
  | "unknown";

export type QualityStatus =
  | "Excellent"
  | "Good"
  | "Risk"
  | "Poor Print Quality"
  | "Unknown";

type SafeArea = {
  width: number;
  height: number;
};

type PrintSize = {
  widthMm: number;
  heightMm: number;
};

type Size = {
  width: number;
  height: number;
};

function num(value: any, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function centerElement(size: Size, area: SafeArea) {
  return {
    x: Math.round(
      (Math.max(1, num(area?.width, 1)) -
        Math.max(1, num(size.width, 1))) / 2
    ),
    y: Math.round(
      (Math.max(1, num(area?.height, 1)) -
        Math.max(1, num(size.height, 1))) / 2
    ),
  };
}

export function getSourcePixels(element: any) {
  const meta = element?.meta || {};

  const sourceWidth = num(
    meta.originalWidth ??
      meta.naturalWidth ??
      element?.originalWidth ??
      element?.naturalWidth ??
      meta.sourceWidth,
    0
  );

  const sourceHeight = num(
    meta.originalHeight ??
      meta.naturalHeight ??
      element?.originalHeight ??
      element?.naturalHeight ??
      meta.sourceHeight,
    0
  );

  return {
    sourceWidth,
    sourceHeight,
  };
}

export function isVectorLike(element: any) {
  const type = String(element?.type || "").toLowerCase();

  const src = String(
    element?.src ||
      element?.meta?.src ||
      ""
  ).toLowerCase();

  return (
    type === "text" ||
    type === "shape" ||
    type === "svg" ||
    type === "qr" ||
    type === "barcode" ||
    (type === "sticker-element" && Boolean(element?.svg || element?.value)) ||
    src.startsWith("data:image/svg") ||
    src.endsWith(".svg")
  );
}

export function qualityFromDpi(
  dpi: number | null
): DpiQuality {
  if (!dpi) return "unknown";

  if (dpi >= TARGET_PRINT_DPI) return "excellent";
  if (dpi >= 300) return "good";
  if (dpi >= 200) return "risk";

  return "poor";
}

export function analyzeElementPrintQuality(
  element: any,
  safeArea: SafeArea,
  printSize?: PrintSize
) {
  const width = Math.max(
    1,
    num(
      element?.width ??
        element?.meta?.width,
      1
    )
  );

  const height = Math.max(
    1,
    num(
      element?.height ??
        element?.meta?.height,
      1
    )
  );

  if (
    !printSize?.widthMm ||
    !printSize?.heightMm ||
    !safeArea?.width ||
    !safeArea?.height
  ) {
    return {
      dpi: null,
      quality: "unknown" as DpiQuality,
      physicalWidthMm: 0,
      physicalHeightMm: 0,
    };
  }

  const physical = calculatePhysicalSizeMm({
    elementWidth: width,
    elementHeight: height,
    printBoxWidth: safeArea.width,
    printBoxHeight: safeArea.height,
    printWidthMm: printSize.widthMm,
    printHeightMm: printSize.heightMm,
  });

  if (isVectorLike(element)) {
    return {
      dpi: null,
      quality: "vector" as DpiQuality,
      physicalWidthMm:
        Math.round(physical.widthMm * 10) / 10,
      physicalHeightMm:
        Math.round(physical.heightMm * 10) / 10,
    };
  }

  const {
    sourceWidth,
    sourceHeight,
  } = getSourcePixels(element);

  if (!sourceWidth || !sourceHeight) {
    return {
      dpi: null,
      quality: "unknown" as DpiQuality,
      physicalWidthMm:
        Math.round(physical.widthMm * 10) / 10,
      physicalHeightMm:
        Math.round(physical.heightMm * 10) / 10,
    };
  }

  const result = calculateElementDPI({
    naturalWidth: sourceWidth,
    naturalHeight: sourceHeight,
    elementWidth: width,
    elementHeight: height,
    printBoxWidth: safeArea.width,
    printBoxHeight: safeArea.height,
    printWidthMm: printSize.widthMm,
    printHeightMm: printSize.heightMm,
  });

  return {
    dpi: result.dpi,
    quality: qualityFromDpi(result.dpi),
    physicalWidthMm:
      result.physicalWidthMm ||
      Math.round(physical.widthMm * 10) / 10,
    physicalHeightMm:
      result.physicalHeightMm ||
      Math.round(physical.heightMm * 10) / 10,
  };
}

export function withPrintQualityMeta(
  element: any,
  safeArea: SafeArea,
  printSize?: PrintSize
) {
  const quality = analyzeElementPrintQuality(
    element,
    safeArea,
    printSize
  );

  const vector = isVectorLike(element);

  const source = getSourcePixels(element);

  return {
    ...element,
    meta: {
      ...(element?.meta || {}),

      originalWidth:
        element?.meta?.originalWidth ??
        element?.meta?.naturalWidth ??
        source.sourceWidth ??
        undefined,

      originalHeight:
        element?.meta?.originalHeight ??
        element?.meta?.naturalHeight ??
        source.sourceHeight ??
        undefined,

      dpi: quality.dpi,
      effectiveDpi: quality.dpi,

      printWidth: quality.physicalWidthMm,
      printHeight: quality.physicalHeightMm,

      printWidthMm: quality.physicalWidthMm,
      printHeightMm: quality.physicalHeightMm,

      qualityStatus: vector
        ? "Excellent"
        : getQualityStatusLabel(quality.dpi),

      dpiQuality: quality.quality,

      printPhysicalWidthMm:
        quality.physicalWidthMm,

      printPhysicalHeightMm:
        quality.physicalHeightMm,

      printKind: vector
        ? String(element?.type) === "text"
          ? "text"
          : "vector"
        : "raster",
    },
  };
}
