"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import DesktopToolbar from "./DesktopToolbar";
import MobileToolbar from "./MobileToolbar";
import MobileSheet from "./MobileSheet";

import type { Panel } from "./type";
import { useCanvasColors } from "../canvas/hooks/useCanvasColors";
import { useMobileDetection } from "../canvas/hooks/useMobileDetection";

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
  zoomIn: () => void;
  zoomOut: () => void;
  mockupColor?: string;
  setMockupColor?: (color: string) => void;
  productColorKey?: string | null;
};

const DEFAULT_CENTER = { x: 330, y: 330 };
const EMPTY_ELEMENTS: ElementItem[] = [];

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
  mockupColor = "#ffffff",
  setMockupColor,
  productColorKey = null,
}: Props) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>("templates");
  const isMobile = useMobileDetection();
  const elementsRef = useRef<ElementItem[]>(elements);

  useEffect(() => {
    elementsRef.current = Array.isArray(elements) ? elements : [];
  }, [elements]);

  const { availableColors } = useCanvasColors(productColorKey, mockupColor, setMockupColor);

  const selected = useMemo(
    () => elements.find((el) => el.id === selectedId) ?? null,
    [elements, selectedId]
  );

  const createElement = useCallback((data: unknown) => {
    const item = data && typeof data === "object" ? (data as Partial<ElementItem>) : {};
    const width = finiteNumber(item.width, item.type === "image" ? 180 : 220);
    const height = finiteNumber(item.height, item.type === "image" ? 180 : 64);
    const currentElements = elementsRef.current;
    const maxZ = Math.max(0, ...currentElements.map((el) => finiteNumber(el.zIndex, 0)));

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
      zIndex: maxZ + 1,
      meta: {
        insertedFromPanel: panel,
        insertedAt: Date.now(),
        ...(item.meta || {}),
      },
    };

    setElements((prev) => [...prev, { ...element, ...item, meta: element.meta }]);
    setOpen(false);
  }, [panel, setElements]);

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


  const sheetElements = panel === "layers" ? elements : EMPTY_ELEMENTS;

  return (
    <>
      {!isMobile && (
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
      )}

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
        elements={sheetElements}
        setSelectedId={() => {}}
        setSelectedElement={() => {}}
        updateElement={updateElementById}
        deleteElement={deleteElementById}
        mockupColor={mockupColor}
        setMockupColor={setMockupColor}
        availableColors={availableColors}
      />
    </>
  );
}
