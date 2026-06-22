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
  const exportSize = getGelatoExportSizePx(productId, side);
  
  const relativeX = (el.x - printBox.x) / printBox.width;
  const relativeY = (el.y - printBox.y) / printBox.height;
  const relativeWidth = el.width / printBox.width;
  const relativeHeight = el.height / printBox.height;

  return {
    ...el,
    x: Math.round(relativeX * exportSize.width),
    y: Math.round(relativeY * exportSize.height),
    width: el.width ? Math.round(relativeWidth * exportSize.width) : undefined,
    height: el.height ? Math.round(relativeHeight * exportSize.height) : undefined,
    meta: {
      ...(el.meta || {}),
      fontSize: el.meta?.fontSize
        ? Math.round((el.meta.fontSize / printBox.height) * exportSize.height)
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