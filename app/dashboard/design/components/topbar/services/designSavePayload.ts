import { getPrintBox } from "../../canvas/canvasMath";
import {
  getConfiguredSafeArea,
  getGelatoPrintSizeMm,
  getMockupUrl,
  getMockupVisualScale,
  getProductionExportResolution,
} from "../../canvas/productConfig";
import type {
  PreviewElement,
  PreviewSideData,
} from "../../preview/types/preview";
import {
  buildProductionQualityReport,
  buildProductionRules,
} from "./productionValidation";
import type {
  EditorSide,
  PreviewPayloadInput,
  SelectedProductVariant,
} from "../types";

const PRODUCT_ALIASES: Record<string, string> = {
  "t-shirt": "tshirt",
  tshirts: "tshirt",
  tee: "tshirt",
  shirt: "tshirt",
  sweat: "sweatshirt",
  sweatshirt: "sweatshirt",
  hat: "cap",
  cup: "mug",
};

const DEFAULT_PRODUCT_CATEGORY = "tshirt";
const UUID_LIKE_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;
const INLINE_IMAGE_MARKERS = ["data:image", "base64,", "blob:"];
const LARGE_IMAGE_STRING_RE = /[A-Za-z0-9+/=]{200000,}/;

const PRINT_FILES_PENDING = {
  front: null,
  back: null,
  keys: {
    front: null,
    back: null,
  },
  status: "pending" as const,
};

type DesignSide = EditorSide;
type CleanElement = Record<string, unknown>;

type RawElement = Record<string, unknown> & {
  id?: unknown;
  type?: unknown;
  x?: unknown;
  y?: unknown;
  width?: unknown;
  height?: unknown;
  rotation?: unknown;
  zIndex?: unknown;
  opacity?: unknown;
  text?: unknown;
  content?: unknown;
  src?: unknown;
  fill?: unknown;
  color?: unknown;
  fontFamily?: unknown;
  fontSize?: unknown;
  fontWeight?: unknown;
  fontStyle?: unknown;
  textAlign?: unknown;
  lineHeight?: unknown;
  letterSpacing?: unknown;
  borderRadius?: unknown;
  crop?: unknown;
  transform?: unknown;
  r2Key?: unknown;
  storageKey?: unknown;
  imageKey?: unknown;
  meta?: Record<string, unknown>;
};

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function cleanPrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSelectedVariant(
  input: PreviewPayloadInput,
): SelectedProductVariant | null {
  const raw =
    input.selectedVariant && typeof input.selectedVariant === "object"
      ? input.selectedVariant
      : null;

  const variantId = cleanString(input.variantId) || cleanString(raw?.variantId);
  const productColorId =
    cleanString(raw?.productColorId) || cleanString(raw?.colorId);
  const colorName = cleanString(raw?.colorName);
  const colorHex = cleanString(raw?.colorHex);
  const size = cleanString(raw?.size);
  const sku = cleanString(raw?.sku);
  const price = cleanPrice(raw?.variantPrice ?? raw?.price);
  const image = cleanString(raw?.imageUrl) || cleanString(raw?.image);
  const gelatoProductUid =
    cleanString(raw?.gelatoProductUid) ||
    cleanString(raw?.gelato_product_uid) ||
    cleanString(raw?.productUid) ||
    cleanString(raw?.product_uid);

  if (
    !variantId &&
    !productColorId &&
    !colorName &&
    !colorHex &&
    !size &&
    !sku &&
    price === null &&
    !image &&
    !gelatoProductUid
  ) {
    return null;
  }

  return {
    variantId,
    productColorId,
    colorId: productColorId,
    colorName,
    colorHex,
    size,
    sku,
    price,
    variantPrice: price,
    image,
    imageUrl: image,
    gelatoProductUid,
    gelato_product_uid: gelatoProductUid,
    productUid: gelatoProductUid,
    product_uid: gelatoProductUid,
  };
}

function normalizeCategory(value?: string) {
  const raw = String(value || DEFAULT_PRODUCT_CATEGORY)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

  if (!raw || UUID_LIKE_RE.test(raw)) return DEFAULT_PRODUCT_CATEGORY;

  const normalized = PRODUCT_ALIASES[raw] || raw;
  if (!["tshirt", "hoodie", "cap", "mug", "sweatshirt"].includes(normalized)) {
    return DEFAULT_PRODUCT_CATEGORY;
  }

  return normalized;
}

function elementsForSide(input: PreviewPayloadInput, side: DesignSide) {
  const sideElements =
    side === "back" ? input.backElements : input.frontElements;

  if (Array.isArray(sideElements) && sideElements.length > 0) return sideElements;

  if (input.side === side && Array.isArray(input.elements) && input.elements.length > 0) {
    return input.elements;
  }

  return Array.isArray(sideElements) ? sideElements : [];
}

