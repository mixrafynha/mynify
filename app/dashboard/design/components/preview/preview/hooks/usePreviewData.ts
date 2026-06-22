import { useMemo } from "react";
import { EXPORT_MOCKUP_AREA } from "../../canvas/constants";
import {
  GELATO_PRINT_SIZE_MM_BY_PRODUCT,
  PRINT_BOX_BY_PRODUCT,
  PRODUCTS,
} from "../../canvas/productConfig";
import { getSafeArea } from "../../canvas/canvasMath";
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
  sweat: "hoodie",
  sweatshirt: "hoodie",
  hat: "cap",
  cup: "mug",
};

function normalizeProductId(value?: string) {
  const raw = String(value || "tshirt")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

  // Product UUIDs from DB should not break the local mockup config.
  const withoutUuid = /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(raw) ? "tshirt" : raw;
  const normalized = PRODUCT_ALIASES[withoutUuid] || withoutUuid;

  if (PRODUCTS?.[normalized]) return normalized;
  if (PRODUCTS?.tshirt) return "tshirt";
  if (PRODUCTS?.hoodie) return "hoodie";

  return Object.keys(PRODUCTS || {})[0] || "tshirt";
}

function sideElements(elements: PreviewElement[], side: PreviewSide) {
  const list = Array.isArray(elements) ? elements : [];
  const explicitlySided = list.some((el) => el?.side || el?.meta?.side);

  if (!explicitlySided) return list;

  return list.filter((el) => (el?.side || el?.meta?.side || "front") === side);
}

function rect(el: PreviewElement) {
  return {
    x: Number(el?.x || 0),
    y: Number(el?.y || 0),
    width: Math.max(1, Number(el?.width ?? el?.meta?.width ?? 1)),
    height: Math.max(1, Number(el?.height ?? el?.meta?.height ?? 1)),
  };
}

function intersects(a: PreviewBox, b: PreviewBox) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function normalizeElementCoordinates(
  elements: PreviewElement[],
  printBox: PreviewBox,
  safeArea: PreviewBox,
) {
  const list = Array.isArray(elements) ? elements : [];
  if (!list.length) return [];

  // Some editor versions store x/y relative to the print area.
  // Others store x/y as absolute canvas/mockup coordinates.
  // The preview renderer needs local print-area coordinates.
  const absoluteHits = list.filter((el) => intersects(rect(el), safeArea)).length;
  const localHits = list.filter((el) =>
    intersects(rect(el), { x: 0, y: 0, width: safeArea.width, height: safeArea.height }),
  ).length;

  const looksAbsolute = absoluteHits > localHits;
  const offsetX = looksAbsolute ? safeArea.x : 0;
  const offsetY = looksAbsolute ? safeArea.y : 0;

  return list.map((el) => ({
    ...el,
    x: Number(el.x || 0) - offsetX,
    y: Number(el.y || 0) - offsetY,
    width: Number(el.width ?? el.meta?.width ?? 1),
    height: Number(el.height ?? el.meta?.height ?? 1),
    meta: {
      ...(el.meta || {}),
      previewCoordinateMode: looksAbsolute ? "absolute-canvas" : "print-local",
      originalPreviewX: el.x,
      originalPreviewY: el.y,
      printBox,
    },
  }));
}

export function usePreviewData(input: ProductionPreviewInput): ProductionPreviewData {
  return useMemo(() => {
    const category = normalizeProductId(input.category || input.productId);
    const productId = category;
    const activeSide: PreviewSide = input.side === "back" ? "back" : "front";
    const mockupColor = input.mockupColor || input.color || "#ffffff";

    const buildSide = (side: PreviewSide) => {
      const printBox =
        PRINT_BOX_BY_PRODUCT?.[productId]?.[side] ||
        PRINT_BOX_BY_PRODUCT?.tshirt?.[side] ||
        PRINT_BOX_BY_PRODUCT?.hoodie?.[side] ||
        PRINT_BOX_BY_PRODUCT?.hoodie?.front ||
        { x: 375, y: 322, width: 274, height: 336 };

      const safeArea = getSafeArea(printBox) as PreviewBox;
      const printSize =
        GELATO_PRINT_SIZE_MM_BY_PRODUCT?.[productId]?.[side] ||
        GELATO_PRINT_SIZE_MM_BY_PRODUCT?.tshirt?.[side] ||
        GELATO_PRINT_SIZE_MM_BY_PRODUCT?.hoodie?.[side] ||
        GELATO_PRINT_SIZE_MM_BY_PRODUCT?.hoodie?.front ||
        { widthMm: 300, heightMm: 400 };

      const sideSpecificElements = side === "back" ? input.backElements : input.frontElements;
      const rawElements = Array.isArray(sideSpecificElements)
        ? sideSpecificElements
        : sideElements((input.elements || []) as PreviewElement[], side);
      const elements = normalizeElementCoordinates(rawElements, printBox, safeArea);

      const validation = validatePreviewSide({
        side,
        elements,
        safeArea: { x: 0, y: 0, width: safeArea.width, height: safeArea.height },
        printSize,
      });

      return {
        side,
        elements,
        mockupUrl:
          PRODUCTS?.[productId]?.[side] ||
          PRODUCTS?.tshirt?.[side] ||
          PRODUCTS?.hoodie?.[side] ||
          "",
        printBox,
        safeArea,
        printSize,
        exportResolution: EXPORT_MOCKUP_AREA,
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
  }, [input.backElements, input.category, input.elements, input.frontElements, input.mockupColor, input.color, input.productId, input.side]);
}
