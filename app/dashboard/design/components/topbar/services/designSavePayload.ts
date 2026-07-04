import { getPrintBox } from "../../canvas/canvasMath";
import {
  getConfiguredSafeArea,
  getGelatoPrintSizeMm,
  getMockupUrl,
  getMockupVisualScale,
  getProductionExportResolution,
} from "../../canvas/productConfig";
import { captureProductionDesign } from "../../preview/services/previewCapture";
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
const DATA_IMAGE_PREFIX_RE = /^data:image\/[a-z0-9.+-]+;base64,/i;
const MAX_INLINE_DATABASE_IMAGE_BYTES = 180_000;
const MAX_INLINE_PRINT_FILE_BYTES = 4_500_000;

type ProductionFileUploadResult = {
  url: string | null;
  uploaded: boolean;
  omitted: boolean;
  reason: string | null;
  sizeBytes: number;
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
  if (!["tshirt", "hoodie", "cap", "mug"].includes(normalized)) {
    return DEFAULT_PRODUCT_CATEGORY;
  }

  return normalized;
}

function elementsForSide(input: PreviewPayloadInput, side: DesignSide) {
  const sideElements =
    side === "back" ? input.backElements : input.frontElements;

  if (Array.isArray(sideElements)) return sideElements;
  if (input.side === side && Array.isArray(input.elements))
    return input.elements;

  return [];
}

function finiteNumber(value: unknown, fallback?: number) {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return parsed;
  return fallback;
}

function estimateDataUrlBytes(value: unknown) {
  if (typeof value !== "string") return 0;
  if (!DATA_IMAGE_PREFIX_RE.test(value)) return 0;

  const commaIndex = value.indexOf(",");
  if (commaIndex < 0) return 0;

  const base64Length = value.length - commaIndex - 1;
  return Math.ceil((base64Length * 3) / 4);
}

function isDataImage(value: unknown): value is string {
  return typeof value === "string" && DATA_IMAGE_PREFIX_RE.test(value);
}

function shouldInlineDataImage(
  value: unknown,
  maxBytes = MAX_INLINE_DATABASE_IMAGE_BYTES,
) {
  if (!isDataImage(value)) return true;
  return estimateDataUrlBytes(value) <= maxBytes;
}

