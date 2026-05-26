"use client";

import { useMemo, useState } from "react";

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
  setElements: React.Dispatch<
    React.SetStateAction<ElementItem[]>
  >;
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
}: Props) {
  const [open, setOpen] =
    useState(false);

  const [panel, setPanel] =
    useState<Panel>("templates");

  const selected = useMemo(
    () =>
      elements.find(
        (el) => el.id === selectedId
      ) ?? null,
    [elements, selectedId]
  );

 const createElement = (
  data: unknown
) => {
  const item =
    data &&
    typeof data === "object"
      ? (data as Partial<ElementItem>)
      : {};

  const element: ElementItem = {
    id: crypto.randomUUID(),

    type:
      item.type ?? "text",

    // centro aproximado do canvas
    // canvas depois ajusta safe area
    x:
      typeof item.x === "number"
        ? item.x
        : 220,

    y:
      typeof item.y === "number"
        ? item.y
        : 260,

    width: item.width,
    height: item.height,

    text:
      item.text ?? "",

    src: item.src,

    meta: {
      insertedYOffset: 0,
      ...(item.meta || {}),
    },
  };

  setElements((prev) => [
    ...prev,
    {
      ...element,
      ...item,
    },
  ]);

  setOpen(false);
};

  const updateSelected = (
    patch: Partial<ElementItem>
  ) => {
    if (!selectedId) return;

    setElements((prev) =>
      prev.map((el) => {
        if (
          el.id !== selectedId
        ) {
          return el;
        }

        return {
          ...el,
          ...patch,

          meta: {
            ...(el.meta ??
              {}),
            ...(patch.meta ??
              {}),
          },
        };
      })
    );
  };

  const deleteSelected = () => {
    if (!selectedId) return;

    setElements((prev) =>
      prev.filter(
        (el) =>
          el.id !== selectedId
      )
    );

    setOpen(false);
  };

  return (
    <>
      <DesktopToolbar
        selected={selected}
        onUpload={onUpload}
        onAddText={onAddText}
        createElement={
          createElement
        }
        updateSelected={
          updateSelected
        }
        deleteSelected={
          deleteSelected
        }
      />

      <MobileToolbar
        open={open}
        panel={panel}
        setOpen={setOpen}
        setPanel={(
          value: string
        ) =>
          setPanel(
            value as Panel
          )
        }
        selected={selected}
      />

      <MobileSheet
        open={open}
        panel={panel}
        setOpen={setOpen}
        selected={selected}
        onUpload={onUpload}
        onAddText={onAddText}
        createElement={
          createElement
        }
        updateSelected={
          updateSelected
        }
        deleteSelected={
          deleteSelected
        }
      />
    </>
  );
}
