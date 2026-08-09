"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import Canvas from "@/app/dashboard/design/components/Canvas";
import TopBar from "@/app/dashboard/design/components/TopBar";
import EditorShell from "@/app/dashboard/design/components/EditorShell";
import ToolbarFAB from "@/app/dashboard/design/components/toolbar/ToolbarFAB";
import AuthPopup from "@/app/dashboard/design/components/toolbar/panels/AuthPopup";
import {
  captureVisualMockupPreview,
  captureVisualMockupPreviewBlob,
} from "@/app/dashboard/design/components/preview/services/previewCapture";
import { buildDesignSavePayload } from "@/app/dashboard/design/components/topbar/services/designSavePayload";
import { loadEditorFont } from "@/app/dashboard/design/components/data/fonts";
import ProductionCaptureLayers from "@/app/dashboard/design/components/capture/ProductionCaptureLayers";
import type { ProductDisplayConfig } from "@/app/dashboard/design/components/canvas/productConfig";
import type { CanvasColorOption } from "@/app/dashboard/design/components/canvas/hooks/useCanvasColors";
import { supabase } from "@/lib/supabase";

import { useElements } from "@/features/elements/useElements";
import { useUpload } from "@/features/upload/useUpload";

export type ElementType = {
  id: string;
  type: "image" | "text" | "shape";
  src?: string;
  text?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontFamily?: string;
  meta?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    [key: string]: any;
  };
};

type Side = "front" | "back";

type HistoryState = {
  frontElements: ElementType[];
  backElements: ElementType[];
};

type EditorVariantSelection = {
  variantId: string | null;
  productColorId: string | null;
  colorId: string | null;
  size: string | null;
  colorName: string | null;
  colorHex: string | null;
  sku: string | null;
  price: string | null;
  variantPrice: string | null;
  currency: string | null;
  image: string | null;
  imageUrl: string | null;
  printPricing?: Record<string, any> | null;
  gelatoAttributes?: Record<string, any> | null;
};

type SearchParamReader = { get: (name: string) => string | null };

type StoredEditorDraft = {
  designId?: string | null;
  side?: Side;
  zoom?: number;
  frontZoom?: number;
  backZoom?: number;
  mockupColor?: string | null;
  frontElements?: ElementType[];
  backElements?: ElementType[];
  selectedVariant?: EditorVariantSelection | null;
  updatedAt?: number;
};

function assertSavePayloadIsJsonOnly(payload: unknown) {
  const json = JSON.stringify(payload);

  if (/(?:data:image\/(?!svg\+xml)|base64,|blob:)/i.test(json) || /[A-Za-z0-9+/=]{500000,}/.test(json)) {
    throw new Error(
      "Save payload contains inline raster image data. Save Design must stay JSON-safe.",
    );
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[save-design] payload bytes", new TextEncoder().encode(json).length);
  }

  return json;
}

function readSearchParam(params: SearchParamReader, keys: string[]) {
  for (const key of keys) {
    const value = params.get(key);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function normalizeHexColor(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed)) {
    return trimmed;
  }
  if (/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed)) {
    return `#${trimmed}`;
  }
  return null;
}

function clampEditorZoom(value: unknown, fallback = 1) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const maxZoom = typeof window !== "undefined" && window.innerWidth < 1024 ? 6 : 4;
  return Math.min(maxZoom, Math.max(0.25, value));
}

function shortenUrl(field: string, value: unknown) {
  const url = typeof value === "string" && value.trim() ? value.trim() : null;
  if (!url) {
    return { field, value: null };
  }

  return {
    field,
    value: {
      start: url.slice(0, 80),
      end: url.slice(-30),
      length: url.length,
    },
  };
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

async function imageBlobToWebPBlob(
  sourceBlob: Blob,
  maxSize = 1400,
  quality = 0.85,
): Promise<Blob | null> {
  if (typeof window === "undefined") {
    throw new Error("Preview blob conversion requires the browser window");
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "sync";
    image.onload = () => {
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;

      if (!width || !height) {
        resolve(null);
        return;
      }

      const scale = Math.min(1, maxSize / Math.max(width, height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));

      const context = canvas.getContext("2d");
      if (!context) {
        resolve(null);
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob), "image/webp", quality);
    };
    image.onerror = () => resolve(null);
    image.src = URL.createObjectURL(sourceBlob);
  });
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Failed to convert preview blob to data URL"));
    reader.readAsDataURL(blob);
  });
}

function blobToPreviewFile(blob: Blob, side: Side) {
  return new File([blob], `${side}-preview.webp`, {
    type: blob.type || "image/webp",
  });
}

function cloneElementsForStorage(elements: ElementType[]) {
  if (!Array.isArray(elements)) return [];

  return elements.map((element) => ({
    ...element,
    meta: element.meta ? { ...element.meta } : element.meta,
  }));
}

function collectSavedTextFonts(...groups: ElementType[][]) {
  const families = new Set<string>();

  groups.flat().forEach((element) => {
    if (!element || element.type !== "text") return;

    const family = element.fontFamily || element.meta?.fontFamily;
    if (typeof family === "string" && family.trim()) {
      families.add(family.trim());
    }
  });

  return Array.from(families);
}

function isRenderableDesignElement(element: unknown) {
  if (!element || typeof element !== "object") return false;

  const value = element as {
    type?: unknown;
    meta?: { hidden?: unknown };
    src?: unknown;
    content?: unknown;
    text?: unknown;
  };

  if (value.meta?.hidden === true) return false;

  const type = String(value.type || "").toLowerCase();
  const hasText = typeof value.text === "string" && value.text.trim().length > 0;
  const hasSource =
    typeof value.src === "string" && value.src.trim().length > 0 ||
    typeof value.content === "string" && value.content.trim().length > 0;

  return (
    ["image", "text", "shape", "group", "svg", "path", "raster", "bitmap"].includes(type) ||
    hasText ||
    hasSource
  );
}

function hasRenderableDesignForSide(elements: ElementType[]) {
  return Array.isArray(elements) && elements.some(isRenderableDesignElement);
}