function finiteNumber(value: unknown, fallback?: number) {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return parsed;
  return fallback;
}

function isInlineImageString(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const normalized = value.toLowerCase();
  return normalized.includes("data:image") || normalized.includes("base64,") || normalized.startsWith("blob:");
}

function sanitizeStringReference(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || isInlineImageString(trimmed)) return undefined;
  return trimmed;
}

function sanitizeJsonValue(value: unknown, depth = 0): unknown {
  if (depth > 8) return undefined;
  if (typeof value === "string") return sanitizeStringReference(value);
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined) return undefined;

  if (Array.isArray(value)) {
    const arr = value
      .map((item) => sanitizeJsonValue(item, depth + 1))
      .filter((item) => item !== undefined);
    return arr.length ? arr : undefined;
  }

  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    const clean: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(objectValue)) {
      if (
        [
          "src",
          "image",
          "imageData",
          "dataUrl",
          "base64",
          "blob",
          "file",
          "arrayBuffer",
          "preview",
          "previewImage",
          "designImage",
          "printImage",
          "canvasScreenshot",
        ].includes(key)
      ) {
        continue;
      }

      const sanitized = sanitizeJsonValue(nestedValue, depth + 1);
      if (sanitized !== undefined) clean[key] = sanitized;
    }

    return Object.keys(clean).length ? clean : undefined;
  }

  return undefined;
}

function sanitizeElementForDatabase(element: unknown): CleanElement | null {
  if (!element || typeof element !== "object") return null;

  const raw = element as RawElement;
  const meta = raw.meta && typeof raw.meta === "object"
    ? (sanitizeJsonValue(raw.meta) as Record<string, unknown> | undefined) || {}
    : {};

  delete meta.selected;
  delete meta.hovered;
  delete meta.dragging;
  delete meta.resizing;
  delete meta.guides;
  delete meta.handles;
  delete meta.previewOnly;
  delete meta.domNode;
  delete meta.elementRef;

  const clean: CleanElement = {
    id: raw.id,
    type: raw.type,
    x: finiteNumber(raw.x, 0),
    y: finiteNumber(raw.y, 0),
    width: finiteNumber(raw.width),
    height: finiteNumber(raw.height),
    rotation: finiteNumber(raw.rotation),
    zIndex: finiteNumber(raw.zIndex),
    opacity: finiteNumber(raw.opacity),
    text: typeof raw.text === "string" ? raw.text : undefined,
    content: typeof raw.content === "string" ? raw.content : undefined,
    src: sanitizeStringReference(raw.src),
    r2Key: sanitizeStringReference(raw.r2Key),
    storageKey: sanitizeStringReference(raw.storageKey),
    imageKey: sanitizeStringReference(raw.imageKey),
    crop: sanitizeJsonValue(raw.crop),
    transform: sanitizeJsonValue(raw.transform),
    fill: typeof raw.fill === "string" ? raw.fill : undefined,
    color: typeof raw.color === "string" ? raw.color : undefined,
    fontFamily: typeof raw.fontFamily === "string" ? raw.fontFamily : undefined,
    fontSize: finiteNumber(raw.fontSize),
    fontWeight: raw.fontWeight,
    fontStyle: raw.fontStyle,
    textAlign: raw.textAlign,
    lineHeight: raw.lineHeight,
    letterSpacing: raw.letterSpacing,
    borderRadius: raw.borderRadius,
    meta,
  };

  Object.keys(clean).forEach((key) => {
    if (clean[key] === undefined || clean[key] === null) delete clean[key];
  });

  return clean;
}

function sanitizeElementsForDatabase(elements: unknown[]) {
  return (Array.isArray(elements) ? elements : [])
    .map(sanitizeElementForDatabase)
    .filter((element): element is CleanElement => Boolean(element));
}

function makeSideData(
  input: PreviewPayloadInput,
  category: string,
  side: DesignSide,
  rawElements: unknown[],
): PreviewSideData {
  const printBox =
    input.side === side && input.printBox
      ? input.printBox
      : getPrintBox(category, side, input.productConfig);

  const safeArea =
    input.side === side && input.safeArea
      ? input.safeArea
      : getConfiguredSafeArea(category, side, input.productConfig);

  return {
    side,
    elements: rawElements as PreviewElement[],
    mockupUrl: getMockupUrl(category, side, input.productConfig),
    visualScale: getMockupVisualScale(category, side, input.productConfig),
    printBox,
    safeArea,
    printSize: getGelatoPrintSizeMm(category, side, input.productConfig),
    exportResolution: getProductionExportResolution(category, side, undefined, input.productConfig),
    validation: {
      status: "ready",
      statusLabel: "Ready",
      dpi: null,
      warnings: [],
      printReady: true,
      riskLevel: "low",
    },
  };
}

