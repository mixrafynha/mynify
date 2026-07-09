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
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INLINE_IMAGE_RE = /(?:data:image\/(?!svg\+xml)|base64,|blob:)/i;
const INLINE_SVG_IMAGE_RE = /^data:image\/svg\+xml(?:;[^,]*)?,/i;
const MAX_INLINE_SVG_CHARS = 120_000;
const LARGE_IMAGE_STRING_RE = /[A-Za-z0-9+/=]{500000,}/;

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
  const image = sanitizeImageSourceForDatabase(raw?.imageUrl || raw?.image) || null;
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
  if (!["tshirt", "hoodie", "cap", "mug"].includes(normalized)) {
    return DEFAULT_PRODUCT_CATEGORY;
  }

  return normalized;
}

function elementsForSide(input: PreviewPayloadInput, side: DesignSide) {
  const sideElements =
    side === "back" ? input.backElements : input.frontElements;

  // Prefer the explicit per-side array only when it actually contains artwork.
  // Some parents pass [] for frontElements/backElements while the live side data
  // is still in input.elements. Returning the empty side array drops the design
  // from save, Trigger print generation and checkout thumbnails.
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

function isPersistableInlineSvg(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();

  return (
    trimmed.length > 0 &&
    trimmed.length <= MAX_INLINE_SVG_CHARS &&
    INLINE_SVG_IMAGE_RE.test(trimmed) &&
    !/base64,/i.test(trimmed) &&
    !/blob:/i.test(trimmed)
  );
}

function isInlineImageReference(value: unknown): value is string {
  if (isPersistableInlineSvg(value)) return false;
  return typeof value === "string" && INLINE_IMAGE_RE.test(value);
}

function sanitizeImageSourceForDatabase(value: unknown) {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (isPersistableInlineSvg(trimmed)) return trimmed;
  if (INLINE_IMAGE_RE.test(trimmed)) return undefined;

  return trimmed;
}

function assertJsonOnlySavePayload(payload: unknown) {
  const json = JSON.stringify(payload);

  if (
    INLINE_IMAGE_RE.test(json) ||
    LARGE_IMAGE_STRING_RE.test(json)
  ) {
    throw new Error(
      "Save payload contains inline image data. Save Design must be JSON-only.",
    );
  }

  if (process.env.NODE_ENV === "development") {
    console.info(
      "[save-design] payload bytes",
      new TextEncoder().encode(json).length,
    );
  }
}

function sanitizeElementForDatabase(element: unknown): CleanElement | null {
  if (!element || typeof element !== "object") return null;

  const raw = element as RawElement;
  const meta = raw.meta && typeof raw.meta === "object" ? { ...raw.meta } : {};

  delete meta.selected;
  delete meta.hovered;
  delete meta.dragging;
  delete meta.resizing;
  delete meta.guides;
  delete meta.handles;
  delete meta.previewOnly;
  delete meta.domNode;
  delete meta.elementRef;

  if (isInlineImageReference(raw.src)) {
    meta.sourceType = "inline-image";
    meta.sourceOmittedFromDatabase = true;
    meta.sourceOmittedReason = "inline-image-not-allowed-in-save-payload";
  }

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
    src: sanitizeImageSourceForDatabase(raw.src),
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

  const pendingPrintFiles = {
    front: null,
    back: null,
    keys: {
      front: null,
      back: null,
    },
    status: "pending",
  } as const;

  const checkoutThumbnail = {
    checkout_thumbnail_url: null,
    checkout_thumbnail_status: "pending",
  } as const;

  const designData = {
    schemaVersion: 4,
    productId,
    category,
    mockupKey: input.productConfig?.mockupKey || null,
    gelatoProductUidFromProduct: input.productConfig?.gelatoProductUid || null,
    variantId: selectedVariantId,
    selectedVariant,
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
        mockupUrl: frontSideData.mockupUrl || null,
        quality: frontQuality,
      }),
      back: buildSideDatabaseData({
        side: "back",
        elements: backElements,
        printBox: backSideData.printBox,
        safeArea: backSideData.safeArea,
        mockupUrl: backSideData.mockupUrl || null,
        quality: backQuality,
      }),
    },
    mockupSource: input.productConfig?.__source || input.productConfig?.source || "local",
    mockupUrls: {
      front: frontSideData.mockupUrl || null,
      back: backSideData.mockupUrl || null,
    },
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
      fileDiagnostics: {
        front: {
          side: "front",
          hasArtwork: frontHasArtwork,
          generated: false,
          format: null,
          sizeBytes: 0,
          storedAsUrl: false,
          uploadedToStorage: false,
          omittedFromSavePayload: true,
          storageReason: "json-only-save-trigger-generates-assets",
          expectedPrintSizeMm: frontSideData.printSize,
          exportResolution: frontSideData.exportResolution,
          expectedDpi: (frontSideData.exportResolution as any).dpi || 300,
          exportArea: "transparent-print-box-only",
          includesMockup: false,
          includesEditorUi: false,
        },
        back: {
          side: "back",
          hasArtwork: backHasArtwork,
          generated: false,
          format: null,
          sizeBytes: 0,
          storedAsUrl: false,
          uploadedToStorage: false,
          omittedFromSavePayload: true,
          storageReason: "json-only-save-trigger-generates-assets",
          expectedPrintSizeMm: backSideData.printSize,
          exportResolution: backSideData.exportResolution,
          expectedDpi: (backSideData.exportResolution as any).dpi || 300,
          exportArea: "transparent-print-box-only",
          includesMockup: false,
          includesEditorUi: false,
        },
      },
      rules: buildProductionRules(),
      quality: {
        status: hasBlockedSide ? "blocked" : hasReviewSide ? "review" : "ready",
        printReady: !hasBlockedSide,
        issueCount: allIssues.length,
        issues: allIssues,
      },
    },
    printFiles: pendingPrintFiles,
    ...checkoutThumbnail,
  };

  const payload = {
    schemaVersion: 4,
    baseProductId: productId,
    productId,
    category,
    mockupKey: input.productConfig?.mockupKey || null,
    gelatoProductUidFromProduct: input.productConfig?.gelatoProductUid || null,
    variantId: selectedVariantId,
    selectedVariant,
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
    variantImage: sanitizeImageSourceForDatabase(
      selectedVariant?.imageUrl || selectedVariant?.image,
    ) || null,
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

    printFiles: pendingPrintFiles,
    printFileDiagnostics: designData.production.fileDiagnostics,

    mockups: {
      front: frontSideData.mockupUrl || null,
      back: backSideData.mockupUrl || null,
    },

    mockupSource: input.productConfig?.__source || input.productConfig?.source || "local",
    mockupUrls: {
      front: frontSideData.mockupUrl || null,
      back: backSideData.mockupUrl || null,
    },
    runtimeProductConfig: input.productConfig || null,

    production: designData.production,
    editorVersion: "json-only-save-v4",
    updatedAt: new Date().toISOString(),
    ...checkoutThumbnail,
  };

  assertJsonOnlySavePayload(payload);

  return payload;
}

