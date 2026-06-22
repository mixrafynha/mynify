"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import Canvas from "@/app/dashboard/design/components/Canvas";
import TopBar from "@/app/dashboard/design/components/TopBar";
import EditorShell from "@/app/dashboard/design/components/EditorShell";
import ToolbarFAB from "@/app/dashboard/design/components/toolbar/ToolbarFAB";
import { getLocalSafeArea, getPrintBox, getSafeArea } from "@/app/dashboard/design/components/canvas/canvasMath";


export type ElementType = {
  id: string;
  type: "image" | "text" | "shape" | "logo" | "sticker" | "template" | "svg" | "qr" | "barcode";
  src?: string;
  text?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value?: string | null) {
  return !!value && UUID_RE.test(value);
}

function isKnownProductSlug(value?: string | null) {
  const raw = String(value || "").toLowerCase();
  return ["tshirt", "t-shirt", "hoodie", "mug", "cap"].includes(raw);
}


type ProductPickerItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
};

const FALLBACK_PRODUCTS: ProductPickerItem[] = [
  { id: "tshirt", slug: "tshirt", name: "T-shirt", description: "Classic apparel print area for front and back designs." },
  { id: "hoodie", slug: "hoodie", name: "Hoodie", description: "Premium streetwear layout with a larger printable zone." },
  { id: "mug", slug: "mug", name: "Mug", description: "Wrap-style product preview for small designs and logos." },
  { id: "cap", slug: "cap", name: "Cap", description: "Compact logo-first product with tighter safe area." },
];

function normalizeProduct(item: any): ProductPickerItem | null {
  const id = String(item?.id || item?.slug || item?.type || item?.category || "").trim();
  if (!id) return null;
  const slug = String(item?.slug || item?.type || item?.category || item?.handle || id).toLowerCase();
  return {
    id,
    slug,
    name: String(item?.name || item?.title || slug).replace(/-/g, " "),
    description: String(item?.description || item?.subtitle || "Choose this product and start designing."),
  };
}

