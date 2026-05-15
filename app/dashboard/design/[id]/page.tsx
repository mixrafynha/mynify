"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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

  const [side, setSide] = useState<Side>("front");
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoomState] = useState(1);
  const [mockupColor, setMockupColor] = useState("#ffffff");

  const [frontElements, setFrontElements] = useState<ElementType[]>([]);
  const [backElements, setBackElements] = useState<ElementType[]>([]);

  const [history, setHistory] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);

  const elements = side === "back" ? backElements : frontElements;
  const setElements = side === "back" ? setBackElements : setFrontElements;

  const { addText } = useElements({
    setElements,
    selectedId,
  });

  const handleUpload = useUpload({ setElements });

  const setZoom = (value: number | ((z: number) => number)) => {
    setZoomState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      return Math.min(2, Math.max(0.4, Number(next.toFixed(2))));
    });
  };

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(editorStorageKey);

      if (!saved) {
        hasLoadedDraft.current = true;
        return;
      }

      const parsed = JSON.parse(saved);

      if (parsed.side === "front" || parsed.side === "back") {
        setSide(parsed.side);
      }

      if (typeof parsed.zoom === "number") {
        setZoomState(Math.min(2, Math.max(0.4, parsed.zoom)));
      }

      if (typeof parsed.mockupColor === "string") {
        setMockupColor(parsed.mockupColor);
      }

      if (Array.isArray(parsed.frontElements)) {
        setFrontElements(parsed.frontElements);
      }

      if (Array.isArray(parsed.backElements)) {
        setBackElements(parsed.backElements);
      }
    } catch {
      sessionStorage.removeItem(editorStorageKey);
    } finally {
      hasLoadedDraft.current = true;
    }
  }, [editorStorageKey]);

  useEffect(() => {
    if (!hasLoadedDraft.current) return;

    const timeout = window.setTimeout(() => {
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
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [editorStorageKey, side, zoom, mockupColor, frontElements, backElements]);

  useEffect(() => {
    if (!hasLoadedDraft.current) return;

    if (isHistoryAction.current) {
      isHistoryAction.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      setHistory((prev) => {
        const last = prev[prev.length - 1];
        const current = {
          frontElements,
          backElements,
        };

        if (JSON.stringify(last) === JSON.stringify(current)) {
          return prev;
        }

        return [...prev.slice(-29), current];
      });

      setFuture([]);
    }, 300);

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

  const onUndo = () => {
    setHistory((prev) => {
      if (prev.length <= 1) return prev;

      const current = prev[prev.length - 1];
      const previous = prev[prev.length - 2];

      isHistoryAction.current = true;

      setFuture((f) => [current, ...f].slice(0, 30));
      setFrontElements(previous.frontElements);
      setBackElements(previous.backElements);
      setSelectedId(null);

      return prev.slice(0, -1);
    });
  };

  const onRedo = () => {
    setFuture((prev) => {
      if (prev.length === 0) return prev;

      const next = prev[0];

      isHistoryAction.current = true;

      setHistory((h) => [...h.slice(-29), next]);
      setFrontElements(next.frontElements);
      setBackElements(next.backElements);
      setSelectedId(null);

      return prev.slice(1);
    });
  };

  const zoomIn = () => setZoom((z) => Math.min(1.35, z + 0.1));
  const zoomOut = () => setZoom((z) => Math.max(0.75, z - 0.1));

  const handleSaveDesign = async () => {
    try {
      if (!productId) {
        alert("Missing product ID");
        return;
      }

      setSaving(true);

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
  };

  return (
    <>
      <EditorShell
        sidebar={null}
        topbar={
          <TopBar
            side={side}
            setSide={setSide}
            zoomIn={zoomIn}
            zoomOut={zoomOut}
            onUndo={history.length > 1 ? onUndo : undefined}
            onRedo={future.length > 0 ? onRedo : undefined}
            onSaveDesign={handleSaveDesign}
            onPreviewDesign={handleSaveDesign}
            saving={saving}
          />
        }
        canvas={
          <main className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#070711] px-0 pb-[100px] md:pb-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(168,85,247,0.22),transparent_30%),radial-gradient(circle_at_80%_60%,rgba(14,165,233,0.16),transparent_24%),linear-gradient(180deg,#070711_0%,#0b0b17_100%)]" />

            <div
              className="
                absolute inset-0 opacity-[0.03]
                bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)]
                bg-[size:40px_40px]
              "
            />

            <div className="absolute left-[-120px] top-[10%] h-[320px] w-[320px] rounded-full bg-purple-600/20 blur-[120px]" />
            <div className="absolute right-[-100px] bottom-[5%] h-[260px] w-[260px] rounded-full bg-cyan-500/10 blur-[120px]" />

            <div className="relative z-10 flex h-full w-full items-center justify-center">
              <Canvas
                side={side}
                elements={elements}
                setElements={setElements}
                zoom={zoom}
                setZoom={setZoom}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                mockupColor={mockupColor}
                setMockupColor={setMockupColor}
              />
            </div>
          </main>
        }
        toolbar={
          <ToolbarFAB
            onUploadClick={() => fileRef.current?.click()}
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
        type="file"
        hidden
        ref={fileRef}
        accept="image/png,image/jpeg,image/webp"
        onChange={handleUpload}
      />
    </>
  );
}