function hasPrintableElements(elements: unknown[]) {
  return (Array.isArray(elements) ? elements : []).some((element) => {
    if (!element || typeof element !== "object") return false;
    const raw = element as RawElement;
    if (raw.meta?.hidden) return false;
    return ["image", "text", "shape"].includes(String(raw.type || ""));
  });
}

function buildFileDiagnostics(args: {
  side: DesignSide;
  hasArtwork: boolean;
  printSize: { widthMm: number; heightMm: number };
  exportResolution: { width: number; height: number; dpi?: number };
}) {
  return {
    side: args.side,
    hasArtwork: args.hasArtwork,
    generated: false,
    format: null,
    sizeBytes: 0,
    storedAsUrl: false,
    uploadedToStorage: false,
    omittedFromSavePayload: true,
    storageReason: "generated-by-trigger-after-save",
    expectedPrintSizeMm: args.printSize,
    exportResolution: args.exportResolution,
    expectedDpi: args.exportResolution.dpi || 300,
    exportArea: "transparent-print-box-only",
    includesMockup: false,
    includesEditorUi: false,
  };
}

function buildSideDatabaseData(args: {
  side: DesignSide;
  elements: CleanElement[];
  printBox: unknown;
  safeArea: unknown;
  mockupUrl: string | null;
  quality: unknown;
}) {
  return {
    side: args.side,
    elements: args.elements,
    printBox: args.printBox,
    safeArea: args.safeArea,
    designImage: null,
    designImageUrl: null,
    printFileUrl: null,
    mockupUrl: args.mockupUrl,
    quality: args.quality,
  };
}

export function assertSavePayloadIsJsonOnly(payload: unknown) {
  const json = JSON.stringify(payload);

  if (
    INLINE_IMAGE_MARKERS.some((marker) => json.toLowerCase().includes(marker)) ||
    LARGE_IMAGE_STRING_RE.test(json)
  ) {
    throw new Error(
      "Save payload contains inline image data. Save Design must be JSON-only.",
    );
  }

  return json;
}

export function getSavePayloadBytes(json: string) {
  return new TextEncoder().encode(json).length;
}

