import type { PreviewBox, PreviewElement, PreviewPrintSize, PreviewSide, PreviewValidationResult, PreviewWarning } from "../types/preview";

const PX_PER_INCH = 96;
const MIN_ACCEPTABLE_DPI = 150;
const TARGET_DPI = 300;
const MIN_IMAGE_SIDE_PX = 500;

function n(value: any, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function rectOf(el: PreviewElement): PreviewBox {
  return {
    x: n(el.x),
    y: n(el.y),
    width: Math.max(1, n(el.width ?? el.meta?.width, 1)),
    height: Math.max(1, n(el.height ?? el.meta?.height, 1)),
  };
}

function inside(a: PreviewBox, b: PreviewBox) {
  return a.x >= 0 && a.y >= 0 && a.x + a.width <= b.width && a.y + a.height <= b.height;
}

function intersects(a: PreviewBox, b: PreviewBox) {
  return a.x < b.width && a.x + a.width > 0 && a.y < b.height && a.y + a.height > 0;
}

function sourcePixels(el: PreviewElement) {
  const width = n(el.meta?.naturalWidth ?? el.meta?.imageWidth ?? el.originalWidth ?? el.imageWidth);
  const height = n(el.meta?.naturalHeight ?? el.meta?.imageHeight ?? el.originalHeight ?? el.imageHeight);
  return { width, height };
}

function isVector(el: PreviewElement) {
  const src = String(el.src || "").toLowerCase();
  return Boolean(el.meta?.isVector || src.startsWith("data:image/svg") || src.endsWith(".svg"));
}

export function calculateElementDpi(el: PreviewElement, safeArea: PreviewBox, printSize: PreviewPrintSize) {
  if (el.type !== "image") return null;
  if (isVector(el)) return null;

  const source = sourcePixels(el);
  if (!source.width || !source.height) return null;

  const rect = rectOf(el);
  const printedWidthMm = (rect.width / Math.max(1, safeArea.width)) * printSize.widthMm;
  const printedHeightMm = (rect.height / Math.max(1, safeArea.height)) * printSize.heightMm;
  const printedWidthIn = printedWidthMm / 25.4;
  const printedHeightIn = printedHeightMm / 25.4;

  if (!printedWidthIn || !printedHeightIn) return null;

  return Math.round(Math.min(source.width / printedWidthIn, source.height / printedHeightIn));
}

export function validatePreviewSide(args: {
  side: PreviewSide;
  elements: PreviewElement[];
  safeArea: PreviewBox;
  printSize: PreviewPrintSize;
}): PreviewValidationResult {
  const elements = Array.isArray(args.elements) ? args.elements : [];
  const warnings: PreviewWarning[] = [];
  let minDpi: number | null = null;

  if (elements.length === 0) {
    warnings.push({
      id: `${args.side}-empty-design`,
      type: "EMPTY_DESIGN",
      title: "Empty design",
      message: "This side has no printable layers.",
      severity: "warning",
      side: args.side,
    });
  }

  for (const el of elements) {
    const rect = rectOf(el);
    const elementId = String(el.id || `${args.side}-${warnings.length}`);

    if (!intersects(rect, args.safeArea)) {
      warnings.push({
        id: `${args.side}-${elementId}-outside-full`,
        type: "OUTSIDE_PRINT_AREA",
        title: "Outside print area",
        message: "One layer is completely outside the printable area.",
        severity: "danger",
        elementId,
        side: args.side,
      });
    } else if (!inside(rect, args.safeArea)) {
      warnings.push({
        id: `${args.side}-${elementId}-outside-partial`,
        type: "OUTSIDE_PRINT_AREA",
        title: "Partially outside print area",
        message: "One layer is crossing the production print boundary.",
        severity: "warning",
        elementId,
        side: args.side,
      });
    }

    if (el.type === "image" && !isVector(el)) {
      const source = sourcePixels(el);
      const dpi = calculateElementDpi(el, args.safeArea, args.printSize);
      if (dpi !== null) minDpi = minDpi === null ? dpi : Math.min(minDpi, dpi);

      if (!source.width || !source.height) {
        warnings.push({
          id: `${args.side}-${elementId}-export-risk`,
          type: "EXPORT_RISK",
          title: "Export risk",
          message: "Image source dimensions are missing, so DPI cannot be verified.",
          severity: "warning",
          elementId,
          side: args.side,
        });
      } else {
        if (Math.min(source.width, source.height) < MIN_IMAGE_SIDE_PX) {
          warnings.push({
            id: `${args.side}-${elementId}-small-image`,
            type: "SMALL_IMAGE",
            title: "Small image",
            message: "Source image is very small and can look soft in production.",
            severity: "warning",
            elementId,
            side: args.side,
          });
        }

        if (dpi !== null && dpi < MIN_ACCEPTABLE_DPI) {
          warnings.push({
            id: `${args.side}-${elementId}-low-dpi`,
            type: "LOW_DPI",
            title: "Low DPI",
            message: `Image is ${dpi} DPI. Recommended minimum is ${MIN_ACCEPTABLE_DPI} DPI, target is ${TARGET_DPI} DPI.`,
            severity: "danger",
            elementId,
            side: args.side,
          });
        } else if (dpi !== null && dpi < TARGET_DPI) {
          warnings.push({
            id: `${args.side}-${elementId}-medium-dpi`,
            type: "LOW_DPI",
            title: "DPI needs attention",
            message: `Image is ${dpi} DPI. It can print, but ${TARGET_DPI} DPI is safer for premium quality.`,
            severity: "warning",
            elementId,
            side: args.side,
          });
        }
      }

      const opacity = n(el.meta?.opacity, 1);
      if (opacity > 0 && opacity < 0.98) {
        warnings.push({
          id: `${args.side}-${elementId}-transparency`,
          type: "TRANSPARENT_ISSUES",
          title: "Transparency check",
          message: "This image uses opacity. Confirm this is intentional before production.",
          severity: "info",
          elementId,
          side: args.side,
        });
      }
    }
  }

  const hasDanger = warnings.some((w) => w.severity === "danger");
  const hasWarning = warnings.some((w) => w.severity === "warning");
  const status = hasDanger ? "production_risk" : hasWarning ? "needs_attention" : "ready";

  return {
    status,
    statusLabel: status === "ready" ? "Ready For Production" : status === "needs_attention" ? "Needs Attention" : "Production Risk",
    dpi: minDpi,
    warnings,
    printReady: status === "ready",
    riskLevel: hasDanger ? "high" : hasWarning ? "medium" : "low",
  };
}

export function mergePreviewValidation(results: PreviewValidationResult[]): PreviewValidationResult {
  const warnings = results.flatMap((r) => r.warnings);
  const dpis = results.map((r) => r.dpi).filter((v): v is number => typeof v === "number");
  const hasDanger = results.some((r) => r.status === "production_risk");
  const hasWarning = results.some((r) => r.status === "needs_attention");
  const status = hasDanger ? "production_risk" : hasWarning ? "needs_attention" : "ready";

  return {
    status,
    statusLabel: status === "ready" ? "Ready For Production" : status === "needs_attention" ? "Needs Attention" : "Production Risk",
    dpi: dpis.length ? Math.min(...dpis) : null,
    warnings,
    printReady: status === "ready",
    riskLevel: hasDanger ? "high" : hasWarning ? "medium" : "low",
  };
}
