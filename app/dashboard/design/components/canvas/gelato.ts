import { DPI, MM_TO_INCH } from "./constants";
import {
  getGelatoPrintSizeMm as getRuntimeGelatoPrintSizeMm,
  type ProductDisplayConfig,
} from "./productConfig";
import { getPrintBox, getSafeArea, isInsideSafeArea } from "./canvasMath";
import type { Side } from "./types";

function finite(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getGelatoPrintSizeMm(
  productId: string,
  side: Side = "front",
  productConfig?: ProductDisplayConfig | null,
) {
  return getRuntimeGelatoPrintSizeMm(productId, side, productConfig);
}

export function getGelatoExportSizePx(
  productId: string,
  side: Side = "front",
  productConfig?: ProductDisplayConfig | null,
) {
  const size = getGelatoPrintSizeMm(productId, side, productConfig);
  return {
    width: Math.round(size.widthMm * MM_TO_INCH * DPI),
    height: Math.round(size.heightMm * MM_TO_INCH * DPI),
  };
}

export function hasElementsOutsidePrintArea(
  elements: any[],
  productId = "tshirt",
  side: Side = "front",
  productConfig?: ProductDisplayConfig | null,
) {
  const printBox = getPrintBox(productId, side, productConfig);
  const safeArea = getSafeArea(printBox);
  return elements.some((el) => !isInsideSafeArea(el, { x: 0, y: 0, width: safeArea.width, height: safeArea.height }));
}

export function mapElementToGelatoExport(
  el: any,
  productId = "tshirt",
  side: Side = "front",
  productConfig?: ProductDisplayConfig | null,
) {
  const printBox = getPrintBox(productId, side, productConfig);
  const safeArea = getSafeArea(printBox);
  const exportSize = getGelatoExportSizePx(productId, side, productConfig);
  const scaleX = exportSize.width / Math.max(1, safeArea.width);
  const scaleY = exportSize.height / Math.max(1, safeArea.height);
  const scale = Math.min(scaleX, scaleY);

  const width = finite(el.width ?? el.meta?.width, 1);
  const height = finite(el.height ?? el.meta?.height, 1);

  return {
    ...el,
    x: Math.round(finite(el.x) * scaleX),
    y: Math.round(finite(el.y) * scaleY),
    width: Math.round(width * scaleX),
    height: Math.round(height * scaleY),
    meta: {
      ...(el.meta || {}),
      fontSize: el.meta?.fontSize ? Math.round(finite(el.meta.fontSize) * scaleY) : undefined,
      strokeWidth: el.meta?.strokeWidth ? finite(el.meta.strokeWidth) * scale : undefined,
      exportCoordinateMode: "gelato-print-area-local",
      sourceCoordinateMode: "safe-area-local",
    },
  };
}

export function getGelatoProductionPayload(
  elements: any[],
  productId = "tshirt",
  side: Side = "front",
  productConfig?: ProductDisplayConfig | null,
) {
  const printBox = getPrintBox(productId, side, productConfig);
  const safeArea = getSafeArea(printBox);

  return {
    side,
    dpi: DPI,
    transparentBackground: true,
    exportSizePx: getGelatoExportSizePx(productId, side, productConfig),
    printBox,
    safeArea,
    elements: elements.map((el) => mapElementToGelatoExport(el, productId, side, productConfig)),
  };
}
