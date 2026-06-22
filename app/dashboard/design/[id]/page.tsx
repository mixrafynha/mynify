"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";

import Canvas from "@/app/dashboard/design/components/Canvas";
import TopBar from "@/app/dashboard/design/components/TopBar";
import EditorShell from "@/app/dashboard/design/components/EditorShell";
import ToolbarFAB from "@/app/dashboard/design/components/toolbar/ToolbarFAB";

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

  zIndex?: number;
  rotation?: number;
  opacity?: number;
  locked?: boolean;

  meta?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    fontWeight?: string | number;
    textAlign?: "left" | "center" | "right";

    [key: string]: unknown;
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

export default function EditorPage() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();

  const routeId = typeof params?.id === "string" ? params.id : "";
  const queryProductId = searchParams.get("productId");

  const [resolvedProductId, setResolvedProductId] = useState<string | null>(
    isUuid(queryProductId) ? queryProductId : isUuid(routeId) ? routeId : null,
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

  const [side, setSide] = useState<Side>("front");
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

      if (isUuid(raw)) {
        setResolvedProductId(raw);
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
      <div className="flex min-h-screen items-center justify-center bg-[#05050d] text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center">
          <p className="text-sm font-bold text-white/70">Loading product...</p>
        </div>
      </div>
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
          />
        }
      />

      <input
        ref={fileRef}
        type="file"
        hidden
        accept="image/png,image/jpeg,image/webp"
        onChange={handleUploadChange}
      />
    </>
  );
}