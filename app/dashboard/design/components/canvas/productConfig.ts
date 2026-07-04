import type { Box, Side } from "./types";
import { DPI, MOCKUP_AREA, SAFE_AREA_PADDING } from "./constants";

const BASE_MOCKUP_AREA = {
  width: 1024,
  height: 1024,
};

export type ProductSideMap<T> = Record<string, Partial<Record<Side, T>>>;

export type PrintSizeMm = {
  widthMm: number;
  heightMm: number;
};

export type ProductDisplayConfig = {
  __source?: "supabase" | "local" | string | null;
  source?: "supabase" | "local" | string | null;
  productId?: string | null;
  category?: string | null;
  gelatoProductUid?: string | null;
  gelatoProductName?: string | null;
  mockupKey?: string | null;
  mockups?: Partial<Record<Side, string | null>>;
  printAreas?: Partial<Record<Side, Box | null>>;
  safeAreas?: Partial<Record<Side, Box | null>>;
  printSizesMm?: Partial<Record<Side, PrintSizeMm | null>>;
  visualScale?: Partial<Record<Side, number | null>>;
};

const DEFAULT_PRINT_BOX: Box = { x: 344, y: 200, width: 332, height: 442 };
const DEFAULT_PRINT_SIZE_MM: PrintSizeMm = { widthMm: 300, heightMm: 400 };

const EMPTY_SIDE_MAP: Partial<Record<Side, string>> = {
  front: "",
  back: "",
  "left-sleeve": "",
  "right-sleeve": "",
};

/**
 * Deprecated compatibility export.
 * Runtime mockup URLs must come from ProductDisplayConfig.mockups, resolved from Supabase.
 * This object only preserves older category-normalization consumers while carrying no local mockup data.
 */
export const PRODUCTS: ProductSideMap<string> = {
  tshirt: EMPTY_SIDE_MAP,
  sweatshirt: EMPTY_SIDE_MAP,
  hoodie: EMPTY_SIDE_MAP,
  cap: EMPTY_SIDE_MAP,
  caps: EMPTY_SIDE_MAP,
  mug: EMPTY_SIDE_MAP,
};

/**
 * Deprecated compatibility export.
 * Runtime print sizes must come from ProductDisplayConfig.printSizesMm, resolved from Supabase.
 */
export const GELATO_PRINT_SIZE_MM_BY_PRODUCT: ProductSideMap<PrintSizeMm> = {
  fallback: {
    front: DEFAULT_PRINT_SIZE_MM,
    back: DEFAULT_PRINT_SIZE_MM,
    "left-sleeve": DEFAULT_PRINT_SIZE_MM,
    "right-sleeve": DEFAULT_PRINT_SIZE_MM,
  },
  tshirt: {
    front: DEFAULT_PRINT_SIZE_MM,
    back: DEFAULT_PRINT_SIZE_MM,
    "left-sleeve": DEFAULT_PRINT_SIZE_MM,
    "right-sleeve": DEFAULT_PRINT_SIZE_MM,
  },
};

function finiteNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isBox(value: unknown): value is Box {
  if (!value || typeof value !== "object") return false;
  const box = value as Partial<Box>;
  return [box.x, box.y, box.width, box.height].every((v) => Number.isFinite(Number(v)));
}

function normalizeBox(box: Box): Box {
  return {
    x: finiteNumber(box.x, 0),
    y: finiteNumber(box.y, 0),
    width: Math.max(1, finiteNumber(box.width, 1)),
    height: Math.max(1, finiteNumber(box.height, 1)),
  };
}

function isPrintSize(value: unknown): value is PrintSizeMm {
  if (!value || typeof value !== "object") return false;
  const size = value as Partial<PrintSizeMm>;
  return Number.isFinite(Number(size.widthMm)) && Number.isFinite(Number(size.heightMm));
}

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

export function getResponsivePrintBox(
  productId: string,
  side: Side = "front",
  area = MOCKUP_AREA,
  productConfig?: ProductDisplayConfig | null,
): Box {
  const configured = productConfig?.printAreas?.[side] || productConfig?.printAreas?.front;
  if (isBox(configured)) return normalizeBox(configured);

  return ratioBoxToPx(pxBoxToRatio(DEFAULT_PRINT_BOX), area);
}

export function getConfiguredSafeArea(
  productId: string,
  side: Side = "front",
  productConfig?: ProductDisplayConfig | null,
): Box {
  const configured = productConfig?.safeAreas?.[side] || productConfig?.safeAreas?.front;
  if (isBox(configured)) return normalizeBox(configured);

  const printBox = getResponsivePrintBox(productId, side, MOCKUP_AREA, productConfig);
  return {
    x: finiteNumber(printBox.x, 0) + SAFE_AREA_PADDING,
    y: finiteNumber(printBox.y, 0) + SAFE_AREA_PADDING,
    width: Math.max(0, finiteNumber(printBox.width, 0) - SAFE_AREA_PADDING * 2),
    height: Math.max(0, finiteNumber(printBox.height, 0) - SAFE_AREA_PADDING * 2),
  };
}

export function getGelatoPrintSizeMm(
  productId: string,
  side: Side = "front",
  productConfig?: ProductDisplayConfig | null,
): PrintSizeMm {
  const configured = productConfig?.printSizesMm?.[side] || productConfig?.printSizesMm?.front;
  if (isPrintSize(configured)) {
    return {
      widthMm: Math.max(1, finiteNumber(configured.widthMm, DEFAULT_PRINT_SIZE_MM.widthMm)),
      heightMm: Math.max(1, finiteNumber(configured.heightMm, DEFAULT_PRINT_SIZE_MM.heightMm)),
    };
  }

  return DEFAULT_PRINT_SIZE_MM;
}

export function mmToPxAtDpi(mm: number, dpi = DPI): number {
  return Math.max(1, Math.round((Math.max(1, mm) / 25.4) * dpi));
}

export function getProductionExportResolution(
  productId: string,
  side: Side = "front",
  dpi = DPI,
  productConfig?: ProductDisplayConfig | null,
): { width: number; height: number; dpi: number } {
  const printSize = getGelatoPrintSizeMm(productId, side, productConfig);
  return {
    width: mmToPxAtDpi(printSize.widthMm, dpi),
    height: mmToPxAtDpi(printSize.heightMm, dpi),
    dpi,
  };
}

export function getMockupVisualScale(
  productId: string,
  side: Side = "front",
  productConfig?: ProductDisplayConfig | null,
) {
  const configured = productConfig?.visualScale?.[side] ?? productConfig?.visualScale?.front;
  const parsed = Number(configured);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;

  return 1;
}

export function getMockupUrl(
  productId: string,
  side: Side = "front",
  productConfig?: ProductDisplayConfig | null,
) {
  const configured = productConfig?.mockups?.[side] || productConfig?.mockups?.front;
  if (typeof configured === "string" && configured.trim()) return configured.trim();

  return "";
}
