"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import Canvas from "@/app/dashboard/design/components/Canvas";
import TopBar from "@/app/dashboard/design/components/TopBar";
import EditorShell from "@/app/dashboard/design/components/EditorShell";
import ToolbarFAB from "@/app/dashboard/design/components/toolbar/ToolbarFAB";
import AuthPopup from "@/app/dashboard/design/components/toolbar/panels/AuthPopup";
import { captureProductionPreview } from "@/app/dashboard/design/components/preview/services/previewCapture";
import { buildDesignSavePayload } from "@/app/dashboard/design/components/topbar/services/designSavePayload";
import { loadEditorFont } from "@/app/dashboard/design/components/data/fonts";
import ProductionCaptureLayers from "@/app/dashboard/design/components/capture/ProductionCaptureLayers";
import type { ProductDisplayConfig } from "@/app/dashboard/design/components/canvas/productConfig";
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
  image: string | null;
  imageUrl: string | null;
};

type SearchParamReader = { get: (name: string) => string | null };

type StoredEditorDraft = {
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
  return Math.min(2, Math.max(0.4, value));
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
  const image = readSearchParam(params, ["variantImage", "image", "imageUrl"]);

  if (
    !variantId &&
    !productColorId &&
    !size &&
    !colorName &&
    !colorHex &&
    !sku &&
    !price &&
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
    image,
    imageUrl: image,
  };
}

export default function EditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId =
    searchParams.get("productId") || searchParams.get("baseProductId");
  const category = String(params?.id || "tshirt").toLowerCase();
  const selectedVariant = useMemo(
    () => buildVariantSelection(searchParams),
    [searchParams],
  );

  const fileRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLDivElement>(null);
  const hydratedStorageKeyRef = useRef<string | null>(null);
  const lastSavedSerializedRef = useRef<string | null>(null);
  const isHistoryAction = useRef(false);
  const pendingSaveAfterAuthRef = useRef(false);

  const editorStorageKey = useMemo(
    () =>
      `editor-design:${productId || category || "draft"}:${selectedVariant?.variantId || "default"}`,
    [productId, category, selectedVariant?.variantId],
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
    setZoom((z) => Math.min(2, z + 0.1));
  }, [setZoom]);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.4, z - 0.1));
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

  const handleSaveDesign = useCallback(async () => {
    if (saving) return;

    const baseProductId = productId || category;

    if (!baseProductId) {
      alert(
        "Product missing. Open the editor from a product page before saving.",
      );
      return;
    }

    try {
      setSaving(true);
      setSaveNotice(null);
      saveDraftToSession();

      const designPayload = await buildDesignSavePayload({
        productId: baseProductId,
        category,
        side,
        elements,
        frontElements,
        backElements,
        mockupColor,
        color: mockupColor,
        variantId: selectedVariant?.variantId || null,
        selectedVariant,
        productConfig,
      });

      const response = await fetch("/api/user-products/save-design", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(designPayload),
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

      sessionStorage.removeItem(editorStorageKey);
      setSaveNotice(
        "Design saved successfully. Redirecting you to checkout...",
      );

      const checkoutUrl = data?.designId
        ? `/checkout?designId=${data.designId}`
        : "/checkout";
      router.push(checkoutUrl);
      return;
    } catch {
      alert("Error saving design");
    } finally {
      setSaving(false);
    }
  }, [
    productId,
    category,
    side,
    elements,
    saving,
    saveDraftToSession,
    frontElements,
    backElements,
    mockupColor,
    selectedVariant,
    productConfig,
    editorStorageKey,
    router,
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

      const designImage = await captureProductionPreview(exportNode);

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
          />
        }
        canvas={
          <Canvas
            key={`editor-canvas-${category}-${side}`}
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
            zoomIn={zoomIn}
            zoomOut={zoomOut}
            mockupColor={mockupColor}
            setMockupColor={setMockupColor}
            productColorKey={productId || category}
          />
        }
      />

      <ProductionCaptureLayers
        category={productConfig?.category || category}
        frontElements={frontElements}
        backElements={backElements}
        productConfig={productConfig}
      />

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
