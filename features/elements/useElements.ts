"use client";

import { useCallback } from "react";
import { getCenterPositionForNewElement } from "@/app/dashboard/design/components/canvas/canvasMath";

type Props = {
  setElements: React.Dispatch<React.SetStateAction<any[]>>;
  selectedId: string | null;
  safeArea?: { width: number; height: number };
};

export function useElements({
  setElements,
  selectedId,
  safeArea,
}: Props) {
  const addText = useCallback(() => {
    console.log("ADD TEXT");

    const centered = safeArea
      ? getCenterPositionForNewElement({ width: 220, height: 64 }, safeArea)
      : { x: 120, y: 120, width: 220, height: 64 };

    setElements((prev) => {
      const next = [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "text",
          text: "Edit me",
          x: centered.x,
          y: centered.y,
          width: centered.width,
          height: centered.height,
          meta: {
            fontSize: 24,
            fontFamily: "Arial",
            color: "#111",
          },
        },
      ];

      console.log(
        "ELEMENTS AFTER ADD TEXT:",
        next
      );

      return next;
    });
  }, [safeArea, setElements]);

  const addElement = useCallback(
    (el: any) => {
      console.log(
        "ADD ELEMENT RECEIVED:",
        el
      );

      setElements((prev) => {
        console.log(
          "PREVIOUS ELEMENTS:",
          prev
        );

        const next = [
          ...prev,
          {
            ...el,
            id: crypto.randomUUID(),
          },
        ];

        console.log(
          "ELEMENTS AFTER ADD:",
          next
        );

        return next;
      });
    },
    [setElements]
  );

  const updateSelected = useCallback(
    (patch: any) => {
      console.log(
        "UPDATE SELECTED:",
        patch
      );

      if (!selectedId) {
        console.log(
          "NO SELECTED ID"
        );
        return;
      }

      setElements((prev) => {
        console.log(
          "ELEMENTS BEFORE UPDATE:",
          prev
        );

        const next = prev.map((el) =>
          el.id === selectedId
            ? {
                ...el,
                ...patch,
                meta: {
                  ...(el.meta ?? {}),
                  ...(patch.meta ?? {}),
                },
              }
            : el
        );

        console.log(
          "ELEMENTS AFTER UPDATE:",
          next
        );

        return next;
      });
    },
    [setElements, selectedId]
  );

  return {
    addText,
    addElement,
    updateSelected,
  };
}
