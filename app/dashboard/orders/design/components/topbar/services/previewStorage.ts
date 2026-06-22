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

function cloneElementForPreview(el: any) {
  const meta = { ...(el?.meta || {}) };

  return {
    ...el,
    x: Number(el?.x || 0),
    y: Number(el?.y || 0),
    width: Number(el?.width ?? meta.width ?? 1),
    height: Number(el?.height ?? meta.height ?? 1),
    fontFamily: el?.fontFamily || meta.fontFamily,
    fontSize: el?.fontSize || meta.fontSize,
    color: el?.color || meta.color || meta.fill,
    text: el?.text || el?.content || "",
    src: el?.src || el?.imageUrl || meta.src || meta.imageUrl,
    zIndex: Number(el?.zIndex || 0),
    meta: {
      ...meta,
      color: meta.color || el?.color || meta.fill,
      fill: meta.fill || meta.color || el?.color,
      fontFamily: meta.fontFamily || el?.fontFamily,
      fontSize: meta.fontSize || el?.fontSize,
      fontWeight: meta.fontWeight || el?.fontWeight || 900,
      opacity: meta.opacity ?? el?.opacity ?? 1,
      rotation: meta.rotation || el?.rotation || 0,
    },
  };
}

function normalizeElements(elements?: any[]) {
  return Array.isArray(elements) ? elements.map(cloneElementForPreview) : [];
}

async function captureDesignImage() {
  if (typeof window === "undefined") return null;

  const selectors = [
    "#design-safe-area",
    "[data-design-safe-area]",
    "[data-production-export-root]",
    "#mockup-export-root",
  ];

  const node = selectors
    .map((selector) => document.querySelector(selector))
    .find(Boolean) as HTMLElement | null;

  if (!node) {
    console.warn("PREVIEW CAPTURE: export node not found", selectors);
    return null;
  }

  try {
    const { toPng } = await import("html-to-image");

    await Promise.all(
      Array.from(node.querySelectorAll("img")).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) return resolve();
            const done = () => {
              img.removeEventListener("load", done);
              img.removeEventListener("error", done);
              resolve();
            };
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
          }),
      ),
    );

    return await toPng(node, {
      cacheBust: true,
      pixelRatio: 3,
      backgroundColor: "transparent",
      filter: (target) => {
        if (!(target instanceof HTMLElement)) return true;
        return !target.closest(
          "[data-editor-only], [data-element-control], [data-resize-handle], [data-selection-frame], [data-warning-frame], [data-guides], [data-canvas-guides]",
        );
      },
    });
  } catch (error) {
    console.warn("PREVIEW CAPTURE FAILED - using elements fallback", error);
    return null;
  }
}

export async function buildPreviewPayload(input: PreviewPayloadInput) {
  const category = normalizeCategory(input.category);
  const side = input.side === "back" ? "back" : "front";
  const printBox = input.printBox || getPrintBox(category, side);
  const safeArea = input.safeArea || getSafeArea(printBox);
  const designImage = input.designImage ?? (await captureDesignImage());
  const elements = normalizeElements(input.elements);
  const frontElements = normalizeElements(input.frontElements || (side === "front" ? input.elements || [] : []));
  const backElements = normalizeElements(input.backElements || (side === "back" ? input.elements || [] : []));

  const payload = {
    productId: input.productId || category,
    category,
    color: input.color || input.mockupColor,
    mockupColor: input.mockupColor,
    side,
    elements,
    frontElements,
    backElements,
    printBox,
    safeArea,
    designImage,
    generateMockupAI: true,
    ai: true,
    mockupMode: input.mockupMode || "on_model_ai",
    modelMockup: input.modelMockup ?? true,
    updatedAt: Date.now(),
  };

  console.info("PREVIEW PAYLOAD READY", {
    productId: payload.productId,
    category: payload.category,
    side: payload.side,
    elements: payload.elements.length,
    frontElements: payload.frontElements.length,
    backElements: payload.backElements.length,
    hasDesignImage: Boolean(payload.designImage),
  });

  return payload;
}

export async function storePreviewPayload(input: PreviewPayloadInput) {
  if (typeof window === "undefined") return null;

  const payload = await buildPreviewPayload(input);
  const serialized = JSON.stringify(payload);
  const key = `mynify-editor-preview:${payload.productId}`;
  localStorage.setItem(key, serialized);
  sessionStorage.setItem(key, serialized);

  if (input.productId && input.productId !== payload.productId) {
    localStorage.setItem(`mynify-editor-preview:${input.productId}`, serialized);
    sessionStorage.setItem(`mynify-editor-preview:${input.productId}`, serialized);
  }

  return payload;
}