function resolveUsedDesignSides(front: ElementType[], back: ElementType[]) {
  const usedSides: Side[] = [];

  if (hasRenderableDesignForSide(front)) usedSides.push("front");
  if (hasRenderableDesignForSide(back)) usedSides.push("back");

  return usedSides;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error(`${label} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);
}

type PreviewDebugStage =
  | "save_completed"
  | "capture_started"
  | "node_found"
  | "node_dimensions_valid"
  | "fonts_ready"
  | "images_decoded"
  | "blob_created"
  | "persistence_started"
  | "persistence_response"
  | "navigation_started"
  | "capture_failed"
  | "persistence_failed";

type PreviewDebugPayload = {
  userProductId: string;
  stage: PreviewDebugStage;
  side?: Side | null;
  nodeWidth?: number | null;
  nodeHeight?: number | null;
  blobSize?: number | null;
  blobType?: string | null;
  httpStatus?: number | null;
  error?: string | null;
};

async function reportPreviewStage(payload: PreviewDebugPayload) {
  try {
    await fetch("/api/debug/preview-flow", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.warn("[preview-flow] debug report failed", {
      userProductId: payload.userProductId,
      stage: payload.stage,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function hydrateSavedTextFonts(...groups: ElementType[][]) {
  const families = collectSavedTextFonts(...groups);

  try {
    await Promise.all(families.map((family) => loadEditorFont(family)));
    await (document.fonts?.ready ?? Promise.resolve());
  } catch {
    // Font hydration must not make a saved design impossible to open.
  }
}

function normalizeSideMap(value: any) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function normalizeMockupVisualScale(value: any) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function buildProductDisplayConfig(
  product: any,
  mockup: any,
): ProductDisplayConfig {
  const category = String(
    mockup?.category || product?.category || "tshirt",
  ).toLowerCase();
  const frontUrl =
    typeof mockup?.front_url === "string" && mockup.front_url.trim()
      ? mockup.front_url.trim()
      : null;
  const backUrl =
    typeof mockup?.back_url === "string" && mockup.back_url.trim()
      ? mockup.back_url.trim()
      : frontUrl;

  return {
    __source: "supabase",
    source: "supabase",
    // Keep ProductDisplayConfig compatible with the old category-based editor
    // fallback. The real DB product id still travels separately as productId
    // in save/export payloads.
    productId: category,
    category,
    gelatoProductUid: null,
    gelatoProductName: null,
    mockupKey: product?.mockup_key || mockup?.key || null,
    mockups: {
      front: frontUrl,
      back: backUrl,
      "left-sleeve": frontUrl,
      "right-sleeve": frontUrl,
    },
    printAreas: normalizeSideMap(mockup?.print_areas),
    safeAreas: normalizeSideMap(mockup?.safe_areas),
    printSizesMm: normalizeSideMap(mockup?.print_sizes_mm),
    visualScale: normalizeMockupVisualScale(mockup?.mockup_visual_scale),
  };
}

function publishEditorDebug(_payload: Record<string, any>) {
  // Debug globals and editor console logging are intentionally disabled.
}


function buildVariantSelection(
  params: SearchParamReader,
): EditorVariantSelection | null {
  const variantId = readSearchParam(params, [
    "variantId",
    "variant_id",
    "selectedVariantId",
  ]);
  const productColorId = readSearchParam(params, [
    "productColorId",
    "product_color_id",
    "colorId",
    "color_id",
  ]);
  const size = readSearchParam(params, ["size", "variantSize"]);
  const colorName = readSearchParam(params, [
    "colorName",
    "color",
    "variantColor",
  ]);
  const colorHex = normalizeHexColor(
    readSearchParam(params, ["colorHex", "hex", "mockupColor"]),
  );
  const sku = readSearchParam(params, ["sku", "variantSku"]);
  const price = readSearchParam(params, ["variantPrice", "price"]);
  const currency = readSearchParam(params, [
    "currency",
    "selectedCurrency",
    "productCurrency",
  ])?.toUpperCase() || null;
  const image = readSearchParam(params, ["variantImage"]);

  if (
    !variantId &&
    !productColorId &&
    !size &&
    !colorName &&
    !colorHex &&
    !sku &&
    !price &&
    !currency &&
    !image
  ) {
    return null;
  }

  return {
    variantId,
    productColorId,
    colorId: productColorId,
    size,
    colorName,
    colorHex,
    sku,
    price,
    variantPrice: price,
    currency,
    image: null,
    imageUrl: null,
    printPricing: null,
    gelatoAttributes: null,
  };
}

export default function EditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId =
    searchParams.get("productId") || searchParams.get("baseProductId");
  const category = String(params?.id || "tshirt").toLowerCase();
  const initialSelectedVariant = useMemo(
    () => buildVariantSelection(searchParams),
    [searchParams],
  );
  const [selectedVariant, setSelectedVariant] = useState<EditorVariantSelection | null>(initialSelectedVariant);

  const fileRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLDivElement>(null);
  const frontStageRef = useRef<HTMLDivElement>(null);
  const backStageRef = useRef<HTMLDivElement>(null);
  const hydratedStorageKeyRef = useRef<string | null>(null);
  const lastSavedSerializedRef = useRef<string | null>(null);
  const isHistoryAction = useRef(false);
  const pendingSaveAfterAuthRef = useRef(false);
  const baseMockupsRef = useRef<ProductDisplayConfig["mockups"]>({});
  const draftDesignIdRef = useRef<string | null>(null);
  const latestStateRef = useRef<{
    side: Side;
    elements: ElementType[];
    frontElements: ElementType[];
    backElements: ElementType[];
    mockupColor: string;
    selectedVariant: EditorVariantSelection | null;
    productConfig: ProductDisplayConfig | null;
    productConfigLoaded: boolean;
    draftHydrated: boolean;
    saving: boolean;
  }>({
    side: "front",
    elements: [],
    frontElements: [],
    backElements: [],
    mockupColor: "#ffffff",
    selectedVariant: null,
    productConfig: null,
    productConfigLoaded: false,
    draftHydrated: false,
    saving: false,
  });

  useEffect(() => {
    setSelectedVariant(initialSelectedVariant);
  }, [initialSelectedVariant]);

  const editorStorageKey = useMemo(
    () =>
      `editor-design:${productId || category || "draft"}:${initialSelectedVariant?.variantId || "default"}`,
    [productId, category, initialSelectedVariant?.variantId],
  );

  const [draftHydrated, setDraftHydrated] = useState(false);
  const [side, setSide] = useState<Side>("front");
  const [saving, setSaving] = useState(false);
  const [authPopupOpen, setAuthPopupOpen] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<ElementType | null>(
    null,
  );

  const [frontZoom, setFrontZoom] = useState(1);
  const [backZoom, setBackZoom] = useState(1);
  const [mockupColor, setMockupColor] = useState(
    selectedVariant?.colorHex || "#ffffff",
  );
  const [productConfig, setProductConfig] =
    useState<ProductDisplayConfig | null>(null);
  const [productConfigLoaded, setProductConfigLoaded] = useState(false);

  const [frontElements, setFrontElements] = useState<ElementType[]>([]);
  const [backElements, setBackElements] = useState<ElementType[]>([]);

  useEffect(() => {
    if (selectedVariant?.colorHex && !draftHydrated) {
      setMockupColor(selectedVariant.colorHex);
    }
  }, [selectedVariant?.colorHex, draftHydrated]);

  useEffect(() => {
    const variantId = selectedVariant?.variantId;
    if (!variantId) return;

    let cancelled = false;

    async function hydrateVariantPricing() {
      const { data, error } = await supabase
        .from("product_variants")
        .select("id,gelato_attributes")
        .eq("id", variantId)
        .maybeSingle();

      if (cancelled || error || !data) return;
      const gelatoAttributes = data.gelato_attributes && typeof data.gelato_attributes === "object"
        ? data.gelato_attributes as Record<string, any>
        : null;
      const printPricing = gelatoAttributes?.printPricing && typeof gelatoAttributes.printPricing === "object"
        ? gelatoAttributes.printPricing as Record<string, any>
        : null;

      setSelectedVariant((current) => {
        if (!current || current.variantId !== variantId) return current;
        if (current.gelatoAttributes === gelatoAttributes && current.printPricing === printPricing) return current;
        return {
          ...current,
          gelatoAttributes,
          printPricing,
        };
      });
    }

    void hydrateVariantPricing();
    return () => {
      cancelled = true;
    };
  }, [selectedVariant?.variantId]);

  useEffect(() => {
    let cancelled = false;

    async function loadProductConfig() {
      const identifier = productId || category;
      setProductConfigLoaded(false);

      if (!identifier) {
        if (!cancelled) {
          publishEditorDebug({
            source: "local",
            reason: "missing_identifier",
            productId,
            category,
            product: null,
            mockup: null,
            runtimeConfig: null,
          });
          setProductConfig(null);
          setProductConfigLoaded(true);
        }
        return;
      }

      try {
        const productQuery = supabase
          .from("products")
          .select("id,category,mockup_key");

        const { data: product, error } = productId
          ? await productQuery.eq("id", productId).maybeSingle()
          : await productQuery.eq("category", category).maybeSingle();

        if (error || !product) {
          if (!cancelled) {
            publishEditorDebug({
              source: "local",
              reason: "product_not_found",
              productId,
              category,
              error,
              product: null,
              mockup: null,
              runtimeConfig: null,
            });
            setProductConfig(null);
          }
          return;
        }

        let mockup: any = null;
        if (product.mockup_key) {
          const { data: mockupData, error: mockupError } = await supabase
            .from("product_mockups")
            .select(
              "key,category,name,front_url,back_url,print_areas,safe_areas,print_sizes_mm,mockup_visual_scale",
            )
            .eq("key", product.mockup_key)
            .maybeSingle();

          if (mockupError || !mockupData) {
          }

          mockup = mockupData || null;
        } else {
        }

        if (!cancelled) {
          const runtimeConfig = mockup
            ? buildProductDisplayConfig(product, mockup)
            : null;

          publishEditorDebug({
            source: runtimeConfig ? "supabase" : "local",
            reason: runtimeConfig
              ? "product_mockup_loaded"
              : "mockup_missing_or_empty_key",
            productId: product.id,
            category: product.category,
            mockupKey: product.mockup_key,
            product,
            mockup,
            runtimeConfig,
          });

          baseMockupsRef.current = runtimeConfig?.mockups || {};
          setProductConfig(runtimeConfig);
        }
      } catch (error) {
        if (!cancelled) {
          publishEditorDebug({
            source: "local",
            reason: "supabase_mockup_resolve_failed",
            productId,
            category,
            error,
            product: null,
            mockup: null,
            runtimeConfig: null,
          });
          setProductConfig(null);
        }
      } finally {
        if (!cancelled) setProductConfigLoaded(true);
      }
    }

    void loadProductConfig();

    return () => {
      cancelled = true;
    };
  }, [productId, category]);

  useEffect(() => {
    const preventGesture = (event: Event) => {
      event.preventDefault();
    };

    const preventMultiTouch = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };

    const preventEditorDoubleTapZoom = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest("[data-ryfio-editor-root]")) event.preventDefault();
    };

    document.addEventListener("gesturestart", preventGesture, {
      passive: false,
    } as AddEventListenerOptions);
    document.addEventListener("gesturechange", preventGesture, {
      passive: false,
    } as AddEventListenerOptions);
    document.addEventListener("gestureend", preventGesture, {
      passive: false,
    } as AddEventListenerOptions);
    document.addEventListener("touchmove", preventMultiTouch, {
      passive: false,
    });
    document.addEventListener("dblclick", preventEditorDoubleTapZoom, {
      passive: false,
    });

    return () => {
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
      document.removeEventListener("touchmove", preventMultiTouch);
      document.removeEventListener("dblclick", preventEditorDoubleTapZoom);
    };
  }, []);

  const [history, setHistory] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);

  const elements = side === "back" ? backElements : frontElements;
  const setElements = side === "back" ? setBackElements : setFrontElements;
  const zoom = side === "back" ? backZoom : frontZoom;
  const setZoom = side === "back" ? setBackZoom : setFrontZoom;

  const { addText, addElement } = useElements({
    setElements,
    selectedId,
  });

  const uploadImage = useUpload(addElement);

  const handleUploadChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";

      if (!file) return;

      uploadImage(file);
    },
    [uploadImage],
  );

  const zoomIn = useCallback(() => {
    setZoom((z) => clampEditorZoom(z + (z >= 2 ? 0.25 : 0.1), z));
  }, [setZoom]);

  const zoomOut = useCallback(() => {
    setZoom((z) => clampEditorZoom(z - (z > 2 ? 0.25 : 0.1), z));
  }, [setZoom]);

  const handleCanvasZoomChange = useCallback(
    (nextZoom: number) => {
      setZoom(clampEditorZoom(nextZoom, zoom));
    },
    [setZoom, zoom],
  );

  const handleTopBarZoomChange = useCallback(
    (percentage: number) => {
      setZoom(clampEditorZoom(Number(percentage) / 100, zoom));
    },
    [setZoom, zoom],
  );

  const buildStoredDraft = useCallback(
    (): StoredEditorDraft => ({
      designId: draftDesignIdRef.current,
      side,
      // Keep legacy `zoom` for old consumers, but store each side separately.
      zoom,
      frontZoom,
      backZoom,
      mockupColor,
      frontElements: cloneElementsForStorage(frontElements),
      backElements: cloneElementsForStorage(backElements),
      selectedVariant,
      updatedAt: Date.now(),
    }),
    [
      side,
      zoom,
      frontZoom,
      backZoom,
      mockupColor,
      frontElements,
      backElements,
      selectedVariant,
    ],
  );

  const saveDraftToSession = useCallback(() => {
    if (hydratedStorageKeyRef.current !== editorStorageKey) return;

    try {
      const serialized = JSON.stringify(buildStoredDraft());

      if (lastSavedSerializedRef.current === serialized) return;

      sessionStorage.setItem(editorStorageKey, serialized);
      lastSavedSerializedRef.current = serialized;
    } catch {
      // Ignore storage failures so the editor remains usable.
    }
  }, [buildStoredDraft, editorStorageKey]);

  const ensureDraftDesignId = useCallback(() => {
    if (!draftDesignIdRef.current) {
      draftDesignIdRef.current = crypto.randomUUID();
    }

    return draftDesignIdRef.current;
  }, []);

  useEffect(() => {
    if (!productConfigLoaded) return;

    let cancelled = false;

    hydratedStorageKeyRef.current = null;
    lastSavedSerializedRef.current = null;
    setDraftHydrated(false);

    const hydrateDraft = async () => {
      try {
        const saved = sessionStorage.getItem(editorStorageKey);

        if (!saved) {
          if (cancelled) return;

          const empty = { frontElements: [], backElements: [] };
          setFrontElements([]);
          setBackElements([]);
          setHistory([empty]);
          setFuture([]);
          hydratedStorageKeyRef.current = editorStorageKey;
          setDraftHydrated(true);
          return;
        }

        const parsed = JSON.parse(saved) as StoredEditorDraft;
        draftDesignIdRef.current =
          typeof parsed.designId === "string" && parsed.designId.trim()
            ? parsed.designId.trim()
            : null;

        const loadedFront = Array.isArray(parsed.frontElements)
          ? cloneElementsForStorage(parsed.frontElements)
          : [];
        const loadedBack = Array.isArray(parsed.backElements)
          ? cloneElementsForStorage(parsed.backElements)
          : [];

        // Saved text elements must not render until their real editor fonts are
        // available. Otherwise the browser paints fallback fonts on reload and
        // only corrects them after the next interaction/repaint.
        await hydrateSavedTextFonts(loadedFront, loadedBack);

        if (cancelled) return;

        const nextSide = parsed.side === "back" ? "back" : "front";
        setSide(nextSide);

        const legacyZoom = typeof parsed.zoom === "number" ? parsed.zoom : 1;
        setFrontZoom(clampEditorZoom(parsed.frontZoom, legacyZoom));
        setBackZoom(clampEditorZoom(parsed.backZoom, legacyZoom));

        const loadedColor = normalizeHexColor(parsed.mockupColor || null);
        if (loadedColor) {
          setMockupColor(loadedColor);
        }

        setFrontElements(loadedFront);
        setBackElements(loadedBack);

        setSelectedId(null);
        setSelectedElement(null);
        setFuture([]);
        setHistory([{ frontElements: loadedFront, backElements: loadedBack }]);
        lastSavedSerializedRef.current = saved;
      } catch {
        if (cancelled) return;

        const empty = { frontElements: [], backElements: [] };
        draftDesignIdRef.current = null;
        setFrontElements([]);
        setBackElements([]);
        setSelectedId(null);
        setSelectedElement(null);
        setFuture([]);
        setHistory([empty]);
      } finally {
        if (cancelled) return;

        hydratedStorageKeyRef.current = editorStorageKey;
        setDraftHydrated(true);
      }
    };

    void hydrateDraft();

    return () => {
      cancelled = true;
    };
  }, [editorStorageKey, productConfigLoaded]);

  useEffect(() => {
    if (!draftHydrated) return;
    saveDraftToSession();
  }, [draftHydrated, saveDraftToSession]);

  useEffect(() => {
    latestStateRef.current = {
      side,
      elements,
      frontElements,
      backElements,
      mockupColor,
      selectedVariant,
      productConfig,
      productConfigLoaded,
      draftHydrated,
      saving,
    };
  }, [
    side,
    elements,
    frontElements,
    backElements,
    mockupColor,
    selectedVariant,
    productConfig,
    productConfigLoaded,
    draftHydrated,
    saving,
  ]);

  const exportEditorPreview = useCallback(
    async (targetSide: Side): Promise<Blob> => {
      const stageRef = targetSide === "front" ? frontStageRef : backStageRef;
      const stageRoot = stageRef.current;
      const debugUserProductId = draftDesignIdRef.current || "unknown";

      console.info("[preview] stage state", {
        side: targetSide,
        exists: Boolean(stageRoot),
        connected: stageRoot?.isConnected ?? false,
        width: stageRoot?.clientWidth ?? 0,
        height: stageRoot?.clientHeight ?? 0,
      });

      if (!stageRoot) {
        throw new Error(`${targetSide}StageRef.current is null`);
      }
      if (!stageRoot.isConnected) {
        throw new Error(`${targetSide} stage is detached from the DOM`);
      }
      console.info(`[preview] ${targetSide} stage found`);

      const exportNode =
        stageRoot.querySelector<HTMLElement>(
          `[data-mockup-capture-root="${targetSide}"]`,
        ) ?? stageRoot;
      console.info("[preview-root-debug]", {
        tag: exportNode.tagName,
        className: exportNode.className,
        rect: exportNode.getBoundingClientRect(),
        childCount: exportNode.children.length,
        html: exportNode.outerHTML.slice(0, 1500),
      });

      const rect = exportNode.getBoundingClientRect();
      const mockupBaseImages = Array.from(
        exportNode.querySelectorAll<HTMLImageElement>("img"),
      ).filter((img) => String(img.currentSrc || img.getAttribute("src") || "").includes("/mockups/"));
      const artworkImages = Array.from(
        exportNode.querySelectorAll<HTMLImageElement>("img"),
      ).filter((img) => !String(img.currentSrc || img.getAttribute("src") || "").includes("/mockups/"));
      console.info("[checkout-preview:capture] editor snapshot", {
        side: targetSide,
        element: {
          tagName: exportNode.tagName,
          className: exportNode.className,
          width: rect.width,
          height: rect.height,
        },
        mockupBasePresent: mockupBaseImages.length > 0,
        artworkPresent: artworkImages.length > 0,
        imageCount: exportNode.querySelectorAll("img").length,
      });
      await reportPreviewStage({
        userProductId: debugUserProductId,
        stage: "node_found",
        side: targetSide,
        nodeWidth: rect.width,
        nodeHeight: rect.height,
      });
      if (rect.width > 0 && rect.height > 0) {
        await reportPreviewStage({
          userProductId: debugUserProductId,
          stage: "node_dimensions_valid",
          side: targetSide,
          nodeWidth: rect.width,
          nodeHeight: rect.height,
        });
      }

      await document.fonts?.ready?.catch((error) => {
        console.error("[preview] failed", error);
      });
      await reportPreviewStage({
        userProductId: debugUserProductId,
        stage: "fonts_ready",
        side: targetSide,
        nodeWidth: rect.width,
        nodeHeight: rect.height,
      });
      const sourceImages = Array.from(exportNode.querySelectorAll("img"));
      await reportPreviewStage({
        userProductId: debugUserProductId,
        stage: "images_decoded",
        side: targetSide,
        nodeWidth: rect.width,
        nodeHeight: rect.height,
        error: `imageCount=${sourceImages.length},complete=${sourceImages.filter((image) => image.complete && image.naturalWidth > 0).length}`,
      });
      await nextFrame();
      console.warn("[PREVIEW DIAGNOSTIC] calling", "captureVisualMockupPreviewBlob");
      const blob = await withTimeout(
        captureVisualMockupPreviewBlob(
          exportNode,
          targetSide === "front" ? frontElements : backElements,
        ),
        35_000,
        `${targetSide} preview export`,
      );
      if (!blob || blob.size === 0) {
        throw new Error(`${targetSide} capture returned an empty blob`);
      }

      console.info(`[preview] ${targetSide} exported`, {
        width: 900,
        height: 900,
        blobSize: blob.size,
      });
      await reportPreviewStage({
        userProductId: debugUserProductId,
        stage: "blob_created",
        side: targetSide,
        nodeWidth: rect.width,
        nodeHeight: rect.height,
        blobSize: blob.size,
        blobType: blob.type,
      });
      return blob;
    },
    [backElements, frontElements],
  );

  const persistPreviewMockups = useCallback(
    async (args: {
      userProductId: string;
      frontPreviewBlob: Blob | null;
      backPreviewBlob: Blob | null;
      usedSides: Side[];
    }) => {
      let frontBlob = args.frontPreviewBlob;
      let backBlob = args.backPreviewBlob;

      console.info("[canvas-preview] preparing", {
        userProductId: args.userProductId,
        hasFrontDesign: args.usedSides.includes("front"),
        hasBackDesign: args.usedSides.includes("back"),
      });

      if (!frontBlob && args.usedSides.includes("front")) {
        try {
          frontBlob = await withTimeout(
            exportEditorPreview("front"),
            30_000,
            "Front preview export retry",
          );
        } catch (error) {
          console.warn("[editor-preview] front preview retry failed", error);
        }
      }

      if (!backBlob && args.usedSides.includes("back")) {
        try {
          backBlob = await withTimeout(
            exportEditorPreview("back"),
            30_000,
            "Back preview export retry",
          );
        } catch (error) {
          console.warn("[editor-preview] back preview retry failed", error);
        }
      }

      console.info("[canvas-preview] captured", {
        userProductId: args.userProductId,
        hasFront: Boolean(frontBlob),
        hasBack: Boolean(backBlob),
        frontSize: frontBlob?.size ?? null,
        backSize: backBlob?.size ?? null,
      });

      if (args.usedSides.includes("front") && !frontBlob) {
        throw new Error("Front canvas preview capture returned no blob");
      }
      if (args.usedSides.includes("back") && !backBlob) {
        throw new Error("Back canvas preview capture returned no blob");
      }
      if (!frontBlob) {
        throw new Error("Checkout preview requires a front blob");
      }

      console.info("[checkout-preview:save-request] preview blobs", {
        userProductId: args.userProductId,
        side: {
          front: args.usedSides.includes("front"),
          back: args.usedSides.includes("back"),
        },
        frontPreviewDataUrlExists: Boolean(frontBlob),
        backPreviewDataUrlExists: Boolean(backBlob),
        frontSize: frontBlob?.size ?? null,
        backSize: backBlob?.size ?? null,
      });

      console.info("[canvas-preview] persisting before navigation", {
        userProductId: args.userProductId,
        hasFront: Boolean(frontBlob),
        hasBack: Boolean(backBlob),
      });
      await reportPreviewStage({
        userProductId: args.userProductId,
        stage: "persistence_started",
        side: "front",
        blobSize: frontBlob.size,
        blobType: frontBlob.type,
      });

      const formData = new FormData();
      formData.append("userProductId", args.userProductId);
      formData.append("front", blobToPreviewFile(frontBlob, "front"));
      if (backBlob) {
        formData.append("back", blobToPreviewFile(backBlob, "back"));
      }

      let response: Response;
      try {
        response = await fetch("/api/user-products/save-design/mockup-preview", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await reportPreviewStage({
          userProductId: args.userProductId,
          stage: "persistence_failed",
          side: "front",
          blobSize: frontBlob.size,
          blobType: frontBlob.type,
          error:
            error instanceof DOMException && error.name === "AbortError"
              ? `AbortError: ${message}`
              : error instanceof TypeError
                ? `TypeError: ${message}`
                : message,
        });
        throw error;
      }

      const rawPayload = await response.text().catch(() => "");
      let payload: any = null;
      try {
        payload = rawPayload ? JSON.parse(rawPayload) : null;
      } catch {
        payload = null;
      }
      await reportPreviewStage({
        userProductId: args.userProductId,
        stage: "persistence_response",
        side: "front",
        blobSize: frontBlob.size,
        blobType: frontBlob.type,
        httpStatus: response.status,
        error: rawPayload.slice(0, 500) || null,
      });

      if (!response.ok || payload?.success !== true) {
        throw new Error(payload?.error || "Preview persistence failed");
      }
      if (args.usedSides.includes("front") && typeof payload?.frontUrl !== "string") {
        throw new Error("Front preview was not persisted");
      }
      if (args.usedSides.includes("back") && typeof payload?.backUrl !== "string") {
        throw new Error("Back preview was not persisted");
      }

      console.info("[preview-flow] persisted", {
        userProductId: args.userProductId,
        frontUrl: payload?.frontUrl ?? null,
        backUrl: payload?.backUrl ?? null,
      });

      return {
        frontUrl: typeof payload?.frontUrl === "string" ? payload.frontUrl : null,
        backUrl: typeof payload?.backUrl === "string" ? payload.backUrl : null,
      };
    },
    [exportEditorPreview],
  );

  const captureCheckoutPreviews = useCallback(
    async (args: {
      userProductId: string;
      frontPreviewBlob: Blob | null;
      backPreviewBlob: Blob | null;
      usedSides: Side[];
    }) => {
      let frontBlob = args.frontPreviewBlob;
      let backBlob = args.backPreviewBlob;

      console.info("[canvas-preview] preparing", {
        userProductId: args.userProductId,
        hasFrontDesign: args.usedSides.includes("front"),
        hasBackDesign: args.usedSides.includes("back"),
      });

      if (!frontBlob && args.usedSides.includes("front")) {
        frontBlob = await withTimeout(
          exportEditorPreview("front"),
          30_000,
          "Front preview export retry",
        );
      }

      if (!backBlob && args.usedSides.includes("back")) {
        backBlob = await withTimeout(
          exportEditorPreview("back"),
          30_000,
          "Back preview export retry",
        );
      }

      console.info("[canvas-preview] captured", {
        userProductId: args.userProductId,
        hasFront: Boolean(frontBlob),
        hasBack: Boolean(backBlob),
        frontSize: frontBlob?.size ?? null,
        backSize: backBlob?.size ?? null,
      });

      if (args.usedSides.includes("front") && !frontBlob) {
        throw new Error("Front canvas preview capture returned no blob");
      }
      if (args.usedSides.includes("back") && !backBlob) {
        throw new Error("Back canvas preview capture returned no blob");
      }

      return {
        front: frontBlob,
        back: backBlob,
      };
    },
    [exportEditorPreview],
  );

  const handleSaveDesign = useCallback(async () => {
    if (latestStateRef.current.saving) return;

    console.info("[preview] save started");
    console.info("[save-design] handler entered");

    const baseProductId = productId || category;

    if (!baseProductId) {
      alert(
        "Product missing. Open the editor from a product page before saving.",
      );
      return;
    }

    try {
      const stepContext: {
        step:
          | "validate"
          | "auth"
          | "sync-state"
          | "serialize"
          | "preview"
          | "request"
          | "response";
        userProductId: string | null;
        designId: string | null;
      } = {
        step: "validate",
        userProductId: null,
        designId: draftDesignIdRef.current,
      };

      if (!latestStateRef.current.productConfigLoaded || !latestStateRef.current.draftHydrated) {
        throw new Error("Editor is still preparing the current design. Please try again in a moment.");
      }

      stepContext.step = "auth";
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token || null;

      if (!accessToken) {
        console.info("[save-design] auth required before save");
        pendingSaveAfterAuthRef.current = true;
        setSaveNotice(null);
        setAuthPopupOpen(true);
        return;
      }

      setSaving(true);
      setSaveNotice(null);
      stepContext.step = "sync-state";
      await nextFrame();
      const snapshot = latestStateRef.current;
      const resolvedDesignId = ensureDraftDesignId();
      stepContext.designId = resolvedDesignId;
      saveDraftToSession();

      stepContext.step = "serialize";
      const designPayloadPromise = buildDesignSavePayload({
          productId: baseProductId,
          category,
          side: snapshot.side,
          elements: snapshot.elements,
          frontElements: snapshot.frontElements,
          backElements: snapshot.backElements,
          mockupColor: snapshot.mockupColor,
          color: snapshot.mockupColor,
          variantId: snapshot.selectedVariant?.variantId || null,
          selectedVariant: snapshot.selectedVariant,
          productConfig: snapshot.productConfig,
          onUploadInlineImage: async (dataUrl, elementId) => {
            const uploadResponse = await fetch("/api/user-products/design-element-image", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ dataUrl, elementId }),
            });
            const uploadResult = await uploadResponse.json().catch(() => null);
            if (!uploadResponse.ok || !uploadResult?.url) {
              throw new Error(uploadResult?.error || "Failed to upload design image");
            }
            return String(uploadResult.url);
          },
        });

      const designPayload = await designPayloadPromise;
      const designPayloadJson = assertSavePayloadIsJsonOnly(designPayload);
      const usedSides = resolveUsedDesignSides(
        snapshot.frontElements,
        snapshot.backElements,
      );

      const parsedDesignPayload = JSON.parse(designPayloadJson);
      const frontData = parsedDesignPayload?.design_data?.sides?.front ?? null;
      const backData = parsedDesignPayload?.design_data?.sides?.back ?? null;
      const requestPayload = {
        ...parsedDesignPayload,
        designId: resolvedDesignId,
        countryCode: (() => {
          try {
            return new Intl.Locale(navigator.language || "").region?.toUpperCase() || null;
          } catch {
            return navigator.language.match(/[-_]([A-Za-z]{2})$/)?.[1]?.toUpperCase() || null;
          }
        })(),
      };
      console.log("[editor-save] payload inspection", {
        hasFront: Boolean(frontData),
        hasBack: Boolean(backData),
        frontElementsCount: Array.isArray(frontData?.elements) ? frontData.elements.length : 0,
        backElementsCount: Array.isArray(backData?.elements) ? backData.elements.length : 0,
        payloadSize: JSON.stringify(requestPayload).length,
      });

      console.info("[save-design] started", {
        userProductId: null,
        designId: resolvedDesignId,
        activeSide: snapshot.side,
      });
      console.info("[save-design] canvas serialized", {
        designId: resolvedDesignId,
        hasFront: Boolean(frontData),
        hasBack: Boolean(backData),
      });
      console.info("[checkout-preview:save-request] request payload", {
        designId: resolvedDesignId,
        previewFrontDataUrlExists: Boolean(requestPayload.previewFrontDataUrl),
        previewBackDataUrlExists: Boolean(requestPayload.previewBackDataUrl),
        previewFrontDataUrlSize: typeof requestPayload.previewFrontDataUrl === "string" ? requestPayload.previewFrontDataUrl.length : null,
        previewBackDataUrlSize: typeof requestPayload.previewBackDataUrl === "string" ? requestPayload.previewBackDataUrl.length : null,
        front: shortenUrl("previewFrontDataUrl", requestPayload.previewFrontDataUrl),
        back: shortenUrl("previewBackDataUrl", requestPayload.previewBackDataUrl),
      });

      stepContext.step = "request";
      const response = await fetch("/api/user-products/save-design", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(requestPayload),
      });

      const rawResponseText = await response.text().catch(() => "");
      let data: any = null;
      try {
        data = rawResponseText ? JSON.parse(rawResponseText) : null;
      } catch {
        data = null;
      }

      if (response.status === 401) {
        pendingSaveAfterAuthRef.current = true;
        setSaveNotice(null);
        setAuthPopupOpen(true);
        return;
      }

      if (!response.ok) {
        const serverMessage =
          data?.error ||
          data?.message ||
          rawResponseText?.slice(0, 500) ||
          response.statusText ||
          "Failed to save design";

        throw new Error(
          `/api/user-products/save-design failed (${response.status}): ${serverMessage}`,
        );
      }

      stepContext.step = "response";
      const savedUserProductId = String(
        data?.designId ??
          data?.userProductId ??
          data?.user_product_id ??
          data?.product?.id ??
          data?.data?.id ??
          "",
      ).trim();

      if (!savedUserProductId) {
        throw new Error("The design was saved, but its ID was not returned");
      }
      stepContext.userProductId = savedUserProductId;
      draftDesignIdRef.current = savedUserProductId;
      console.info("[save-design] main save completed", {
        userProductId: savedUserProductId,
      });
      await reportPreviewStage({
        userProductId: savedUserProductId,
        stage: "save_completed",
      });

      if (process.env.NODE_ENV === "development") {
        console.log(
          "[THUMBNAIL_USED_SIDES]",
          JSON.stringify({
            usedSides,
            frontElementsCount: frontElements.length,
            backElementsCount: backElements.length,
          }),
        );
      }

      setSaveNotice("Design saved. Adding it to your cart...");

      console.info("[save-design] record persisted", {
        userProductId: savedUserProductId,
        designId: resolvedDesignId,
      });

      setSaving(false);

      console.info("[preview-flow] capture started", {
        userProductId: savedUserProductId,
        frontHasDesign: usedSides.includes("front"),
        backHasDesign: usedSides.includes("back"),
      });

      let previews: {
        frontBlob: Blob | null;
        backBlob: Blob | null;
      } = {
        frontBlob: null,
        backBlob: null,
      };

      try {
        await reportPreviewStage({
          userProductId: savedUserProductId,
          stage: "capture_started",
          side: usedSides.includes("front")
            ? "front"
            : usedSides.includes("back")
              ? "back"
              : null,
        });
        const captured = await captureCheckoutPreviews({
          userProductId: savedUserProductId,
          frontPreviewBlob: null,
          backPreviewBlob: null,
          usedSides,
        });
        previews = {
          frontBlob: captured.front ?? null,
          backBlob: captured.back ?? null,
        };
        console.info("[preview-flow] capture completed", {
          userProductId: savedUserProductId,
          hasFront: Boolean(previews.frontBlob),
          hasBack: Boolean(previews.backBlob),
          frontSize: previews.frontBlob?.size ?? null,
          backSize: previews.backBlob?.size ?? null,
        });
      } catch (error) {
        await reportPreviewStage({
          userProductId: savedUserProductId,
          stage: "capture_failed",
          side: usedSides.includes("front")
            ? "front"
            : usedSides.includes("back")
              ? "back"
              : null,
          error: error instanceof Error ? error.message : String(error),
        });
        console.warn("[preview-flow] capture failed", {
          userProductId: savedUserProductId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error instanceof Error ? error : new Error(String(error));
      }

      let persistedPreview: { frontUrl: string | null; backUrl: string | null } | null = null;
      if (previews.frontBlob || previews.backBlob) {
        try {
          console.info("[preview-flow] upload request started", {
            userProductId: savedUserProductId,
            hasFront: Boolean(previews.frontBlob),
            hasBack: Boolean(previews.backBlob),
          });
          const uploadResult = await persistPreviewMockups({
            userProductId: savedUserProductId,
            frontPreviewBlob: previews.frontBlob,
            backPreviewBlob: previews.backBlob,
            usedSides,
          });
          persistedPreview = uploadResult;
          console.info("[preview-flow] upload response received", {
            userProductId: savedUserProductId,
            frontUrl: uploadResult.frontUrl ?? null,
            backUrl: uploadResult.backUrl ?? null,
          });
        } catch (error) {
          await reportPreviewStage({
            userProductId: savedUserProductId,
            stage: "persistence_failed",
            side: previews.frontBlob ? "front" : previews.backBlob ? "back" : null,
            blobSize: previews.frontBlob?.size ?? previews.backBlob?.size ?? null,
            blobType: previews.frontBlob?.type ?? previews.backBlob?.type ?? null,
            error: error instanceof Error ? error.message : String(error),
          });
          console.warn("[preview-flow] preview persistence failed", {
            userProductId: savedUserProductId,
            error: error instanceof Error ? error.message : String(error),
          });
          throw error instanceof Error ? error : new Error(String(error));
        }
      }

      if (!persistedPreview) {
        throw new Error("Checkout preview was not persisted; navigation cancelled");
      }
      if (usedSides.includes("front") && !persistedPreview.frontUrl) {
        throw new Error("Front checkout preview is missing; navigation cancelled");
      }
      if (usedSides.includes("back") && !persistedPreview.backUrl) {
        throw new Error("Back checkout preview is missing; navigation cancelled");
      }

      const cartItemId = String(data?.cartItem?.id || "").trim();
      if (!cartItemId) {
        console.warn("[save-design] cart item missing in response", {
          userProductId: savedUserProductId,
          redirectTo: data?.redirectTo ?? "/cart",
        });
        console.info("[canvas-preview] navigating to checkout", {
          userProductId: savedUserProductId,
        });
        await reportPreviewStage({
          userProductId: savedUserProductId,
          stage: "navigation_started",
        });
        router.push(data?.redirectTo ?? "/cart");
        return;
      }

      sessionStorage.removeItem(editorStorageKey);
      setSaveNotice(
        "Design saved and added to cart. Redirecting you to checkout...",
      );

      const checkoutParams = new URLSearchParams({
        cartItemId,
        designId: savedUserProductId,
      });
      console.info("[save-design] completed", {
        userProductId: savedUserProductId,
        cartItemId,
      });
      console.info("[canvas-preview] navigating to checkout", {
        userProductId: savedUserProductId,
      });
      await reportPreviewStage({
        userProductId: savedUserProductId,
        stage: "navigation_started",
      });
      console.warn("[PREVIEW DIAGNOSTIC] navigation about to start");
      await new Promise((resolve) => window.setTimeout(resolve, 800));
      router.push(`/checkout?${checkoutParams.toString()}`);
      return;
    } catch (error) {
      console.error("[save-design] failed", {
        step: "client",
        designId: draftDesignIdRef.current,
        error: error instanceof Error ? error.message : error,
      });
      console.error("[preview] failed", error);
      const message = error instanceof Error ? error.message : "Error saving design";
      setSaveNotice(message);
      alert(message);
    } finally {
      if (latestStateRef.current.saving) {
        setSaving(false);
      }
    }
  }, [
    productId,
    category,
    saveDraftToSession,
    ensureDraftDesignId,
    editorStorageKey,
    router,
    captureCheckoutPreviews,
  ]);

  const handleAuthSuccess = useCallback(() => {
    setAuthPopupOpen(false);

    if (!pendingSaveAfterAuthRef.current) return;

    pendingSaveAfterAuthRef.current = false;
    window.setTimeout(() => {
      void handleSaveDesign();
    }, 250);
  }, [handleSaveDesign]);

  const handlePreviewDesign = useCallback(async (): Promise<void> => {
    try {
      saveDraftToSession();

      if (!previewCanvasRef.current) {
        return;
      }

      const exportNode = previewCanvasRef.current.querySelector(
        "#mockup-export-root",
      ) as HTMLElement | null;

      if (!exportNode) {
        return;
      }

      const designImage = await captureVisualMockupPreview(exportNode);

      if (
        typeof designImage !== "string" ||
        !designImage.startsWith("data:image/")
      ) {
        return;
      }

      // Se precisares de usar a imagem, guarda-a num estado:
      // setPreviewImage(designImage);

      return;
    } catch {
      return;
    }
  }, [saveDraftToSession]);

  useEffect(() => {
    if (!draftHydrated || isHistoryAction.current) return;

    const snapshot = {
      frontElements: cloneElementsForStorage(frontElements),
      backElements: cloneElementsForStorage(backElements),
    };
    const serialized = JSON.stringify(snapshot);
    const last = history[history.length - 1];

    if (last && JSON.stringify(last) === serialized) return;

    setHistory((prev) => {
      const previous = prev[prev.length - 1];
      if (previous && JSON.stringify(previous) === serialized) return prev;
      return [...prev, snapshot].slice(-80);
    });
    setFuture([]);
  }, [frontElements, backElements, history, draftHydrated]);

  const applyHistoryState = useCallback((state: HistoryState) => {
    isHistoryAction.current = true;
    setFrontElements(cloneElementsForStorage(state.frontElements || []));
    setBackElements(cloneElementsForStorage(state.backElements || []));
    setSelectedId(null);
    setSelectedElement(null);
    queueMicrotask(() => {
      isHistoryAction.current = false;
    });
  }, []);

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length <= 1) return prev;
      const current = prev[prev.length - 1];
      const previous = prev[prev.length - 2];
      setFuture((next) => [current, ...next].slice(0, 80));
      applyHistoryState(previous);
      return prev.slice(0, -1);
    });
  }, [applyHistoryState]);

  const handleRedo = useCallback(() => {
    setFuture((prev) => {
      if (!prev.length) return prev;
      const [next, ...rest] = prev;
      setHistory((historyPrev) => [...historyPrev, next].slice(-80));
      applyHistoryState(next);
      return rest;
    });
  }, [applyHistoryState]);

  const handleRevert = useCallback(() => {
    const empty = { frontElements: [], backElements: [] };
    applyHistoryState(empty);
    setHistory([empty]);
    setFuture([]);
  }, [applyHistoryState]);

  const handleSetSide = useCallback((nextSide: Side) => {
    setSide((current) => {
      const normalized = nextSide === "back" ? "back" : "front";
      if (current === normalized) return current;

      // A side switch is a view change, not an edit. Keep each side isolated
      // and never carry selected/runtime-only element state across sides.
      setSelectedId(null);
      setSelectedElement(null);
      return normalized;
    });
  }, []);

  const handleProductColorChange = useCallback((option: CanvasColorOption) => {
    setMockupColor(option.hex);
    setSelectedVariant((current) => ({
      variantId: option.variantId || current?.variantId || null,
      productColorId: option.productColorId || current?.productColorId || null,
      colorId: option.productColorId || current?.colorId || null,
      size: option.size || current?.size || null,
      colorName: option.name,
      colorHex: option.hex,
      sku: option.sku || current?.sku || null,
      price: option.price == null ? current?.price || null : String(option.price),
      variantPrice: option.price == null ? current?.variantPrice || null : String(option.price),
      currency: current?.currency || null,
      image: null,
      imageUrl: null,
      printPricing: option.printPricing || current?.printPricing || null,
      gelatoAttributes: option.gelatoAttributes || current?.gelatoAttributes || null,
    }));

    // Variant images are product previews, not editor mockups. Keep the
    // configured print-area mockup fixed and apply only the selected colour.
    setProductConfig((current) => current ? {
      ...current,
      mockups: baseMockupsRef.current,
      useVariantMockups: false,
    } : current);
  }, []);

  if (!productConfigLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#05070d] text-sm font-semibold text-white/70">
        Loading product editor...
      </div>
    );
  }

  return (
    <>
      <EditorShell
        sidebar={null}
        topbar={
          <TopBar
            productId={productId || undefined}
            category={category}
            side={side}
            setSide={handleSetSide}
            zoomIn={zoomIn}
            zoomOut={zoomOut}
            zoom={Math.round(zoom * 100)}
            onZoomChange={handleTopBarZoomChange}
            onSaveDesign={handleSaveDesign}
            onPreviewDesign={handlePreviewDesign}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onRevert={handleRevert}
            canUndo={history.length > 1}
            canRedo={future.length > 0}
            saving={saving}
            elements={elements}
            frontElements={frontElements}
            backElements={backElements}
            mockupColor={mockupColor}
            productConfig={productConfig}
            selectedVariant={selectedVariant}
          />
        }
        canvas={
          <Canvas
            key={`editor-canvas-${productId || category}`}
            side={side}
            elements={elements}
            setElements={setElements}
            zoom={zoom}
            onZoomChange={handleCanvasZoomChange}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            setSelectedElement={setSelectedElement}
            mockupColor={mockupColor}
            setMockupColor={setMockupColor}
            onProductColorChange={handleProductColorChange}
            selectedVariant={selectedVariant}
            canvasRef={previewCanvasRef}
            productConfig={productConfig}
          />
        }
        toolbar={
          <ToolbarFAB
            onUpload={uploadImage}
            onUploadClick={() => {
              if (!fileRef.current) return;
              fileRef.current.value = "";
              fileRef.current.click();
            }}
            onAddText={addText}
            setElements={setElements}
            elements={elements}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            zoomIn={zoomIn}
            zoomOut={zoomOut}
          />
        }
      />

      <ProductionCaptureLayers
        category={productConfig?.category || category}
        frontElements={frontElements}
        backElements={backElements}
        productConfig={productConfig}
      />

      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "-20000px",
          top: 0,
          width: 1024,
          height: 2048,
          overflow: "hidden",
          pointerEvents: "none",
          opacity: 0,
        }}
      >
        <Canvas
          side="front"
          elements={frontElements}
          setElements={() => undefined}
          zoom={1}
          selectedId={null}
          setSelectedId={() => undefined}
          setSelectedElement={() => undefined}
          mockupColor={mockupColor}
          setMockupColor={() => undefined}
          selectedVariant={selectedVariant}
          canvasRef={frontStageRef}
          productConfig={productConfig}
          mode="preview"
        />
        <Canvas
          side="back"
          elements={backElements}
          setElements={() => undefined}
          zoom={1}
          selectedId={null}
          setSelectedId={() => undefined}
          setSelectedElement={() => undefined}
          mockupColor={mockupColor}
          setMockupColor={() => undefined}
          selectedVariant={selectedVariant}
          canvasRef={backStageRef}
          productConfig={productConfig}
          mode="preview"
        />
      </div>

      <input
        ref={fileRef}
        type="file"
        hidden
        accept="image/png,image/jpeg,image/webp"
        onChange={handleUploadChange}
      />

      {saveNotice && (
        <div className="pointer-events-none fixed left-1/2 top-16 z-[998] w-[calc(100%-2rem)] max-w-[360px] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#090914]/95 px-4 py-3 text-center text-sm font-bold text-white shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          {saveNotice}
        </div>
      )}

      {authPopupOpen && (
        <div className="fixed inset-0 z-[999]">
          <AuthPopup
            open={authPopupOpen}
            onClose={() => {
              pendingSaveAfterAuthRef.current = false;
              setAuthPopupOpen(false);
            }}
            onSuccess={handleAuthSuccess}
          />
        </div>
      )}
    </>
  );
}
