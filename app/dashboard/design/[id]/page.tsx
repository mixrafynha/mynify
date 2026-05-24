"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");

  const fileRef = useRef<HTMLInputElement>(null);
  const hasLoadedDraft = useRef(false);
  const isHistoryAction = useRef(false);

  const editorStorageKey = useMemo(
    () => `editor-design:${productId || "draft"}`,
    [productId]
  );

  const previewStorageKey = useMemo(
    () => `mynify-editor-preview:${productId || "draft"}`,
    [productId]
  );

  const [side, setSide] = useState<Side>("front");
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<ElementType | null>(
    null
  );
  const [zoom, setZoomState] = useState(1);
  const [mockupColor, setMockupColor] = useState("#ffffff");

  const [frontElements, setFrontElements] = useState<ElementType[]>([]);
  const [backElements, setBackElements] = useState<ElementType[]>([]);

  const [history, setHistory] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);

  const elements = side === "back" ? backElements : frontElements;
  const setElements = side === "back" ? setBackElements : setFrontElements;

  const { addText, addElement, updateSelected } = useElements({
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
    [uploadImage]
  );

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;

    setElements((prev) => prev.filter((el) => el.id !== selectedId));
    setSelectedId(null);
    setSelectedElement(null);
  }, [selectedId, setElements]);

  const setZoom = useCallback((value: number | ((z: number) => number)) => {
    setZoomState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      return Math.min(2, Math.max(0.4, Number(next.toFixed(2))));
    });
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
        })
      );
    } catch (error) {
      console.warn("Could not save editor draft:", error);
    }
  }, [
    editorStorageKey,
    side,
    zoom,
    mockupColor,
    frontElements,
    backElements,
  ]);

  const savePreviewData = useCallback(() => {
    if (!productId) return;

    const data = {
      productId,
      side,
      mockupColor,
      designFront: frontElements,
      designBack: backElements,
      elements,
      generateMockupAI: true,
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
        setZoomState(Math.min(2, Math.max(0.4, parsed.zoom)));
      }

      if (typeof parsed.mockupColor === "string") {
        setMockupColor(parsed.mockupColor);
      }

      setFrontElements(loadedFront);
      setBackElements(loadedBack);
      setHistory([{ frontElements: loadedFront, backElements: loadedBack }]);
    } catch {
      sessionStorage.removeItem(editorStorageKey);
      setHistory([{ frontElements: [], backElements: [] }]);
    } finally {
      hasLoadedDraft.current = true;
    }
  }, [editorStorageKey]);

  useEffect(() => {
    if (!hasLoadedDraft.current) return;

    const timeout = window.setTimeout(() => {
      saveDraftToSession();
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [saveDraftToSession]);

  useEffect(() => {
    if (!hasLoadedDraft.current) return;

    if (isHistoryAction.current) {
      isHistoryAction.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      setHistory((prev) => {
        const current = { frontElements, backElements };
        const last = prev[prev.length - 1];

        if (JSON.stringify(last) === JSON.stringify(current)) {
          return prev;
        }

        return [...prev.slice(-29), current];
      });

      setFuture([]);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [frontElements, backElements]);

  useEffect(() => {
    return () => {
      [...frontElements, ...backElements].forEach((el) => {
        if (el.type === "image" && el.src?.startsWith("blob:")) {
          URL.revokeObjectURL(el.src);
        }
      });
    };
  }, [frontElements, backElements]);

  const onUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length <= 1) return prev;

      const current = prev[prev.length - 1];
      const previous = prev[prev.length - 2];

      isHistoryAction.current = true;

      setFuture((f) => [current, ...f].slice(0, 30));
      setFrontElements(previous.frontElements);
      setBackElements(previous.backElements);
      setSelectedId(null);
      setSelectedElement(null);

      return prev.slice(0, -1);
    });
  }, []);

  const onRedo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev;

      const next = prev[0];

      isHistoryAction.current = true;

      setHistory((h) => [...h.slice(-29), next]);
      setFrontElements(next.frontElements);
      setBackElements(next.backElements);
      setSelectedId(null);
      setSelectedElement(null);

      return prev.slice(1);
    });
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(1.35, z + 0.1));
  }, [setZoom]);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.75, z - 0.1));
  }, [setZoom]);

  const handleSaveDesign = useCallback(async () => {
    if (!productId || saving) {
      if (!productId) alert("Missing product ID");
      return;
    }

    try {
      setSaving(true);
      saveDraftToSession();
      savePreviewData();

      const response = await fetch("/api/user-products/save-design", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      sessionStorage.removeItem(editorStorageKey);

      router.push(`/dashboard/design/preview/${data.product.id}`);
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
    savePreviewData,
    frontElements,
    backElements,
    mockupColor,
    editorStorageKey,
    router,
  ]);

  const handlePreviewDesign = useCallback(async () => {
    if (!productId || saving) {
      if (!productId) alert("Missing product ID");
      return;
    }

    try {
      setSaving(true);
      saveDraftToSession();
      savePreviewData();

      const response = await fetch("/api/user-products/save-design", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      router.push(
        `/dashboard/design/preview/${data.product.id}?generateMockupAI=1`
      );
    } catch (error) {
      console.error("PREVIEW ERROR:", error);
      alert("Error opening preview");
    } finally {
      setSaving(false);
    }
  }, [
    productId,
    saving,
    saveDraftToSession,
    savePreviewData,
    frontElements,
    backElements,
    mockupColor,
    router,
  ]);

  return (
    <>
      <EditorShell
        sidebar={null}
        topbar={
          <TopBar
            productId={productId || undefined}
            side={side}
            setSide={setSide}
            zoomIn={zoomIn}
            zoomOut={zoomOut}
            onUndo={history.length > 1 ? onUndo : undefined}
            onRedo={future.length > 0 ? onRedo : undefined}
            onSaveDesign={handleSaveDesign}
            onPreviewDesign={handlePreviewDesign}
            saving={saving}
            elements={elements}
            mockupColor={mockupColor}
          />
        }
        canvas={
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#070711] px-0 pb-[100px] md:pb-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(168,85,247,0.22),transparent_30%),radial-gradient(circle_at_80%_60%,rgba(14,165,233,0.16),transparent_24%),linear-gradient(180deg,#070711_0%,#0b0b17_100%)]" />

            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.03]" />

            <div className="absolute left-[-120px] top-[10%] h-[320px] w-[320px] rounded-full bg-purple-600/20 blur-[120px]" />
            <div className="absolute bottom-[5%] right-[-100px] h-[260px] w-[260px] rounded-full bg-cyan-500/10 blur-[120px]" />

            <div className="relative z-10 flex h-full w-full items-center justify-center">
              <Canvas
                side={side}
                elements={elements}
                setElements={setElements}
                zoom={zoom}
                setZoom={setZoom}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                selectedElement={selectedElement}
                setSelectedElement={setSelectedElement}
                mockupColor={mockupColor}
                setMockupColor={setMockupColor}
              />
            </div>
          </div>
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
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        onChange={handleUploadChange}
      />
    </>
  );
}