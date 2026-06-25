import { getPrintBox, getSafeArea } from "../../canvas/canvasMath";
import { captureProductionDesign, captureVisualMockupPreview } from "../../preview/services/previewCapture";
import { buildProductionQualityReport, buildProductionRules } from "./productionValidation";
import type { EditorSide, PreviewPayloadInput } from "../types";

const PRODUCT_ALIASES: Record<string, string> = {
  "t-shirt": "tshirt",
  tshirts: "tshirt",
  tee: "tshirt",
  shirt: "tshirt",
  sweat: "hoodie",
  sweatshirt: "hoodie",
  hat: "cap",
  cup: "mug",
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

function normalizeCategory(value?: string) {
  const raw = String(value || "tshirt")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

  return PRODUCT_ALIASES[raw] || raw || "tshirt";
}

function elementsForSide(input: PreviewPayloadInput, side: DesignSide) {
  const sideElements = side === "back" ? input.backElements : input.frontElements;

  if (Array.isArray(sideElements)) return sideElements;
  if (input.side === side && Array.isArray(input.elements)) return input.elements;

  return [];
}

function finiteNumber(value: unknown, fallback?: number) {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return parsed;
  return fallback;
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
    src: typeof raw.src === "string" ? raw.src : undefined,
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
) {
  const printBox = input.side === side && input.printBox ? input.printBox : getPrintBox(category, side);
  const safeArea = input.side === side && input.safeArea ? input.safeArea : getSafeArea(printBox);

  return {
    side,
    elements: rawElements,
    mockupUrl: "",
    printBox,
    safeArea,
    printSize: {
      widthMm: 0,
      heightMm: 0,
    },
    exportResolution: {
      width: 1024,
      height: 1024,
    },
    validation: {
      status: "ready" as const,
      statusLabel: "Ready",
      dpi: null,
      warnings: [],
      printReady: true,
      riskLevel: "low" as const,
    },
  };
}


function getVisibleMockupRoot() {
  if (typeof document === "undefined") return null;
  const node = document.getElementById("mockup-export-root");
  return node instanceof HTMLElement ? node : null;
}

function hasDataImage(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:image/");
}

function buildSideDatabaseData(args: {
  side: DesignSide;
  elements: CleanElement[];
  printBox: unknown;
  safeArea: unknown;
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
    mockupUrl: null,
    quality: args.quality,
  };
}

export async function buildDesignSavePayload(input: PreviewPayloadInput) {
  const category = normalizeCategory(input.category);
  const productId = input.productId || category;
  const currentSide: DesignSide = input.side === "back" ? "back" : "front";

  const frontRawElements = elementsForSide(input, "front");
  const backRawElements = elementsForSide(input, "back");

  const frontSideData = makeSideData(input, category, "front", frontRawElements);
  const backSideData = makeSideData(input, category, "back", backRawElements);
  const currentSideData = currentSide === "back" ? backSideData : frontSideData;

  const currentDesignImage = await captureProductionDesign(currentSideData, {
    preferDom: true,
  });

  const frontDesignImage =
    currentSide === "front"
      ? currentDesignImage
      : frontRawElements.length
        ? await captureProductionDesign(frontSideData, { preferDom: false })
        : null;

  const backDesignImage =
    currentSide === "back"
      ? currentDesignImage
      : backRawElements.length
        ? await captureProductionDesign(backSideData, { preferDom: false })
        : null;

  const currentMockupImage = await captureVisualMockupPreview(getVisibleMockupRoot());

  const frontMockupImage =
    currentSide === "front" && hasDataImage(currentMockupImage)
      ? currentMockupImage
      : null;

  const backMockupImage =
    currentSide === "back" && hasDataImage(currentMockupImage)
      ? currentMockupImage
      : null;

  const frontElements = sanitizeElementsForDatabase(frontRawElements);
  const backElements = sanitizeElementsForDatabase(backRawElements);

  const frontQuality = buildProductionQualityReport({
    category,
    side: "front",
    elements: frontElements,
    safeArea: frontSideData.safeArea,
    mockupColor: input.mockupColor || input.color || "#ffffff",
  });

  const backQuality = buildProductionQualityReport({
    category,
    side: "back",
    elements: backElements,
    safeArea: backSideData.safeArea,
    mockupColor: input.mockupColor || input.color || "#ffffff",
  });

  const allIssues = [...frontQuality.issues, ...backQuality.issues];
  const hasBlockedSide = frontQuality.status === "blocked" || backQuality.status === "blocked";
  const hasReviewSide = frontQuality.status === "review" || backQuality.status === "review";

  const designData = {
    schemaVersion: 3,
    productId,
    category,
    variantId: null,
    status: "draft",
    color: input.color || input.mockupColor || "#ffffff",
    mockupColor: input.mockupColor || input.color || "#ffffff",
    sides: {
      front: buildSideDatabaseData({
        side: "front",
        elements: frontElements,
        printBox: frontSideData.printBox,
        safeArea: frontSideData.safeArea,
        quality: frontQuality,
      }),
      back: buildSideDatabaseData({
        side: "back",
        elements: backElements,
        printBox: backSideData.printBox,
        safeArea: backSideData.safeArea,
        quality: backQuality,
      }),
    },
    production: {
      coordinateMode: "safe-area-local",
      exportArea: "transparent-print-box",
      exportResolution: {
        width: 1024,
        height: 1024,
      },
      provider: "gelato",
      flattenOnlyOnOrder: true,
      previewIsNotProductionFile: true,
      transparentBackgroundRequired: true,
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
    variantId: null,
    markup: 0,
    cartStatus: "in_cart",
    status: "draft",
    color: input.color || input.mockupColor || "#ffffff",
    mockupColor: input.mockupColor || input.color || "#ffffff",

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
      front: hasDataImage(frontDesignImage) ? frontDesignImage : null,
      back: hasDataImage(backDesignImage) ? backDesignImage : null,
    },

    mockups: {
      front: hasDataImage(frontMockupImage) ? frontMockupImage : null,
      back: hasDataImage(backMockupImage) ? backMockupImage : null,
    },

    production: designData.production,
  };
}
