import type { Box, Side } from "./types";
import { MOCKUP_AREA } from "./constants";

const BASE_MOCKUP_AREA = {
  width: 1024,
  height: 1024,
};

type ProductSideMap<T> = Record<string, Record<Side, T>>;

type PrintSizeMm = {
  widthMm: number;
  heightMm: number;
};

export const PRODUCTS: ProductSideMap<string> = {
  tshirt: {
    front: "/mockups/tshirt-front.png",
    back: "/mockups/tshirt-back.png",
    "left-sleeve": "/mockups/tshirt-front.png",
    "right-sleeve": "/mockups/tshirt-front.png",
  },
  hoodie: {
    front: "/mockups/hoodie-front.png",
    back: "/mockups/hoodie-back.png",
    "left-sleeve": "/mockups/hoodie-front.png",
    "right-sleeve": "/mockups/hoodie-front.png",
  },
  cap: {
    front: "/mockups/cap-front.png",
    back: "/mockups/cap-back.png",
    "left-sleeve": "/mockups/cap-front.png",
    "right-sleeve": "/mockups/cap-front.png",
  },
  mug: {
    front: "/mockups/mug-front.png",
    back: "/mockups/mug-back.png",
    "left-sleeve": "/mockups/mug-front.png",
    "right-sleeve": "/mockups/mug-front.png",
  },
};

export const PRINT_BOX_BY_PRODUCT: ProductSideMap<Box> = {
  tshirt: {
    front: { x: 350, y: 250, width: 320, height: 442 },
    back: { x: 350, y: 300, width: 320, height: 480 },
    "left-sleeve": { x: 350, y: 250, width: 320, height: 442 },
    "right-sleeve": { x: 350, y: 250, width: 320, height: 442 },
  },
  hoodie: {
    front: { x: 375, y: 322, width: 274, height: 336 },
    back: { x: 350, y: 362, width: 320, height: 416 },
    "left-sleeve": { x: 375, y: 322, width: 274, height: 336 },
    "right-sleeve": { x: 375, y: 322, width: 274, height: 336 },
  },
  cap: {
    front: { x: 415, y: 429, width: 194, height: 102 },
    back: { x: 457, y: 504, width: 138, height: 38 },
    "left-sleeve": { x: 415, y: 429, width: 194, height: 102 },
    "right-sleeve": { x: 415, y: 429, width: 194, height: 102 },
  },
  mug: {
    front: { x: 340, y: 376, width: 344, height: 144 },
    back: { x: 340, y: 376, width: 344, height: 144 },
    "left-sleeve": { x: 340, y: 376, width: 344, height: 144 },
    "right-sleeve": { x: 340, y: 376, width: 344, height: 144 },
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

export const PRINT_BOX_RATIO_BY_PRODUCT: ProductSideMap<Box> = {
  tshirt: {
    front: pxBoxToRatio(PRINT_BOX_BY_PRODUCT.tshirt.front),
    back: pxBoxToRatio(PRINT_BOX_BY_PRODUCT.tshirt.back),
    "left-sleeve": pxBoxToRatio(PRINT_BOX_BY_PRODUCT.tshirt["left-sleeve"]),
    "right-sleeve": pxBoxToRatio(PRINT_BOX_BY_PRODUCT.tshirt["right-sleeve"]),
  },
  hoodie: {
    front: pxBoxToRatio(PRINT_BOX_BY_PRODUCT.hoodie.front),
    back: pxBoxToRatio(PRINT_BOX_BY_PRODUCT.hoodie.back),
    "left-sleeve": pxBoxToRatio(PRINT_BOX_BY_PRODUCT.hoodie["left-sleeve"]),
    "right-sleeve": pxBoxToRatio(PRINT_BOX_BY_PRODUCT.hoodie["right-sleeve"]),
  },
  cap: {
    front: pxBoxToRatio(PRINT_BOX_BY_PRODUCT.cap.front),
    back: pxBoxToRatio(PRINT_BOX_BY_PRODUCT.cap.back),
    "left-sleeve": pxBoxToRatio(PRINT_BOX_BY_PRODUCT.cap["left-sleeve"]),
    "right-sleeve": pxBoxToRatio(PRINT_BOX_BY_PRODUCT.cap["right-sleeve"]),
  },
  mug: {
    front: pxBoxToRatio(PRINT_BOX_BY_PRODUCT.mug.front),
    back: pxBoxToRatio(PRINT_BOX_BY_PRODUCT.mug.back),
    "left-sleeve": pxBoxToRatio(PRINT_BOX_BY_PRODUCT.mug["left-sleeve"]),
    "right-sleeve": pxBoxToRatio(PRINT_BOX_BY_PRODUCT.mug["right-sleeve"]),
  },
};

export function getResponsivePrintBox(
  productId: string,
  side: Side = "front",
  area = MOCKUP_AREA,
): Box {
  const product =
    PRINT_BOX_RATIO_BY_PRODUCT[productId] || PRINT_BOX_RATIO_BY_PRODUCT.hoodie;

  const ratioBox = product[side] || product.front;

  return ratioBoxToPx(ratioBox, area);
}

export const GELATO_PRINT_SIZE_MM_BY_PRODUCT: ProductSideMap<PrintSizeMm> = {
  tshirt: {
    front: { widthMm: 300, heightMm: 400 },
    back: { widthMm: 300, heightMm: 400 },
    "left-sleeve": { widthMm: 300, heightMm: 400 },
    "right-sleeve": { widthMm: 300, heightMm: 400 },
  },
  hoodie: {
    front: { widthMm: 340, heightMm: 420 },
    back: { widthMm: 340, heightMm: 420 },
    "left-sleeve": { widthMm: 340, heightMm: 420 },
    "right-sleeve": { widthMm: 340, heightMm: 420 },
  },
  cap: {
    front: { widthMm: 120, heightMm: 55 },
    back: { widthMm: 80, heightMm: 30 },
    "left-sleeve": { widthMm: 120, heightMm: 55 },
    "right-sleeve": { widthMm: 120, heightMm: 55 },
  },
  mug: {
    front: { widthMm: 200, heightMm: 96 },
    back: { widthMm: 200, heightMm: 96 },
    "left-sleeve": { widthMm: 200, heightMm: 96 },
    "right-sleeve": { widthMm: 200, heightMm: 96 },
  },
};

export const MOCKUP_VISUAL_SCALE_BY_PRODUCT: ProductSideMap<number> = {
  tshirt: {
    front: 1,
    back: 0.85,
    "left-sleeve": 1,
    "right-sleeve": 1,
  },
  hoodie: {
    front: 0.9,
    back: 0.9,
    "left-sleeve": 0.9,
    "right-sleeve": 0.9,
  },
  cap: {
    front: 0.7,
    back: 0.7,
    "left-sleeve": 0.7,
    "right-sleeve": 0.7,
  },
  mug: {
    front: 0.75,
    back: 0.75,
    "left-sleeve": 0.75,
    "right-sleeve": 0.75,
  },
};
