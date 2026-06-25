import { getPrintBox, getSafeArea } from "../../canvas/canvasMath";
import { captureProductionDesign } from "../../preview/services/previewCapture";
import type { PreviewPayloadInput } from "../types";

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

type Side = "front" | "back";

function normalizeCategory(value?: string) {
  const raw = String(value || "tshirt")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

  return PRODUCT_ALIASES[raw] || raw || "tshirt";
}

function elementsForSide(input: PreviewPayloadInput, side: Side) {
  const sideElements =
    side === "back" ? input.backElements : input.frontElements;

  if (Array.isArray(sideElements) && sideElements.length) {
    return sideElements;
  }

  if (input.side === side && Array.isArray(input.elements)) {
    return input.elements;
  }

  return [];
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
  const printBox =
    input.side === side && input.printBox
      ? input.printBox
      : getPrintBox(category, side);
  const safeArea =
    input.side === side && input.safeArea
      ? input.safeArea
      : getSafeArea(printBox);
  const elements = elementsForSide(input, side);

  return {
    side,
    elements,
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

export async function buildPreviewPayload(input: PreviewPayloadInput) {
  const category = normalizeCategory(input.category);
  const productId = input.productId || category;
  const side: Side = input.side === "back" ? "back" : "front";

  const frontRawElements = elementsForSide(input, "front");
  const backRawElements = elementsForSide(input, "back");
  const currentElements = side === "back" ? backRawElements : frontRawElements;

  const currentSideData = sideData(input, category, side);
  const frontSideData = sideData(input, category, "front");
  const backSideData = sideData(input, category, "back");

  console.log("PREVIEW BUILD START", {
    productId,
    category,
    side,
    frontElements: frontRawElements.length,
    backElements: backRawElements.length,
  });

  const currentDesignImage = await captureProductionDesign(currentSideData, {
    preferDom: true,
  });

  const frontDesignImage =
    side === "front"
      ? currentDesignImage
      : frontRawElements.length
        ? await captureProductionDesign(frontSideData, { preferDom: false })
        : null;

  const backDesignImage =
    side === "back"
      ? currentDesignImage
      : backRawElements.length
        ? await captureProductionDesign(backSideData, { preferDom: false })
        : null;

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

    designImage: side === "back" ? backDesignImage : frontDesignImage,
    designImages: {
      front: frontDesignImage,
      back: backDesignImage,
    },

    designCoordinateMode: "safe-area-local",
    designImageMode: currentDesignImage
      ? "generated-from-editor-dom"
      : "missing-design-image",

    generateMockupAI: true,
    updatedAt: Date.now(),
  };

  console.log("FINAL PAYLOAD", {
    side,
    hasDesignImage: !!payload.designImage,
    hasFrontDesignImage: !!payload.designImages.front,
    hasBackDesignImage: !!payload.designImages.back,
    designImageLength:
      typeof payload.designImage === "string"
        ? payload.designImage.length
        : null,
  });

  return payload;
}

export async function storePreviewPayload(input: PreviewPayloadInput) {
  if (typeof window === "undefined") {
    console.error("WINDOW UNDEFINED");
    return null;
  }

  const payload = await buildPreviewPayload(input);
  const key = `ryfio-editor-preview:${payload.productId}`;
  const value = JSON.stringify(payload);

  sessionStorage.setItem(key, value);

  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn("PREVIEW LOCAL STORAGE SKIPPED", error);
  }

  console.log("PREVIEW STORED", {
    key,
    hasDesignImage: !!payload.designImage,
    hasFrontDesignImage: !!payload.designImages.front,
    hasBackDesignImage: !!payload.designImages.back,
  });

  return payload;
}
