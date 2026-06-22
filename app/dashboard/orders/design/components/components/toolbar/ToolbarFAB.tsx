"use client";

import { useEffect, useMemo, useState } from "react";

import DesktopToolbar from "./DesktopToolbar";
import MobileToolbar from "./MobileToolbar";
import MobileSheet from "./MobileSheet";

import type { Panel } from "./type";
import { centerElement } from "../canvas/engine/printQuality";

type ElementItem = {
  id: string;
  type: "image" | "text" | "shape" | "logo" | "sticker" | "template" | "svg" | "qr" | "barcode";
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  content?: string;
  src?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  zIndex?: number;
  meta?: Record<string, any>;
};

type Props = {
  onUpload: (file: File) => void;
  onUploadClick: () => void;
  onAddText: () => void;
  setElements: React.Dispatch<React.SetStateAction<ElementItem[]>>;
  elements?: ElementItem[];
  selectedId: string | null;
  zoomIn: () => void;
  zoomOut: () => void;
  safeArea?: { width: number; height: number };
};

const DEFAULT_SAFE_AREA = { width: 660, height: 660 };

function finiteNumber(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export default function ToolbarFAB({
  onUpload,
  onAddText,
  setElements,
  elements = [],
  selectedId,
  safeArea = DEFAULT_SAFE_AREA,
}: Props) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>("templates");

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.body.classList.toggle("mynify-mobile-panel-open", open);
    window.dispatchEvent(new CustomEvent("mynify-mobile-panel-open-change", { detail: { open } }));

    return () => {
      document.body.classList.remove("mynify-mobile-panel-open");
      window.dispatchEvent(new CustomEvent("mynify-mobile-panel-open-change", { detail: { open: false } }));
    };
  }, [open]);

  const selected = useMemo(
    () => elements.find((el) => el.id === selectedId) ?? null,
    [elements, selectedId]
  );

  const createElement = (data: unknown) => {
    const item = data && typeof data === "object" ? (data as Partial<ElementItem>) : {};
    const width = finiteNumber(item.width, item.type === "image" ? 180 : 220);
    const height = finiteNumber(item.height, item.type === "image" ? 180 : 64);
    const maxZ = Math.max(0, ...elements.map((el) => finiteNumber(el.zIndex, 0)));

    const centered = centerElement({ width, height }, safeArea);

    const element: ElementItem = {
      id: crypto.randomUUID(),
      type: item.type ?? "text",
      // New elements must always start in the exact print area center, never in a viewport/corner fallback.
      x: centered.x,
      y: centered.y,
      width,
      height,
      text: item.text ?? item.content ?? "",
      content: item.content ?? item.text ?? "",
      src: item.src,
      color: item.color,
      fontFamily: item.fontFamily,
      fontSize: item.fontSize,
      fontWeight: item.fontWeight,
      zIndex: maxZ + 1,
      meta: {
        insertedFromPanel: panel,
        insertedAt: Date.now(),
        printKind: item.type === "image" || item.src ? "raster" : item.type === "text" ? "text" : "vector",
        dpiTarget: 300,
        dpi: item.type === "text" || item.type === "shape" || item.type === "svg" || item.type === "qr" || item.type === "barcode" ? 300 : undefined,
        effectiveDpi: item.type === "text" || item.type === "shape" || item.type === "svg" || item.type === "qr" || item.type === "barcode" ? 300 : undefined,
        qualityStatus: item.type === "text" || item.type === "shape" || item.type === "svg" || item.type === "qr" || item.type === "barcode" ? "Excellent" : "Unknown",
        printWidth: undefined,
        printHeight: undefined,
        transparent: Boolean(item.src && (String(item.src).startsWith("data:image/png") || String(item.src).startsWith("data:image/webp") || String(item.src).startsWith("data:image/svg") || /\.(png|webp|svg)$/i.test(String(item.src)))),
        preserveAlpha: Boolean(item.src && (String(item.src).startsWith("data:image/png") || String(item.src).startsWith("data:image/webp") || String(item.src).startsWith("data:image/svg") || /\.(png|webp|svg)$/i.test(String(item.src)))),
        originalWidth: item.meta?.originalWidth ?? item.meta?.naturalWidth,
        originalHeight: item.meta?.originalHeight ?? item.meta?.naturalHeight,
        ...(item.meta || {}),
      },
    };

    setElements((prev) => [...prev, { ...element, ...item, meta: element.meta }]);
    setOpen(false);
  };

  const updateSelected = (patch: Partial<ElementItem>) => {
    if (!selectedId) return;

    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== selectedId) return el;
        return {
          ...el,
          ...patch,
          meta: {
            ...(el.meta ?? {}),
            ...(patch.meta ?? {}),
          },
        };
      })
    );
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((el) => el.id !== selectedId));
    setOpen(false);
  };
  const updateElementById = (id: string, patch: any) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== id) return el;
        if (patch?.zAction === "bringForward") return { ...el, zIndex: finiteNumber(el.zIndex, 0) + 1 };
        if (patch?.zAction === "sendBackward") return { ...el, zIndex: Math.max(0, finiteNumber(el.zIndex, 0) - 1) };
        return { ...el, ...patch, meta: { ...(el.meta ?? {}), ...(patch.meta ?? {}) } };
      })
    );
  };

  const deleteElementById = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
  };


  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          body.mynify-mobile-panel-open .mynify-mobile-toolbar,
          body.mynify-mobile-panel-open .mynify-mobile-edit-toolbar,
          body.mynify-mobile-panel-open [data-mynify-mobile-toolbar="true"],
          body.mynify-mobile-panel-open [data-mynify-edit-toolbar="true"] {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
            opacity: 0 !important;
          }
        }
      `}</style>
      <DesktopToolbar
        selected={selected}
        onUpload={onUpload}
        onAddText={onAddText}
        createElement={createElement}
        updateSelected={updateSelected}
        deleteSelected={deleteSelected}
        elements={elements}
        setSelectedId={() => {}}
        setSelectedElement={() => {}}
        updateElement={updateElementById}
        deleteElement={deleteElementById}
      />

      {!open && (
        <MobileToolbar
          open={open}
          panel={panel}
          setOpen={setOpen}
          setPanel={(value: string) => setPanel(value as Panel)}
          selected={selected}
        />
      )}

      <MobileSheet
        open={open}
        panel={panel}
        setOpen={setOpen}
        selected={selected}
        onUpload={onUpload}
        onAddText={onAddText}
        createElement={createElement}
        updateSelected={updateSelected}
        deleteSelected={deleteSelected}
        elements={elements}
        setSelectedId={() => {}}
        setSelectedElement={() => {}}
        updateElement={updateElementById}
        deleteElement={deleteElementById}
      />
    </>
  );
}