function ProductPicker({ currentSlug, onSelect }: { currentSlug: string; onSelect: (product: ProductPickerItem) => void }) {
  const [products, setProducts] = useState<ProductPickerItem[]>(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        const data = await response.json().catch(() => null);
        const source = Array.isArray(data) ? data : data?.products || [];
        const normalized = source.map(normalizeProduct).filter(Boolean) as ProductPickerItem[];

        if (!cancelled && normalized.length) {
          setProducts(normalized);
        }
      } catch (error) {
        console.warn("PRODUCT PICKER FALLBACK:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05050d] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-6xl flex-col justify-center">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">
            Select product first
          </div>
          <h1 className="text-4xl font-black tracking-[-0.07em] sm:text-6xl">
            Choose what you want to design.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/58 sm:text-base">
            The editor needs a product before it can calculate safe area, DPI, print size and production preview correctly.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => {
            const suggested = product.slug === currentSlug;
            return (
              <button
                key={`${product.id}-${product.slug}`}
                type="button"
                onClick={() => onSelect(product)}
                className={`group min-h-[168px] rounded-[28px] border p-5 text-left transition active:scale-[0.99] ${
                  suggested
                    ? "border-cyan-300/35 bg-cyan-300/[0.09] shadow-[0_24px_70px_rgba(34,211,238,0.12)]"
                    : "border-white/10 bg-white/[0.045] hover:border-white/18 hover:bg-white/[0.075]"
                }`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-[#05050d] shadow-lg">
                  {product.name.slice(0, 1).toUpperCase()}
                </div>
                <h2 className="mt-4 text-xl font-black capitalize tracking-[-0.04em] text-white">{product.name}</h2>
                <p className="mt-2 text-sm leading-5 text-white/55">{product.description}</p>
                <span className="mt-4 inline-flex text-xs font-black uppercase tracking-[0.12em] text-cyan-200">
                  {suggested ? "Suggested · " : ""}{loading ? "Loading" : "Start design"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export default function EditorPage() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const routeId = typeof params?.id === "string" ? params.id : "";
  const queryProductId = searchParams.get("productId");

  const [resolvedProductId, setResolvedProductId] = useState<string | null>(
    isUuid(queryProductId) ? queryProductId : isUuid(routeId) ? routeId : isKnownProductSlug(queryProductId || routeId) ? String(queryProductId || routeId).toLowerCase().replace("t-shirt", "tshirt") : null,
  );

  const productId = resolvedProductId;

  const fileRef = useRef<HTMLInputElement>(null);
  const hasLoadedDraft = useRef(false);
  const isHistoryAction = useRef(false);
  const lastHistorySnapshot = useRef<string>("");

  const editorStorageKey = useMemo(
    () => `editor-design:${productId || routeId || "draft"}`,
    [productId, routeId],
  );

  const previewStorageKey = useMemo(
    () => `mynify-editor-preview:${productId || routeId || "draft"}`,
    [productId, routeId],
  );

  const productSlug = useMemo(() => String(routeId || "tshirt").toLowerCase(), [routeId]);

  const [side, setSide] = useState<Side>("front");
  const editorSafeArea = useMemo(() => getLocalSafeArea(getSafeArea(getPrintBox(productSlug, side))), [productSlug, side]);
  const defaultCenter = useMemo(() => ({ x: editorSafeArea.width / 2, y: editorSafeArea.height / 2 }), [editorSafeArea.height, editorSafeArea.width]);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<ElementType | null>(null);

  const [zoom, setZoom] = useState(1);
  const [mockupColor, setMockupColor] = useState("#ffffff");

  const [frontElements, setFrontElements] = useState<ElementType[]>([]);
  const [backElements, setBackElements] = useState<ElementType[]>([]);

  const [history, setHistory] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function resolveProductId() {
      const raw = queryProductId || routeId;

      if (!raw) return;

      if (isUuid(raw) || isKnownProductSlug(raw)) {
        setResolvedProductId(isKnownProductSlug(raw) ? raw.toLowerCase().replace("t-shirt", "tshirt") : raw);
        return;
      }

      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        const data = await res.json();

        const products = Array.isArray(data) ? data : data.products || [];

        const product = products.find((item: any) => {
          const rawLower = raw.toLowerCase();

          return (
            item?.id === raw ||
            item?.slug === raw ||
            item?.category === raw ||
            item?.type === raw ||
            item?.handle === raw ||
            item?.name?.toLowerCase?.() === rawLower
          );
        });

        if (!cancelled) {
          setResolvedProductId(product?.id || null);
        }
      } catch (error) {
        console.error("PRODUCT RESOLVE ERROR:", error);

        if (!cancelled) {
          setResolvedProductId(null);
        }
      }
    }

    resolveProductId();

    return () => {
      cancelled = true;
    };
  }, [queryProductId, routeId]);

  const elements = useMemo(
    () => (side === "back" ? backElements : frontElements),
    [side, backElements, frontElements],
  );

  const setElements = side === "back" ? setBackElements : setFrontElements;

  const addCenteredText = useCallback(() => {
    const width = 260;
    const height = 72;
    const maxZ = Math.max(0, ...elements.map((el) => Number(el.zIndex || 0)));
    const textElement: ElementType = {
      id: crypto.randomUUID(),
      type: "text",
      x: Math.round(defaultCenter.x - width / 2),
      y: Math.round(defaultCenter.y - height / 2),
      width,
      height,
      text: "Your text",
      meta: {
        fontSize: 42,
        fontFamily: "Inter",
        fontWeight: 900,
        color: "#111827",
        fill: "#111827",
        printKind: "text",
        dpi: 300,
        effectiveDpi: 300,
        dpiQuality: "vector",
        qualityStatus: "Excellent",
        printWidth: width,
        printHeight: height,
        insertedAt: Date.now(),
      },
      zIndex: maxZ + 1,
    };

    setElements((prev) => [...prev, textElement]);
    setSelectedId(textElement.id);
    setSelectedElement(textElement);
  }, [defaultCenter.x, defaultCenter.y, elements, setElements]);

  const addCenteredImage = useCallback(
    (file: File) => {
      if (!file || !(file.type?.startsWith("image/") || file.name.toLowerCase().endsWith(".svg"))) return;

      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result || "");
        if (!src) return;

        const image = new Image();
        image.onload = () => {
          const naturalWidth = image.naturalWidth || 1000;
          const naturalHeight = image.naturalHeight || 1000;
          const maxWidth = 360;
          const maxHeight = 420;
          const ratio = Math.min(1, maxWidth / naturalWidth, maxHeight / naturalHeight);
          const width = Math.max(72, Math.round(naturalWidth * ratio));
          const height = Math.max(72, Math.round(naturalHeight * ratio));
          const maxZ = Math.max(0, ...elements.map((el) => Number(el.zIndex || 0)));

          const imageElement: ElementType = {
            id: crypto.randomUUID(),
            type: "image",
            src,
            x: Math.round(defaultCenter.x - width / 2),
            y: Math.round(defaultCenter.y - height / 2),
            width,
            height,
            zIndex: maxZ + 1,
            meta: {
              naturalWidth,
              naturalHeight,
              originalWidth: naturalWidth,
              originalHeight: naturalHeight,
              fileName: file.name,
              printKind: "raster",
              dpiTarget: 300,
              qualityStatus: "Unknown",
              printWidth: undefined,
              printHeight: undefined,
              transparent: /\.(png|webp|svg)$/i.test(file.name) || src.startsWith("data:image/png") || src.startsWith("data:image/webp") || src.startsWith("data:image/svg"),
              preserveAlpha: /\.(png|webp|svg)$/i.test(file.name) || src.startsWith("data:image/png") || src.startsWith("data:image/webp") || src.startsWith("data:image/svg"),
              preferredExportFormat: /\.svg$/i.test(file.name) || src.startsWith("data:image/svg") ? "svg" : /\.webp$/i.test(file.name) || src.startsWith("data:image/webp") ? "webp" : "png",
              insertedAt: Date.now(),
            },
          };

          setElements((prev) => [...prev, imageElement]);
          setSelectedId(imageElement.id);
          setSelectedElement(imageElement);
        };
        image.src = src;
      };

      reader.readAsDataURL(file);
    },
    [defaultCenter.x, defaultCenter.y, elements, setElements],
  );

  const handleUploadChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";

      if (!file) return;

      addCenteredImage(file);
    },
    [addCenteredImage],
  );

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(4, Number((z + 0.1).toFixed(2))));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.25, Number((z - 0.1).toFixed(2))));
  }, []);

  const handleZoomChange = useCallback((nextZoom: number) => {
    setZoom(Math.min(4, Math.max(0.25, nextZoom / 100)));
  }, []);

  const saveDraftToSession = useCallback(() => {
    try {
      sessionStorage.setItem(
        editorStorageKey,
        JSON.stringify({
          side,
          zoom,
          mockupColor,
          frontElements,
          backElements,
          updatedAt: Date.now(),
        }),
      );
    } catch (error) {
      console.warn("Could not save editor draft:", error);
    }
  }, [editorStorageKey, side, zoom, mockupColor, frontElements, backElements]);

  const savePreviewData = useCallback(() => {
    if (!productId) return;

    const data = {
      productId,
      productSlug: routeId,
      side,
      mockupColor,
      designFront: frontElements,
      designBack: backElements,
      elements,
      generateMockupAI: true,
      temporaryPreview: true,
      updatedAt: Date.now(),
    };

    try {
      sessionStorage.setItem(previewStorageKey, JSON.stringify(data));
      localStorage.setItem(previewStorageKey, JSON.stringify(data));
    } catch (error) {
      console.warn("Could not save preview data:", error);
    }
  }, [
    productId,
    routeId,
    side,
    mockupColor,
    frontElements,
    backElements,
    elements,
    previewStorageKey,
  ]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(editorStorageKey);

      if (!saved) {
        setHistory([{ frontElements: [], backElements: [] }]);
        hasLoadedDraft.current = true;
        return;
      }

      const parsed = JSON.parse(saved);

      const loadedFront = Array.isArray(parsed.frontElements)
        ? parsed.frontElements
        : [];

      const loadedBack = Array.isArray(parsed.backElements)
        ? parsed.backElements
        : [];

      if (parsed.side === "front" || parsed.side === "back") {
        setSide(parsed.side);
      }

      if (typeof parsed.zoom === "number") {
        setZoom(Math.min(4, Math.max(0.25, parsed.zoom)));
      }

      if (typeof parsed.mockupColor === "string") {
        setMockupColor(parsed.mockupColor);
      }

      setFrontElements(loadedFront);
      setBackElements(loadedBack);

      setHistory([{ frontElements: loadedFront, backElements: loadedBack }]);
    } finally {
      hasLoadedDraft.current = true;
    }
  }, [editorStorageKey]);

  const handleSaveDesign = useCallback(async () => {
    if (!productId || saving) return;

    try {
      setSaving(true);
      saveDraftToSession();

      const response = await fetch("/api/user-products/save-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseProductId: productId,
          designFront: frontElements,
          designBack: backElements,
          mockupColor,
          markup: 0,
          generateMockupAI: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to save design");
      }

      savePreviewData();
      alert("Design saved successfully.");
    } catch (error) {
      console.error("SAVE ERROR:", error);
      alert("Error saving design");
    } finally {
      setSaving(false);
    }
  }, [
    productId,
    saving,
    saveDraftToSession,
    frontElements,
    backElements,
    mockupColor,
    savePreviewData,
  ]);

  const handlePreviewDesign = useCallback(() => {
    if (!productId) return;

    try {
      saveDraftToSession();
      savePreviewData();
    } catch (error) {
      console.error("PREVIEW ERROR:", error);
    }
  }, [productId, saveDraftToSession, savePreviewData]);

  useEffect(() => {
    if (!hasLoadedDraft.current) return;

    const snapshot = JSON.stringify({ frontElements, backElements });

    if (!lastHistorySnapshot.current) {
      lastHistorySnapshot.current = snapshot;
      setHistory([{ frontElements, backElements }]);
      return;
    }

    if (isHistoryAction.current) {
      isHistoryAction.current = false;
      lastHistorySnapshot.current = snapshot;
      return;
    }

    if (snapshot === lastHistorySnapshot.current) return;

    lastHistorySnapshot.current = snapshot;
    setHistory((prev) => {
      const next = [...prev, { frontElements, backElements }];
      return next.slice(-80);
    });
    setFuture([]);
  }, [frontElements, backElements]);

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length <= 1) return prev;

      const current = prev[prev.length - 1];
      const previous = prev[prev.length - 2];

      isHistoryAction.current = true;
      setFuture((items) => [current, ...items].slice(0, 80));
      setFrontElements(previous.frontElements);
      setBackElements(previous.backElements);
      setSelectedId(null);
      setSelectedElement(null);

      return prev.slice(0, -1);
    });
  }, []);

  const handleRedo = useCallback(() => {
    setFuture((prev) => {
      if (!prev.length) return prev;

      const next = prev[0];

      isHistoryAction.current = true;
      setHistory((items) => [...items, next].slice(-80));
      setFrontElements(next.frontElements);
      setBackElements(next.backElements);
      setSelectedId(null);
      setSelectedElement(null);

      return prev.slice(1);
    });
  }, []);

  if (!productId) {
    return (
      <ProductPicker
        currentSlug={productSlug}
        onSelect={(product) => {
          setResolvedProductId(product.id);
          router.replace(`/dashboard/design/${product.slug}?productId=${product.id}`);
        }}
      />
    );
  }

  return (
    <>
      <EditorShell
        sidebar={null}
        topbar={
          <TopBar
            productId={productId}
            side={side}
            setSide={setSide}
            zoomIn={zoomIn}
            zoomOut={zoomOut}
            zoom={Math.round(zoom * 100)}
            onZoomChange={handleZoomChange}
            onSaveDesign={handleSaveDesign}
            onPreviewDesign={handlePreviewDesign}
            onUndo={handleUndo}
            onRedo={handleRedo}
            saving={saving}
            elements={elements}
            frontElements={frontElements}
            backElements={backElements}
            mockupColor={mockupColor}
          />
        }
        canvas={
          <Canvas
            side={side}
            elements={elements}
            setElements={setElements}
            zoom={zoom}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            setSelectedElement={setSelectedElement}
            mockupColor={mockupColor}
            setMockupColor={setMockupColor}
          />
        }
        toolbar={
          <ToolbarFAB
            onUpload={addCenteredImage}
            onUploadClick={() => {
              if (!fileRef.current) return;
              fileRef.current.value = "";
              fileRef.current.click();
            }}
            onAddText={addCenteredText}
            setElements={setElements}
            elements={elements}
            selectedId={selectedId}
            zoomIn={zoomIn}
            zoomOut={zoomOut}
            safeArea={editorSafeArea}
          />
        }
      />

      <input
        ref={fileRef}
        type="file"
        hidden
        accept="image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg"
        onChange={handleUploadChange}
      />
    </>
  );
}