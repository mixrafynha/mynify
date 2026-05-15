import {
  MIN_VISIBLE_WHEN_DRAGGING,
  SAFE_AREA_PADDING,
} from "./constants";

import { PRINT_BOX_BY_PRODUCT } from "./productConfig";

import type { Box, Side } from "./types";

export function getPrintBox(productId: string, side: Side = "front"): Box {
  return (
    PRINT_BOX_BY_PRODUCT?.[productId]?.[side] ||
    PRINT_BOX_BY_PRODUCT?.[productId]?.front ||
    PRINT_BOX_BY_PRODUCT?.hoodie?.front || {
      x: 148,
      y: 190,
      width: 224,
      height: 248,
    }
  );
}

export function getSafeArea(printBox: Box): Box {
  return {
    x: printBox.x + SAFE_AREA_PADDING,
    y: printBox.y + SAFE_AREA_PADDING,
    width: printBox.width - SAFE_AREA_PADDING * 2,
    height: printBox.height - SAFE_AREA_PADDING * 2,
  };
}

export function getProductionSafeArea(printBox: Box): Box {
  return {
    x: printBox.x,
    y: printBox.y,
    width: printBox.width,
    height: printBox.height,
  };
}

export function getElementSize(el: any) {
  const fontSize = el.meta?.fontSize || 40;

  if (el.type === "text") {
    const text = el.text || el.content || "";

    return {
      width: el.width || Math.max(40, text.length * fontSize * 0.62),
      height: el.height || fontSize * 1.25,
    };
  }

  return {
    width: el.width || 80,
    height: el.height || 80,
  };
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function fitElementInsideSafeArea(el: any, safeArea: Box) {
  const currentWidth = el.width || 80;
  const currentHeight = el.height || el.meta?.fontSize || 40;

  const scale = Math.min(
    1,
    safeArea.width / currentWidth,
    safeArea.height / currentHeight
  );

  return {
    ...el,

    width: el.width ? Math.max(10, Math.floor(currentWidth * scale)) : el.width,

    height: el.height
      ? Math.max(10, Math.floor(currentHeight * scale))
      : el.height,

    meta: {
      ...(el.meta || {}),
      fontSize: el.meta?.fontSize
        ? Math.max(10, Math.floor(el.meta.fontSize * scale))
        : el.meta?.fontSize,
    },
  };
}

export function clampElementToSafeArea(el: any, safeArea: Box) {
  const fitted = fitElementInsideSafeArea(el, safeArea);
  const { width, height } = getElementSize(fitted);

  return {
    ...fitted,

    x: clamp(
      fitted.x,
      safeArea.x - width + MIN_VISIBLE_WHEN_DRAGGING,
      safeArea.x + safeArea.width - MIN_VISIBLE_WHEN_DRAGGING
    ),

    y: clamp(
      fitted.y,
      safeArea.y - height + MIN_VISIBLE_WHEN_DRAGGING,
      safeArea.y + safeArea.height - MIN_VISIBLE_WHEN_DRAGGING
    ),
  };
}

export function isInsideSafeArea(el: any, safeArea: Box) {
  const { width, height } = getElementSize(el);

  return (
    el.x >= safeArea.x &&
    el.y >= safeArea.y &&
    el.x + width <= safeArea.x + safeArea.width &&
    el.y + height <= safeArea.y + safeArea.height
  );
}

export function isInsideProductionArea(
  el: any,
  productId = "hoodie",
  side: Side = "front"
) {
  const printBox = getPrintBox(productId, side);
  const productionArea = getProductionSafeArea(printBox);

  return isInsideSafeArea(el, productionArea);
}