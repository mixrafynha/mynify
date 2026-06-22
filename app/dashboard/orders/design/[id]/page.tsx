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
  const productId = searchParams.get("productId");
  const category = String(params?.id || "tshirt").toLowerCase();

  const fileRef = useRef<HTMLInputElement>(null);
  const hasLoadedDraft = useRef(false);
  const isHistoryAction = useRef(false);

  const editorStorageKey = useMemo(
    () => `editor-design:${productId || category || "draft"}`,
    [productId, category]
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
    [uploadImage]
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
        })
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

      const loadedFront = Array.isArray(parsed.frontElements) ? parsed.frontElements : [];
      const loadedBack = Array.isArray(parsed.backElements) ? parsed.backElements : [];

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

      sessionStorage.removeItem(editorStorageKey);
      console.info("Design saved", data);
    } catch (error) {
      console.error("SAVE ERROR:", error);
      alert("Error saving design");
    } finally {
      setSaving(false);
    }
  }, [productId, saving, saveDraftToSession, frontElements, backElements, mockupColor, editorStorageKey]);

  const handlePreviewDesign = useCallback(async () => {
    if (!productId || saving) return;

    try {
      setSaving(true);
      saveDraftToSession();
    } catch (error) {
      console.error("PREVIEW ERROR:", error);
      alert("Error opening preview");
    } finally {
      setSaving(false);
    }
  }, [productId, saving, saveDraftToSession]);


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
  }, [frontElements, backElements]);

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