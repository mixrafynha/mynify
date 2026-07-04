import { useMemo } from "react";
import {
  getGelatoPrintSizeMm,
  getMockupUrl,
  getMockupVisualScale,
  getProductionExportResolution,
  getResponsivePrintBox,
} from "../../canvas/productConfig";

import { getConfiguredSafeArea } from "../../canvas/productConfig";
import {
  mergePreviewValidation,
  validatePreviewSide,
} from "../services/previewValidation";
import type {
  ProductionPreviewData,
  ProductionPreviewInput,
  PreviewBox,
  PreviewElement,
  PreviewSide,
} from "../types/preview";

const PRODUCT_ALIASES: Record<string, string> = {
  "t-shirt": "tshirt",
  tshirts: "tshirt",
  tee: "tshirt",
  shirt: "tshirt",
  sweat: "sweatshirt",
  hat: "cap",
  caps: "cap",
  cup: "mug",
};

function normalizeProductId(value?: string) {
  const raw = String(value || "tshirt")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

  if (/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(raw)) return "tshirt";

  return PRODUCT_ALIASES[raw] || raw || "tshirt";
}

function sideElements(elements: PreviewElement[], side: PreviewSide) {
  const list = Array.isArray(elements) ? elements : [];
  const explicitlySided = list.some((el) => el?.side || el?.meta?.side);

  if (!explicitlySided) return list;

  return list.filter((el) => (el?.side || el?.meta?.side || "front") === side);
}

function normalizeElementCoordinates(
  elements: PreviewElement[],
  printBox: PreviewBox,
  safeArea: PreviewBox,
  coordinateMode: "safe-area-local" | "auto" = "auto",
) {
  const list = Array.isArray(elements) ? elements : [];
  if (!list.length) return [];

  return list
    .filter((el) => !el?.meta?.hidden)
    .map((el) => {
      const rawX = Number(el.x || 0);
      const rawY = Number(el.y || 0);
      const width = Math.max(1, Number(el.width ?? el.meta?.width ?? 1));
      const height = Math.max(1, Number(el.height ?? el.meta?.height ?? 1));

      // The live editor stores frontElements/backElements in safe-area-local
      // coordinates because the SafeAreaLayer itself is positioned on the
      // mockup. Do not infer absolute coordinates from numeric values here:
      // a valid local back-side element can naturally have x/y values that
      // overlap the mockup absolute print box range, especially when it is
      // partly outside the printable area. Re-basing those values is the bug
      // that made back elements jump/clip incorrectly after opening preview
      // from the front side.
      const absoluteMode =
        coordinateMode === "auto" &&
        (el.meta?.previewCoordinateMode === "mockup-absolute" ||
          el.meta?.previewCoordinateMode === "canvas-absolute");

      return {
        ...el,
        x: absoluteMode ? rawX - safeArea.x : rawX,
        y: absoluteMode ? rawY - safeArea.y : rawY,
        width,
        height,
        meta: {
          ...(el.meta || {}),
          previewCoordinateMode: "safe-area-local",
          originalPreviewX: el.x,
          originalPreviewY: el.y,
          printBox,
        },
      };
    });
}

export function usePreviewData(input: ProductionPreviewInput): ProductionPreviewData {
  return useMemo(() => {
    const category = input.productConfig?.category || normalizeProductId(input.category || input.productId);
    const productId = category;
    const activeSide: PreviewSide = input.side === "back" ? "back" : "front";
    const mockupColor = input.mockupColor || input.color || "#ffffff";

    const buildSide = (side: PreviewSide) => {
      const printBox = getResponsivePrintBox(productId, side, undefined, input.productConfig) as PreviewBox;
      const safeArea = getConfiguredSafeArea(productId, side, input.productConfig) as PreviewBox;
      const printSize = getGelatoPrintSizeMm(productId, side, input.productConfig);

      const sideSpecificElements = side === "back" ? input.backElements : input.frontElements;
      const hasSideSpecificElements = Array.isArray(sideSpecificElements);
      const rawElements = hasSideSpecificElements
        ? sideSpecificElements
        : sideElements((input.elements || []) as PreviewElement[], side);
      const elements = normalizeElementCoordinates(
        rawElements,
        printBox,
        safeArea,
        hasSideSpecificElements || input.designCoordinateMode === "safe-area-local"
          ? "safe-area-local"
          : "auto",
      );

      const validation = validatePreviewSide({
        side,
        elements,
        safeArea: { x: 0, y: 0, width: safeArea.width, height: safeArea.height },
        printSize,
      });

      return {
        side,
        elements,
        mockupUrl: getMockupUrl(productId, side, input.productConfig),
        visualScale: getMockupVisualScale(productId, side, input.productConfig),
        printBox,
        safeArea,
        printSize,
        exportResolution: getProductionExportResolution(productId, side, undefined, input.productConfig),
        validation,
      };
    };

    const front = buildSide("front");
    const back = buildSide("back");

    return {
      productId,
      category,
      activeSide,
      mockupColor,
      front,
      back,
      current: activeSide === "back" ? back : front,
      combinedStatus: mergePreviewValidation([front.validation, back.validation]),
    };
  }, [input.backElements, input.category, input.elements, input.frontElements, input.mockupColor, input.color, input.productId, input.side, input.productConfig]);
}
