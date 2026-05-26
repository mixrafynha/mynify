import type { Box, Side } from "./types";
import { MOCKUP_AREA } from "./constants";

const BASE_MOCKUP_AREA = {
  width: 520,
  height: 640,
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

export const PRINT_BOX_BY_PRODUCT: Record<
  string,
  Record<Side, Box>
> = {
  tshirt: {
    front: {
      x: 145,
      y: 150,
      width: 230,
      height: 276,
    },

    back: {
      x: 145,
      y: 135,
      width: 230,
      height: 300,
    },
  },

  hoodie: {
    front: {
      x: 165,
      y: 145,
      width: 190,
      height: 210,
    },

    back: {
      x: 145,
      y: 170,
      width: 230,
      height: 260,
    },
  },

 cap: {
  front: {
    x: 195,
    y: 268,
    width: 140,
    height: 64,
  },

  back: {
    x: 232,
    y: 315,
    width: 70,
    height: 24,
  },
},

  mug: {
    front: {
      x: 150,
      y: 235,
      width: 220,
      height: 90,
    },

    back: {
      x: 150,
      y: 235,
      width: 220,
      height: 90,
    },
  },
};

export function pxBoxToRatio(box: Box): Box {
  return {
    x: box.x / BASE_MOCKUP_AREA.width,
    y: box.y / BASE_MOCKUP_AREA.height,
    width: box.width / BASE_MOCKUP_AREA.width,
    height:
      box.height / BASE_MOCKUP_AREA.height,
  };
}

export function ratioBoxToPx(
  box: Box,
  area = MOCKUP_AREA
): Box {
  return {
    x: Math.round(box.x * area.width),
    y: Math.round(box.y * area.height),

    width: Math.round(
      box.width * area.width
    ),

    height: Math.round(
      box.height * area.height
    ),
  };
}

export const PRINT_BOX_RATIO_BY_PRODUCT: Record<
  string,
  Record<Side, Box>
> = {
  tshirt: {
    front: pxBoxToRatio(
      PRINT_BOX_BY_PRODUCT.tshirt.front
    ),

    back: pxBoxToRatio(
      PRINT_BOX_BY_PRODUCT.tshirt.back
    ),
  },

  hoodie: {
    front: pxBoxToRatio(
      PRINT_BOX_BY_PRODUCT.hoodie.front
    ),

    back: pxBoxToRatio(
      PRINT_BOX_BY_PRODUCT.hoodie.back
    ),
  },

  cap: {
    front: pxBoxToRatio(
      PRINT_BOX_BY_PRODUCT.cap.front
    ),

    back: pxBoxToRatio(
      PRINT_BOX_BY_PRODUCT.cap.back
    ),
  },

  mug: {
    front: pxBoxToRatio(
      PRINT_BOX_BY_PRODUCT.mug.front
    ),

    back: pxBoxToRatio(
      PRINT_BOX_BY_PRODUCT.mug.back
    ),
  },
};

export function getResponsivePrintBox(
  productId: string,
  side: Side = "front",
  area = MOCKUP_AREA
): Box {
  const ratioBox =
    PRINT_BOX_RATIO_BY_PRODUCT?.[
      productId
    ]?.[side] ||
    PRINT_BOX_RATIO_BY_PRODUCT?.[
      productId
    ]?.front ||
    PRINT_BOX_RATIO_BY_PRODUCT.hoodie
      .front;

  return ratioBoxToPx(ratioBox, area);
}

export const GELATO_PRINT_SIZE_MM_BY_PRODUCT: Record<
  string,
  Record<
    Side,
    {
      widthMm: number;
      heightMm: number;
    }
  >
> = {
  tshirt: {
    front: {
      widthMm: 300,
      heightMm: 400,
    },

    back: {
      widthMm: 300,
      heightMm: 400,
    },
  },

  hoodie: {
    front: {
      widthMm: 340,
      heightMm: 420,
    },

    back: {
      widthMm: 340,
      heightMm: 420,
    },
  },

  // PRINT ONLY (NO EMBROIDERY)
cap: {
  front: {
    widthMm: 120,
    heightMm: 55,
  },

  back: {
    widthMm: 80,
    heightMm: 30,
  },
},

  mug: {
    front: {
      widthMm: 200,
      heightMm: 96,
    },

    back: {
      widthMm: 200,
      heightMm: 96,
    },
  },
};
export const MOCKUP_VISUAL_SCALE_BY_PRODUCT: Record<
  string,
  Record<Side, number>
> = {
  tshirt: {
    front: 1.62,
    back: 1.62,
  },

  hoodie: {
    front: 1.39,
    back: 1.48,
  },

  cap: {
    front: 0.90,
    back: 0.9,
  },

  mug: {
    front: 1.18,
    back: 1.18,
  },
};