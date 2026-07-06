import { getPrintBox } from "../../canvas/canvasMath";
import {
  getConfiguredSafeArea,
  getGelatoPrintSizeMm,
  getMockupUrl,
  getMockupVisualScale,
  getProductionExportResolution,
} from "../../canvas/productConfig";
import { capturePreviewDesignOverlay } from "../../preview/services/previewCapture";
import type { PreviewPayloadInput } from "../types";

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

type Side = "front" | "back";

function normalizeCategory(value?: string) {
  const raw = String(value || "tshirt")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

  const withoutUuid = /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(raw) ? "tshirt" : raw;
  return PRODUCT_ALIASES[withoutUuid] || withoutUuid || "tshirt";
}

function elementsForSide(input: PreviewPayloadInput, side: Side) {
  const sideElements =
    side === "back" ? input.backElements : input.frontElements;

  // Prefer the explicit side array only when it is populated. If it is an empty
  // placeholder, fall back to the currently mounted editor elements for the
  // active side so preview/save never lose the actual design.
  if (Array.isArray(sideElements) && sideElements.length > 0) {
    return sideElements;
  }

  if (input.side === side && Array.isArray(input.elements) && input.elements.length > 0) {
    return input.elements;
  }

  return Array.isArray(sideElements) ? sideElements : [];
}

function sanitizeElementsForStorage(elements: any[]) {
  return (Array.isArray(elements) ? elements : []).map((element) => {
    const meta = { ...(element?.meta || {}) };

    delete meta.src;
    delete meta.image;
    delete meta.url;

    return {
      ...element,
      src:
        typeof element?.src === "string" &&
        element.src.startsWith("data:image/")
          ? undefined
          : element?.src,
      meta,
    };
  });
}

function sideData(input: PreviewPayloadInput, category: string, side: Side) {
  const sidePrintBox = input.printBoxes?.[side] || null;
  const sideSafeArea = input.safeAreas?.[side] || null;
  const printBox =
    sidePrintBox ||
    (input.side === side && input.printBox ? input.printBox : null) ||
    getPrintBox(category, side, input.productConfig);
  const safeArea =
    sideSafeArea ||
    (input.side === side && input.safeArea ? input.safeArea : null) ||
    getConfiguredSafeArea(category, side, input.productConfig);
  const elements = elementsForSide(input, side);

  return {
    side,
    elements,
    mockupUrl: getMockupUrl(category, side, input.productConfig),
    visualScale: getMockupVisualScale(category, side, input.productConfig),
    printBox,
    safeArea,
    printSize: getGelatoPrintSizeMm(category, side, input.productConfig),
    exportResolution: getProductionExportResolution(category, side, undefined, input.productConfig),
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

export async function buildPreviewPayload(input: PreviewPayloadInput) {
  const category = input.productConfig?.category || normalizeCategory(input.category);
  const productId = input.productId || category;
  const side: Side = input.side === "back" ? "back" : "front";

  const frontRawElements = elementsForSide(input, "front");
  const backRawElements = elementsForSide(input, "back");
  const currentElements = side === "back" ? backRawElements : frontRawElements;

  const currentSideData = sideData(input, category, side);
  const frontSideData = sideData(input, category, "front");
  const backSideData = sideData(input, category, "back");


  const currentDesignImage = await capturePreviewDesignOverlay(currentSideData);

  const frontDesignImage =
    side === "front"
      ? currentDesignImage
      : input.designImages?.front || null;

  const backDesignImage =
    side === "back"
      ? currentDesignImage
      : input.designImages?.back || null;

  const printBox = currentSideData.printBox;
  const safeArea = currentSideData.safeArea;
  const frontElements = sanitizeElementsForStorage(frontRawElements);
  const backElements = sanitizeElementsForStorage(backRawElements);
  const storedCurrentElements = side === "back" ? backElements : frontElements;

  const payload = {
    productId,
    category,
    color: input.color || input.mockupColor,
    mockupColor: input.mockupColor || input.color || "#ffffff",
    side,

    elements: storedCurrentElements,
    frontElements,
    backElements,

    printBox,
    safeArea,
    printBoxes: {
      front: frontSideData.printBox,
      back: backSideData.printBox,
    },
    safeAreas: {
      front: frontSideData.safeArea,
      back: backSideData.safeArea,
    },

    designImage: side === "back" ? backDesignImage : frontDesignImage,
    designImages: {
      front: frontDesignImage,
      back: backDesignImage,
    },

    designCoordinateMode: "safe-area-local",
    designImageMode: currentDesignImage
      ? "visual-preview-overlay-1024"
      : "missing-design-image",

    generateMockupAI: true,
    productConfig: input.productConfig || null,
    mockupSource: input.productConfig?.__source || input.productConfig?.source || "local",
    mockupKey: input.productConfig?.mockupKey || null,
    mockupUrls: {
      front: frontSideData.mockupUrl,
      back: backSideData.mockupUrl,
    },
    updatedAt: Date.now(),
  };

return payload;
}

function makeStorageSafePayload(payload: any) {
  return {
    ...payload,
    designImage: null,
    designImages: {
      front: null,
      back: null,
    },
    designImageMode: payload?.designImageMode
      ? `${payload.designImageMode}-memory-only`
      : "memory-only",
  };
}

function safeSetStorage(storage: Storage, key: string, payload: any) {
  try {
    storage.setItem(key, JSON.stringify(payload));
    return true;
  } catch {
  }

  try {
    storage.setItem(key, JSON.stringify(makeStorageSafePayload(payload)));
    return true;
  } catch {
    return false;
  }
}

export async function storePreviewPayload(input: PreviewPayloadInput) {
  if (typeof window === "undefined") {
    return null;
  }

  const payload = await buildPreviewPayload(input);
  const key = `ryfio-editor-preview:${payload.productId}`;

  const sessionStored = safeSetStorage(sessionStorage, key, payload);
  const localStored = safeSetStorage(localStorage, key, payload);


  return payload;
}
