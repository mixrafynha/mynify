import type { Box, Side } from "./types";

export const FALLBACK_PRINT_BOX: Record<string, Record<Side, Box>> = {
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
