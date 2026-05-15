import { DPI, MM_TO_INCH } from "./constants";
import { GELATO_PRINT_SIZE_MM_BY_PRODUCT } from "./productConfig";
import { getPrintBox, getSafeArea, isInsideSafeArea } from "./canvasMath";
import type { Side } from "./types";

export function getGelatoPrintSizeMm(productId: string, side: Side = "front") {
  return (
    GELATO_PRINT_SIZE_MM_BY_PRODUCT[productId]?.[side] ||
    GELATO_PRINT_SIZE_MM_BY_PRODUCT[productId]?.front ||
    GELATO_PRINT_SIZE_MM_BY_PRODUCT.hoodie.front
  );
}

export function getGelatoExportSizePx(productId: string, side: Side = "front") {
  const size = getGelatoPrintSizeMm(productId, side);

  return {
    width: Math.round(size.widthMm * MM_TO_INCH * DPI),
    height: Math.round(size.heightMm * MM_TO_INCH * DPI),
  };
}

export function hasElementsOutsidePrintArea(
  elements: any[],
  productId = "hoodie",
  side: Side = "front"
) {
  const printBox = getPrintBox(productId, side);
  const safeArea = getSafeArea(printBox);

  return elements.some((el) => !isInsideSafeArea(el, safeArea));
}

export function mapElementToGelatoExport(
  el: any,
  productId = "hoodie",
  side: Side = "front"
) {
  const printBox = getPrintBox(productId, side);
  const safeArea = getSafeArea(printBox);
  const exportSize = getGelatoExportSizePx(productId, side);

  const scaleX = exportSize.width / safeArea.width;
  const scaleY = exportSize.height / safeArea.height;

  return {
    ...el,

    x: Math.round((el.x - safeArea.x) * scaleX),
    y: Math.round((el.y - safeArea.y) * scaleY),

    width: el.width ? Math.round(el.width * scaleX) : undefined,
    height: el.height ? Math.round(el.height * scaleY) : undefined,

    meta: {
      ...(el.meta || {}),
      fontSize: el.meta?.fontSize
        ? Math.round(el.meta.fontSize * scaleY)
        : undefined,
    },
  };
}

export function getGelatoProductionPayload(
  elements: any[],
  productId = "hoodie",
  side: Side = "front"
) {
  const printBox = getPrintBox(productId, side);
  const safeArea = getSafeArea(printBox);

  return {
    side,
    dpi: DPI,
    transparentBackground: true,
    exportSizePx: getGelatoExportSizePx(productId, side),
    printBox,
    safeArea,
    elements: elements.map((el) =>
      mapElementToGelatoExport(el, productId, side)
    ),
  };
}