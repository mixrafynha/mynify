"use client";

import { useState } from "react";

export function useDesignEditor() {
  const [elements, setElements] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const addImage = (src: string) => {
    setElements((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "image",
        src,
        x: 50,
        y: 50,
        width: 120,
        height: 120,
      },
    ]);
  };

  const addText = () => {
    setElements((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "text",
        text: "Text",
        x: 50,
        y: 50,
        fontSize: 20,
        fontFamily: "Arial",
        color: "#000",
      },
    ]);
  };

  const update = (id: string, data: any) => {
    setElements((prev) =>
      prev.map((el) =>
        el.id === id ? { ...el, ...data } : el
      )
    );
  };

  return {
    elements,
    setElements,
    selectedId,
    setSelectedId,  
    addText,
    addImage,
    update,
  };
}
