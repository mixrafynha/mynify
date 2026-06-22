import { getPrintBox, getSafeArea } from "../../canvas/canvasMath";
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

function normalizeCategory(value?: string) {
  const raw = String(value || "tshirt").toLowerCase().trim().replace(/\s+/g, "-");
  return PRODUCT_ALIASES[raw] || raw || "tshirt";
}

async function captureDesignImage() {
  if (typeof window === "undefined") return null;

  const node = document.getElementById("design-safe-area") || document.getElementById("mockup-export-root");
  if (!node) return null;

  const { toPng } = await import("html-to-image");

  return toPng(node as HTMLElement, {
    cacheBust: true,
    pixelRatio: 3,
    backgroundColor: "transparent",
    filter: (target) => {
      if (!(target instanceof HTMLElement)) return true;
      return !target.closest("[data-editor-only], [data-element-control], [data-resize-handle], [data-selection-frame], [data-warning-frame]");
    },
  });
}

export async function buildPreviewPayload(input: PreviewPayloadInput) {
  const category = normalizeCategory(input.category);
  const side = input.side === "back" ? "back" : "front";
  const printBox = input.printBox || getPrintBox(category, side);
  const safeArea = input.safeArea || getSafeArea(printBox);
  const designImage = input.designImage ?? (await captureDesignImage());

  return {
    productId: input.productId,
    category,
    color: input.color || input.mockupColor,
    mockupColor: input.mockupColor,
    side,
    elements: Array.isArray(input.elements) ? input.elements : [],
    frontElements: Array.isArray(input.frontElements) ? input.frontElements : side === "front" ? input.elements || [] : [],
    backElements: Array.isArray(input.backElements) ? input.backElements : side === "back" ? input.elements || [] : [],
    printBox,
    safeArea,
    designImage,
    generateMockupAI: true,
    updatedAt: Date.now(),
  };
}

export async function storePreviewPayload(input: PreviewPayloadInput) {
  if (typeof window === "undefined" || !input.productId) return null;

  const payload = await buildPreviewPayload(input);
  const serialized = JSON.stringify(payload);
  const key = `mynify-editor-preview:${input.productId}`;
  localStorage.setItem(key, serialized);
  sessionStorage.setItem(key, serialized);
  return payload;
}