export async function buildDesignSavePayload(input: PreviewPayloadInput) {
  const category = input.productConfig?.category || normalizeCategory(input.category);
  const productId = input.productId || category;
  const selectedVariant = normalizeSelectedVariant(input);
  const selectedVariantId = selectedVariant?.variantId || null;
  const selectedColor =
    selectedVariant?.colorHex || input.color || input.mockupColor || "#ffffff";

  const frontRawElements = elementsForSide(input, "front");
  const backRawElements = elementsForSide(input, "back");
  const frontHasArtwork = hasPrintableElements(frontRawElements);
  const backHasArtwork = hasPrintableElements(backRawElements);

  const frontSideData = makeSideData(input, category, "front", frontRawElements);
  const backSideData = makeSideData(input, category, "back", backRawElements);

  const frontElements = sanitizeElementsForDatabase(frontRawElements);
  const backElements = sanitizeElementsForDatabase(backRawElements);

  const frontQuality = buildProductionQualityReport({
    category,
    side: "front",
    elements: frontElements,
    safeArea: frontSideData.safeArea,
    mockupColor: input.mockupColor || input.color || "#ffffff",
    productConfig: input.productConfig,
  });

  const backQuality = buildProductionQualityReport({
    category,
    side: "back",
    elements: backElements,
    safeArea: backSideData.safeArea,
    mockupColor: input.mockupColor || input.color || "#ffffff",
    productConfig: input.productConfig,
  });

  const allIssues = [...frontQuality.issues, ...backQuality.issues];
  const hasBlockedSide =
    frontQuality.status === "blocked" || backQuality.status === "blocked";
  const hasReviewSide =
    frontQuality.status === "review" || backQuality.status === "review";

  const mockupKey = input.productConfig?.mockupKey || null;
  const mockupUrls = {
    front: frontSideData.mockupUrl || null,
    back: backSideData.mockupUrl || null,
  };

  const designData = {
    schemaVersion: 4,
    editorVersion: "json-only-save-v1",
    productId,
    category,
    mockupKey,
    gelatoProductUidFromProduct: input.productConfig?.gelatoProductUid || null,
    variantId: selectedVariantId,
    selectedVariant,
    selectedColor,
    productColorId:
      selectedVariant?.productColorId || selectedVariant?.colorId || null,
    size: selectedVariant?.size || null,
    sku: selectedVariant?.sku || null,
    gelatoProductUid:
      selectedVariant?.gelatoProductUid ||
      selectedVariant?.gelato_product_uid ||
      selectedVariant?.productUid ||
      selectedVariant?.product_uid ||
      null,
    gelato_product_uid:
      selectedVariant?.gelatoProductUid ||
      selectedVariant?.gelato_product_uid ||
      selectedVariant?.productUid ||
      selectedVariant?.product_uid ||
      null,
    variantPrice:
      selectedVariant?.variantPrice ?? selectedVariant?.price ?? null,
    status: "draft",
    color: selectedColor,
    mockupColor: input.mockupColor || selectedColor,
    sides: {
      front: buildSideDatabaseData({
        side: "front",
        elements: frontElements,
        printBox: frontSideData.printBox,
        safeArea: frontSideData.safeArea,
        mockupUrl: mockupUrls.front,
        quality: frontQuality,
      }),
      back: buildSideDatabaseData({
        side: "back",
        elements: backElements,
        printBox: backSideData.printBox,
        safeArea: backSideData.safeArea,
        mockupUrl: mockupUrls.back,
        quality: backQuality,
      }),
    },
    mockupSource: input.productConfig?.__source || input.productConfig?.source || "local",
    mockupUrls,
    runtimeProductConfig: input.productConfig || null,
    production: {
      coordinateMode: "safe-area-local",
      exportArea: "transparent-print-box-only",
      exportResolution: {
        front: frontSideData.exportResolution,
        back: backSideData.exportResolution,
      },
      printSizeMm: {
        front: frontSideData.printSize,
        back: backSideData.printSize,
      },
      provider: "gelato",
      flattenOnSave: false,
      flattenOnlyOnOrder: true,
      previewIsNotProductionFile: true,
      transparentBackgroundRequired: true,
      assetGeneration: "trigger-after-save",
      fileDiagnostics: {
        front: buildFileDiagnostics({
          side: "front",
          hasArtwork: frontHasArtwork,
          printSize: frontSideData.printSize,
          exportResolution: frontSideData.exportResolution,
        }),
        back: buildFileDiagnostics({
          side: "back",
          hasArtwork: backHasArtwork,
          printSize: backSideData.printSize,
          exportResolution: backSideData.exportResolution,
        }),
      },
      rules: buildProductionRules(),
      quality: {
        status: hasBlockedSide ? "blocked" : hasReviewSide ? "review" : "ready",
        printReady: !hasBlockedSide,
        issueCount: allIssues.length,
        issues: allIssues,
      },
    },
  };

  const payload = {
    schemaVersion: 4,
    editorVersion: "json-only-save-v1",
    updatedAt: new Date().toISOString(),
    baseProductId: productId,
    productId,
    category,
    mockupKey,
    gelatoProductUidFromProduct: input.productConfig?.gelatoProductUid || null,
    variantId: selectedVariantId,
    selectedVariant,
    selectedColor,
    productColorId:
      selectedVariant?.productColorId || selectedVariant?.colorId || null,
    colorId:
      selectedVariant?.colorId || selectedVariant?.productColorId || null,
    size: selectedVariant?.size || null,
    colorName: selectedVariant?.colorName || null,
    colorHex: selectedVariant?.colorHex || null,
    sku: selectedVariant?.sku || null,
    gelatoProductUid:
      selectedVariant?.gelatoProductUid ||
      selectedVariant?.gelato_product_uid ||
      selectedVariant?.productUid ||
      selectedVariant?.product_uid ||
      null,
    gelato_product_uid:
      selectedVariant?.gelatoProductUid ||
      selectedVariant?.gelato_product_uid ||
      selectedVariant?.productUid ||
      selectedVariant?.product_uid ||
      null,
    variantPrice:
      selectedVariant?.variantPrice ?? selectedVariant?.price ?? null,
    variantImage: selectedVariant?.imageUrl || selectedVariant?.image || null,
    markup: 0,
    cartStatus: "in_cart",
    status: "draft",
    color: selectedColor,
    mockupColor: input.mockupColor || selectedColor,

    designFront: frontElements,
    designBack: backElements,
    designData,
    design_data: designData,

    printBox: {
      front: frontSideData.printBox,
      back: backSideData.printBox,
    },
    safeArea: {
      front: frontSideData.safeArea,
      back: backSideData.safeArea,
    },

    printFiles: PRINT_FILES_PENDING,
    checkout_thumbnail_url: null,
    checkout_thumbnail_status: "pending" as const,

    mockups: mockupUrls,
    mockupSource: input.productConfig?.__source || input.productConfig?.source || "local",
    mockupUrls,
    runtimeProductConfig: input.productConfig || null,
    production: designData.production,
  };

  assertSavePayloadIsJsonOnly(payload);
  return payload;
}
