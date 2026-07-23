"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import DesktopToolbar from "./DesktopToolbar";
import MobileToolbar from "./MobileToolbar";
import MobileSheet from "./MobileSheet";

import type { Panel } from "./type";

type ElementItem = {
  id: string;
  type: "image" | "text" | "shape";
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
  setSelectedId: (id: string | null) => void;
  zoomIn: () => void;
  zoomOut: () => void;
};

const DEFAULT_CENTER = { x: 330, y: 330 };

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
  setSelectedId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>("templates");

  useEffect(() => {
    const openMobileLayers = () => {
      setPanel("layers");
      setOpen(true);
    };

    window.addEventListener("ryfio:open-mobile-layers", openMobileLayers);
    return () => {
      window.removeEventListener("ryfio:open-mobile-layers", openMobileLayers);
    };
  }, []);

  const selected = useMemo(
    () => elements.find((el) => el.id === selectedId) ?? null,
    [elements, selectedId]
  );

  const createElement = useCallback((data: unknown) => {
    const item = data && typeof data === "object" ? (data as Partial<ElementItem>) : {};
    const width = finiteNumber(item.width, item.type === "image" ? 180 : 220);
    const height = finiteNumber(item.height, item.type === "image" ? 180 : 64);

    const element: ElementItem = {
      id: crypto.randomUUID(),
      type: item.type ?? "text",
      x: typeof item.x === "number" ? item.x : Math.round(DEFAULT_CENTER.x - width / 2),
      y: typeof item.y === "number" ? item.y : Math.round(DEFAULT_CENTER.y - height / 2),
      width,
      height,
      text: item.text ?? item.content ?? "",
      content: item.content ?? item.text ?? "",
      src: item.src,
      color: item.color,
      fontFamily: item.fontFamily,
      fontSize: item.fontSize,
      fontWeight: item.fontWeight,
      zIndex: 0,
      meta: {
        insertedFromPanel: panel,
        insertedAt: Date.now(),
        ...(item.meta || {}),
      },
    };

    setElements((prev) => {
      const maxZ = Math.max(-1, ...prev.map((existing) => finiteNumber(existing.zIndex, 0)));
      return [...prev, { ...element, ...item, zIndex: maxZ + 1, meta: element.meta }];
    });
    setOpen(false);
  }, [elements, panel, setElements]);

  const updateSelected = useCallback((patch: Partial<ElementItem>) => {
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
  }, [selectedId, setElements]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((el) => el.id !== selectedId));
    setOpen(false);
  }, [selectedId, setElements]);
  const updateElementById = useCallback((id: string, patch: any) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== id) return el;
        if (patch?.zAction === "bringForward") return { ...el, zIndex: finiteNumber(el.zIndex, 0) + 1 };
        if (patch?.zAction === "sendBackward") return { ...el, zIndex: Math.max(0, finiteNumber(el.zIndex, 0) - 1) };
        return { ...el, ...patch, meta: { ...(el.meta ?? {}), ...(patch.meta ?? {}) } };
      })
    );
  }, [setElements]);

  const deleteElementById = useCallback((id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
  }, [setElements]);


  return (
    <>
      <DesktopToolbar
        selected={selected}
        onUpload={onUpload}
        onAddText={onAddText}
        createElement={createElement}
        updateSelected={updateSelected}
        deleteSelected={deleteSelected}
        elements={elements}
        setSelectedId={setSelectedId}
        setSelectedElement={(element) => setSelectedId(element?.id ?? null)}
        updateElement={updateElementById}
        deleteElement={deleteElementById}
      />

      <MobileToolbar
        open={open}
        panel={panel}
        setOpen={setOpen}
        setPanel={(value: string) => setPanel(value as Panel)}
        selected={selected}
      />

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
        setSelectedId={setSelectedId}
        setSelectedElement={(element) => setSelectedId(element?.id ?? null)}
        updateElement={updateElementById}
        deleteElement={deleteElementById}
      />
    </>
  );
}
