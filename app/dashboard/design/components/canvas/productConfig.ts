import type { Box, Side } from "./types";
import { MOCKUP_AREA } from "./constants";

const BASE_MOCKUP_AREA = {
  width: 1024,
  height: 1024,
};

export const PRODUCTS: Record<string, Record<Side, string>> = {
  tshirt: {
    front: "/mockups/tshirt-front.png",
    back: "/mockups/tshirt-back.png",
  },
  hoodie: {
    front: "/mockups/hoodie-front.png",
    back: "/mockups/hoodie-back.png",
  },
  cap: {
    front: "/mockups/cap-front.png",
    back: "/mockups/cap-back.png",
  },
  mug: {
    front: "/mockups/mug-front.png",
    back: "/mockups/mug-back.png",
  },
};

export const PRINT_BOX_BY_PRODUCT: Record<string, Record<Side, Box>> = {
  tshirt: {
    front: { x: 350, y: 250, width: 320, height: 442 },
    back: { x: 350, y: 300, width: 320, height: 480 },
  },
  hoodie: {
    front: { x: 375, y: 322, width: 274, height: 336 },
    back: { x: 350, y: 362, width: 320, height: 416 },
  },
  cap: {
    front: { x: 415, y: 429, width: 194, height: 102 },
    back: { x: 457, y: 504, width: 138, height: 38 },
  },
  mug: {
    front: { x: 340, y: 376, width: 344, height: 144 },
    back: { x: 340, y: 376, width: 344, height: 144 },
  },
};

export function pxBoxToRatio(box: Box): Box {
  return {
    x: box.x / BASE_MOCKUP_AREA.width,
    y: box.y / BASE_MOCKUP_AREA.height,
    width: box.width / BASE_MOCKUP_AREA.width,
    height: box.height / BASE_MOCKUP_AREA.height,
  };
}

export function ratioBoxToPx(box: Box, area = MOCKUP_AREA): Box {
  return {
    x: Math.round(box.x * area.width),
    y: Math.round(box.y * area.height),
    width: Math.round(box.width * area.width),
    height: Math.round(box.height * area.height),
  };
}

export const PRINT_BOX_RATIO_BY_PRODUCT: Record<string, Record<Side, Box>> = {
  tshirt: {
    front: pxBoxToRatio(PRINT_BOX_BY_PRODUCT.tshirt.front),
    back: pxBoxToRatio(PRINT_BOX_BY_PRODUCT.tshirt.back),
  },
  hoodie: {
    front: pxBoxToRatio(PRINT_BOX_BY_PRODUCT.hoodie.front),
    back: pxBoxToRatio(PRINT_BOX_BY_PRODUCT.hoodie.back),
  },
  cap: {
    front: pxBoxToRatio(PRINT_BOX_BY_PRODUCT.cap.front),
    back: pxBoxToRatio(PRINT_BOX_BY_PRODUCT.cap.back),
  },
  mug: {
    front: pxBoxToRatio(PRINT_BOX_BY_PRODUCT.mug.front),
    back: pxBoxToRatio(PRINT_BOX_BY_PRODUCT.mug.back),
  },
};

export function getResponsivePrintBox(
  productId: string,
  side: Side = "front",
  area = MOCKUP_AREA
): Box {
  const product = PRINT_BOX_RATIO_BY_PRODUCT[productId] || PRINT_BOX_RATIO_BY_PRODUCT.hoodie;
  const ratioBox = product[side] || product.front;
  return ratioBoxToPx(ratioBox, area);
}

export const GELATO_PRINT_SIZE_MM_BY_PRODUCT: Record<
  string,
  Record<Side, { widthMm: number; heightMm: number }>
> = {
  tshirt: { front: { widthMm: 300, heightMm: 400 }, back: { widthMm: 300, heightMm: 400 } },
  hoodie: { front: { widthMm: 340, heightMm: 420 }, back: { widthMm: 340, heightMm: 420 } },
  cap: { front: { widthMm: 120, heightMm: 55 }, back: { widthMm: 80, heightMm: 30 } },
  mug: { front: { widthMm: 200, heightMm: 96 }, back: { widthMm: 200, heightMm: 96 } },
};

export const MOCKUP_VISUAL_SCALE_BY_PRODUCT: Record<string, Record<Side, number>> = {
  tshirt: { front: 1, back: 0.85 },
  hoodie: { front: 0.9, back: 0.9 },
  cap: { front: 0.7, back: 0.7 },
  mug: { front: 0.75, back: 0.75 },
};