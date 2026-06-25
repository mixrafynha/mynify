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

export default function EditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("productId") || searchParams.get("baseProductId");
  const category = String(params?.id || "tshirt").toLowerCase();

  const fileRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLDivElement>(null);
  const hasLoadedDraft = useRef(false);
  const isHistoryAction = useRef(false);
  const pendingSaveAfterAuthRef = useRef(false);

  const editorStorageKey = useMemo(
    () => `editor-design:${productId || category || "draft"}`,
    [productId, category],
  );

  const [side, setSide] = useState<Side>("front");
  const [saving, setSaving] = useState(false);
  const [authPopupOpen, setAuthPopupOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<ElementType | null>(null);

  const [zoom, setZoom] = useState(1);
  const [mockupColor, setMockupColor] = useState("#ffffff");

  const [frontElements, setFrontElements] = useState<ElementType[]>([]);
  const [backElements, setBackElements] = useState<ElementType[]>([]);

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

    document.addEventListener("gesturestart", preventGesture, { passive: false } as AddEventListenerOptions);
    document.addEventListener("gesturechange", preventGesture, { passive: false } as AddEventListenerOptions);
    document.addEventListener("gestureend", preventGesture, { passive: false } as AddEventListenerOptions);
    document.addEventListener("touchmove", preventMultiTouch, { passive: false });
    document.addEventListener("dblclick", preventEditorDoubleTapZoom, { passive: false });

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
    setZoom((z) => Math.min(1.35, z + 0.1));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.75, z - 0.1));
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
        setZoom(Math.min(2, Math.max(0.4, parsed.zoom)));
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
    if (saving) return;

    const baseProductId = productId || category;

    if (!baseProductId) {
      alert("Product missing. Open the editor from a product page before saving.");
      return;
    }

    try {
      setSaving(true);
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
      });

      const response = await fetch("/api/user-products/save-design", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(designPayload),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        pendingSaveAfterAuthRef.current = true;
        setAuthPopupOpen(true);
        return;
      }

      if (!response.ok) {
        throw new Error(data?.error || "Failed to save design");
      }

      sessionStorage.removeItem(editorStorageKey);
      const cartUrl = data?.redirectTo || (data?.designId ? `/cart?designId=${data.designId}` : null);

      if (cartUrl) {
        router.push(cartUrl);
        return;
      }

      console.info("Design saved", data);
    } catch (error) {
      console.error("SAVE ERROR:", error);
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
      console.error("PREVIEW CANVAS REF MISSING");
      return;
    }

    const exportNode =
      previewCanvasRef.current.querySelector(
        "#mockup-export-root"
      ) as HTMLElement | null;

    if (!exportNode) {
      console.error("MOCKUP EXPORT ROOT MISSING");
      return;
    }

    console.log("EXPORT NODE", exportNode);

    const designImage = await captureProductionPreview(exportNode);

    console.log("REAL PREVIEW IMAGE", {
      type: typeof designImage,
      length: designImage?.length,
      start:
        typeof designImage === "string"
          ? designImage.slice(0, 80)
          : null,
    });

    if (
      typeof designImage !== "string" ||
      !designImage.startsWith("data:image/")
    ) {
      console.error("INVALID DESIGN IMAGE", designImage);
      return;
    }

    // Se precisares de usar a imagem, guarda-a num estado:
    // setPreviewImage(designImage);

    return;
  } catch (error) {
    console.error("PREVIEW ERROR:", error);
    return;
  }
}, [saveDraftToSession]);
  useEffect(() => {
    if (!hasLoadedDraft.current || isHistoryAction.current) return;

    const snapshot = { frontElements, backElements };
    const serialized = JSON.stringify(snapshot);
    const last = history[history.length - 1];

    if (last && JSON.stringify(last) === serialized) return;

    setHistory((prev) => {
      const previous = prev[prev.length - 1];
      if (previous && JSON.stringify(previous) === serialized) return prev;
      return [...prev, snapshot].slice(-80);
    });
    setFuture([]);
  }, [frontElements, backElements, history]);

  const applyHistoryState = useCallback((state: HistoryState) => {
    isHistoryAction.current = true;
    setFrontElements(state.frontElements || []);
    setBackElements(state.backElements || []);
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
    saveDraftToSession();
  }, [applyHistoryState, saveDraftToSession]);

  return (
    <>
      <EditorShell
        sidebar={null}
        topbar={
          <TopBar
            productId={productId || undefined}
            category={category}
            side={side}
            setSide={setSide}
            zoomIn={zoomIn}
            zoomOut={zoomOut}
            zoom={Math.round(zoom * 100)}
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
            canvasRef={previewCanvasRef}
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