"use client";

import { useCallback, useState } from "react";
import { DesignElement } from "@/types/design";

export function useDesignEditor() {
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ================= ADD TEXT =================
  const addText = useCallback(() => {
    setElements((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "text",
        text: "Text",
        x: 80,
        y: 80,

        // 🔥 DEFAULTS PRO
        fontSize: 22,
        fontFamily: "Arial",
        color: "#000000",
        fontWeight: "bold",
      },
    ]);
  }, []);

  // ================= ADD IMAGE (SAFE) =================
  const addImage = useCallback((src: string) => {
    if (!src || typeof src !== "string") return;

    setElements((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "image",
        src,

        x: 80,
        y: 80,

        width: 120,
        height: 120,
      },
    ]);
  }, []);

  // ================= UPDATE ELEMENT (SAFETY + IMMUTABLE) =================
  const update = useCallback(
    (id: string, data: Partial<DesignElement>) => {
      setElements((prev) =>
        prev.map((el) =>
          el.id === id
            ? {
                ...el,
                ...data,

                // 🔒 safety clamp (evita NaN / undefined breaking canvas)
                x: data.x ?? el.x,
                y: data.y ?? el.y,
              }
            : el
        )
      );
    },
    []
  );

  // ================= DELETE ELEMENT (ESSENTIAL SaaS FEATURE) =================
  const remove = useCallback((id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));

    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  // ================= CLEAR CANVAS =================
  const clear = useCallback(() => {
    setElements([]);
    setSelectedId(null);
  }, []);

  return {
    elements,

    selectedId,
    setSelectedId,

    addText,
    addImage,
    update,
    remove,
    clear,
  };
}