function sanitizeImageSourceForDatabase(value: unknown) {
  if (typeof value !== "string") return undefined;
  if (!isDataImage(value)) return value;
  if (shouldInlineDataImage(value)) return value;
  return undefined;
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

  if (isDataImage(raw.src) && !shouldInlineDataImage(raw.src)) {
    meta.sourceType = "data-image";
    meta.sourceOmittedFromDatabase = true;
    meta.sourceOmittedReason = "data-url-too-large";
    meta.sourceSizeBytes = estimateDataUrlBytes(raw.src);
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

function getVisibleMockupRoot() {
  if (typeof document === "undefined") return null;
  const node = document.getElementById("mockup-export-root");
  return node instanceof HTMLElement ? node : null;
}

function hasDataImage(value: unknown): value is string {
  return isDataImage(value);
}

function hasPrintableElements(elements: unknown[]) {
  return (Array.isArray(elements) ? elements : []).some((element) => {
    if (!element || typeof element !== "object") return false;
    const raw = element as RawElement;
    if (raw.meta?.hidden) return false;
    return ["image", "text", "shape"].includes(String(raw.type || ""));
  });
}

async function uploadProductionFile(args: {
  dataUrl: string | null;
  side: DesignSide;
  productId: string;
  category: string;
  variantId: string | null;
}): Promise<ProductionFileUploadResult> {
  const sizeBytes = estimateDataUrlBytes(args.dataUrl);

  if (!hasDataImage(args.dataUrl)) {
    return {
      url: null,
      uploaded: false,
      omitted: false,
      reason: "not-generated",
      sizeBytes,
    };
  }

  // Do not call /api/user-products/save-design/upload-production-file here.
  // That route is not part of the backend package. The canonical backend
  // already receives printFiles.front/back as data URLs in /api/user-products/save-design
  // and uploads them to R2 there, returning stable R2 URLs and keys.
  // Returning the data URL here keeps the frontend payload compatible with
  // the existing save-design backend and removes the 404 pre-upload request.
  return {
    url: args.dataUrl,
    uploaded: false,
    omitted: false,
    reason:
      sizeBytes > MAX_INLINE_PRINT_FILE_BYTES
        ? "backend-upload-on-save-large-data-url"
        : "backend-upload-on-save",
    sizeBytes,
  };
}

function buildFileDiagnostics(args: {
  side: DesignSide;
  hasArtwork: boolean;
  dataUrl: string | null;
  uploadedFile?: ProductionFileUploadResult;
  printSize: { widthMm: number; heightMm: number };
  exportResolution: { width: number; height: number; dpi?: number };
}) {
  const upload = args.uploadedFile;
  return {
    side: args.side,
    hasArtwork: args.hasArtwork,
    generated: hasDataImage(args.dataUrl),
    format: hasDataImage(args.dataUrl) ? "png-rgba" : null,
    sizeBytes: estimateDataUrlBytes(args.dataUrl),
    storedAsUrl: Boolean(upload?.uploaded),
    uploadedToStorage: Boolean(upload?.uploaded),
    omittedFromSavePayload: Boolean(upload?.omitted),
    storageReason: upload?.reason || null,
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

export async function buildDesignSavePayload(input: PreviewPayloadInput) {
  const category = input.productConfig?.category || normalizeCategory(input.category);
  const productId = input.productId || category;
  const currentSide: DesignSide = input.side === "back" ? "back" : "front";
  const selectedVariant = normalizeSelectedVariant(input);
  const selectedVariantId = selectedVariant?.variantId || null;
  const selectedColor =
    selectedVariant?.colorHex || input.color || input.mockupColor || "#ffffff";

  const frontRawElements = elementsForSide(input, "front");
  const backRawElements = elementsForSide(input, "back");
  const frontHasArtwork = hasPrintableElements(frontRawElements);
  const backHasArtwork = hasPrintableElements(backRawElements);

  const frontSideData = makeSideData(
    input,
    category,
    "front",
    frontRawElements,
  );
  const backSideData = makeSideData(input, category, "back", backRawElements);
  const currentSideData = currentSide === "back" ? backSideData : frontSideData;

  const currentDesignImage = hasPrintableElements(currentSideData.elements)
    ? await captureProductionDesign(currentSideData)
    : null;

  if (hasPrintableElements(currentSideData.elements) && !hasDataImage(currentDesignImage)) {
    throw new Error(
      `Production capture failed for ${currentSide}. Save blocked to prevent a non-printable Gelato file.`,
    );
  }

  const frontDesignImage =
    currentSide === "front"
      ? currentDesignImage
      : input.designImages?.front || null;

  const backDesignImage =
    currentSide === "back"
      ? currentDesignImage
      : input.designImages?.back || null;


  // Only the currently mounted side can be captured from the real preview DOM.
  // Do not block save because the opposite side is not mounted; that caused false
  // Saving Design failures when designs had cached/legacy data for another side.
  // The current side is still strictly protected above: if it has artwork and DOM
  // capture fails, save is blocked to avoid sending a bad Gelato file.

  const frontProductionFile = await uploadProductionFile({
    dataUrl: hasDataImage(frontDesignImage) ? frontDesignImage : null,
    side: "front",
    productId,
    category,
    variantId: selectedVariantId,
  });

  const backProductionFile = await uploadProductionFile({
    dataUrl: hasDataImage(backDesignImage) ? backDesignImage : null,
    side: "back",
    productId,
    category,
    variantId: selectedVariantId,
  });

  if (frontHasArtwork && frontProductionFile.omitted) {
    throw new Error(
      `Front production print file is too large for JSON and could not be uploaded to storage: ${frontProductionFile.reason}`,
    );
  }

  if (backHasArtwork && backProductionFile.omitted) {
    throw new Error(
      `Back production print file is too large for JSON and could not be uploaded to storage: ${backProductionFile.reason}`,
    );
  }

  // Keep the save request small enough for Vercel serverless limits.
  // Production files are still sent in printFiles.front/back; visual mockup
  // previews are non-production data and can be rebuilt from mockupUrls + design data.
  const frontMockupImage: string | null = null;
  const backMockupImage: string | null = null;

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

  const designData = {
    schemaVersion: 3,
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
      flattenOnSave: true,
      flattenOnlyOnOrder: false,
      previewIsNotProductionFile: true,
      transparentBackgroundRequired: true,
      fileDiagnostics: {
        front: buildFileDiagnostics({
          side: "front",
          hasArtwork: frontHasArtwork,
          dataUrl: hasDataImage(frontDesignImage) ? frontDesignImage : null,
          uploadedFile: frontProductionFile,
          printSize: frontSideData.printSize,
          exportResolution: frontSideData.exportResolution,
        }),
        back: buildFileDiagnostics({
          side: "back",
          hasArtwork: backHasArtwork,
          dataUrl: hasDataImage(backDesignImage) ? backDesignImage : null,
          uploadedFile: backProductionFile,
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

  return {
    schemaVersion: 3,
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
    variantImage: selectedVariant?.imageUrl || selectedVariant?.image || null,
    markup: 0,
    cartStatus: "in_cart",
    status: "draft",
    color: selectedColor,
    mockupColor: input.mockupColor || selectedColor,

    designFront: frontElements,
    designBack: backElements,
    design_data: designData,

    printBox: {
      front: frontSideData.printBox,
      back: backSideData.printBox,
    },
    safeArea: {
      front: frontSideData.safeArea,
      back: backSideData.safeArea,
    },

    printFiles: {
      front: frontProductionFile.url,
      back: backProductionFile.url,
    },

    printFileDiagnostics: {
      front: frontProductionFile,
      back: backProductionFile,
    },

    mockups: {
      front: hasDataImage(frontMockupImage) ? frontMockupImage : undefined,
      back: hasDataImage(backMockupImage) ? backMockupImage : undefined,
    },

    mockupSource: input.productConfig?.__source || input.productConfig?.source || "local",
    mockupUrls: {
      front: frontSideData.mockupUrl || null,
      back: backSideData.mockupUrl || null,
    },
    runtimeProductConfig: input.productConfig || null,

    production: designData.production,
  };
}
