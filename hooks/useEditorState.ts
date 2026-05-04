"use client";

import { useState, useCallback } from "react";
import { ElementType } from "../types/editor.types";

export function useEditorState() {
  const [side, setSide] = useState<"front" | "back">("front");
  const [zoom, setZoom] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [front, setFront] = useState<ElementType[]>([]);
  const [back, setBack] = useState<ElementType[]>([]);

  const elements = side === "back" ? back : front;
  const setElements = side === "back" ? setBack : setFront;

  const updateSelected = useCallback(
    (patch: Partial<ElementType>) => {
      setElements((prev) =>
        prev.map((el) =>
          el.id === selectedId
            ? {
                ...el,
                ...patch,
                meta: {
                  ...el.meta,
                  ...patch.meta,
                },
              }
            : el
        )
      );
    },
    [selectedId, setElements]
  );

  return {
    side,
    setSide,
    zoom,
    setZoom,
    selectedId,
    setSelectedId,
    elements,
    setElements,
    updateSelected,
  };
}