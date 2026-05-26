"use client";

import { useState } from "react";

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
  src?: string;
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
};

export default function ToolbarFAB({
  onUpload,
  onUploadClick,
  onAddText,
  setElements,
  elements = [],
  selectedId,
  zoomIn,
  zoomOut,
}: Props) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>("templates");

  const selected = elements.find((el) => el.id === selectedId) ?? null;

  const createElement = (data: unknown) => {
    const item =
      data && typeof data === "object"
        ? (data as Partial<ElementItem>)
        : {};

    setElements((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "text",
        x: 120,
        y: 120,
        meta: {},
        ...item,
      } as ElementItem,
    ]);

    setOpen(false);
  };

  const updateSelected = (patch: Partial<ElementItem>) => {
    if (!selectedId) return;

    setElements((prev) =>
      prev.map((el) =>
        el.id !== selectedId
          ? el
          : {
              ...el,
              ...patch,
              meta: {
                ...(el.meta ?? {}),
                ...(patch.meta ?? {}),
              },
            }
      )
    );
  };

  const deleteSelected = () => {
    if (!selectedId) return;

    setElements((prev) => prev.filter((el) => el.id !== selectedId));
    setOpen(false);
  };

  return (
    <>
      <DesktopToolbar
        selected={selected}
        onUpload={onUpload}
        onAddText={onAddText}
        createElement={createElement}
        updateSelected={updateSelected}
        deleteSelected={deleteSelected}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
      />

      <MobileToolbar
        open={open}
        panel={panel}
        setOpen={setOpen}
        setPanel={setPanel}
        selected={selected}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
      />

      <MobileSheet
        open={open}
        panel={panel}
        setOpen={setOpen}
        selected={selected}
        onUpload={onUpload}
        onUploadClick={onUploadClick}
        onAddText={onAddText}
        createElement={createElement}
        updateSelected={updateSelected}
        deleteSelected={deleteSelected}
      />
    </>
  );
}
