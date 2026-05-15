import type { Box, Side } from "./types";
import { MOCKUP_AREA } from "./constants";

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
    front: { x: 145, y: 150, width: 230, height: 276 },
    back: { x: 145, y: 135, width: 230, height: 300 },
  },

  hoodie: {
    front: { x: 165, y: 145, width: 190, height: 210 },
    back: { x: 145, y: 120, width: 230, height: 260 },
  },

  cap: {
    front: { x: 200, y: 255, width: 120, height: 55 },
    back: { x: 200, y: 258, width: 120, height: 45 },
  },

  mug: {
    front: { x: 150, y: 235, width: 220, height: 90 },
    back: { x: 150, y: 235, width: 220, height: 90 },
  },
};

export function pxBoxToRatio(box: Box): Box {
  return {
    x: box.x / MOCKUP_AREA.width,
    y: box.y / MOCKUP_AREA.height,
    width: box.width / MOCKUP_AREA.width,
    height: box.height / MOCKUP_AREA.height,
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
  const ratioBox =
    PRINT_BOX_RATIO_BY_PRODUCT?.[productId]?.[side] ||
    PRINT_BOX_RATIO_BY_PRODUCT?.[productId]?.front ||
    PRINT_BOX_RATIO_BY_PRODUCT.hoodie.front;

  return ratioBoxToPx(ratioBox, area);
}

export const GELATO_PRINT_SIZE_MM_BY_PRODUCT: Record<
  string,
  Record<Side, { widthMm: number; heightMm: number }>
> = {
  tshirt: {
    front: { widthMm: 300, heightMm: 400 },
    back: { widthMm: 300, heightMm: 400 },
  },

  hoodie: {
    front: { widthMm: 340, heightMm: 420 },
    back: { widthMm: 340, heightMm: 420 },
  },

  cap: {
    front: { widthMm: 120, heightMm: 55 },
    back: { widthMm: 120, heightMm: 45 },
  },

  mug: {
    front: { widthMm: 200, heightMm: 96 },
    back: { widthMm: 200, heightMm: 96 },
  },
};
