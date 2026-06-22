"use client";

import { useCallback, useRef } from "react";
import { getElementSize } from "../canvasMath";
import { snapPosition } from "../engine/snapping";

type DragSnapshot = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type UpdateOptions = {
  allElements?: any[];
  dispatchGuides?: boolean;
  transient?: boolean;
};

function hideGuides() {
  window.dispatchEvent(
    new CustomEvent("guides", {
      detail: { showVertical: false, showHorizontal: false },
    })
  );
}

function getBounds(items: DragSnapshot[]) {
  const left = Math.min(...items.map((item) => item.x));
  const top = Math.min(...items.map((item) => item.y));
  const right = Math.max(...items.map((item) => item.x + item.width));
  const bottom = Math.max(...items.map((item) => item.y + item.height));

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

export function useCanvasElements({ safeArea, setElements }: any) {
  const groupDragStartRef = useRef<DragSnapshot[] | null>(null);
  const hadTransientMoveRef = useRef(false);

  const updateSelectedElements = useCallback(
    (ids: string[], dx: number, dy: number, options: UpdateOptions = {}) => {
      if (!setElements || !Array.isArray(ids) || ids.length === 0) return;

      setElements(
        (prev: any[]) => {
          const list = Array.isArray(prev) ? prev : [];
          const movableIds = new Set(ids);

          if (!groupDragStartRef.current) {
            groupDragStartRef.current = list
              .filter((item) => movableIds.has(item.id) && !item.locked && !item.meta?.locked)
              .map((item) => {
                const size = getElementSize(item);
                return {
                  id: item.id,
                  x: Number(item.x) || 0,
                  y: Number(item.y) || 0,
                  width: size.width,
                  height: size.height,
                };
              });
          }

          const startItems = groupDragStartRef.current || [];
          if (!startItems.length) return list;

          const startBounds = getBounds(startItems);

          let finalDx = dx;
          let finalDy = dy;

          if (options.dispatchGuides) {
            const otherElements = list
              .filter((item) => !movableIds.has(item.id))
              .map((item) => {
                const size = getElementSize(item);
                return {
                  x: Number(item.x) || 0,
                  y: Number(item.y) || 0,
                  width: size.width,
                  height: size.height,
                };
              });

            const snapped = snapPosition(
              {
                x: startBounds.x + finalDx,
                y: startBounds.y + finalDy,
                width: startBounds.width,
                height: startBounds.height,
              },
              safeArea,
              otherElements
            );

            finalDx = snapped.x - startBounds.x;
            finalDy = snapped.y - startBounds.y;

            window.dispatchEvent(new CustomEvent("guides", { detail: snapped.guides }));
          }

          if (options.transient === true) hadTransientMoveRef.current = true;

          return list.map((item) => {
            if (!movableIds.has(item.id) || item.locked || item.meta?.locked) return item;

            const start = startItems.find((pos) => pos.id === item.id);
            if (!start) return item;

            return {
              ...item,
              x: Math.round(start.x + finalDx),
              y: Math.round(start.y + finalDy),
            };
          });
        },
        { record: options.transient !== true }
      );
    },
    [safeArea, setElements]
  );

  const endSelectedElementsDrag = useCallback(() => {
    groupDragStartRef.current = null;
    hideGuides();

    if (hadTransientMoveRef.current && setElements) {
      hadTransientMoveRef.current = false;
      setElements((prev: any[]) => (Array.isArray(prev) ? prev.map((item) => ({ ...item })) : prev), {
        record: true,
      });
    }
  }, [setElements]);

  return {
    updateSelectedElements,
    endSelectedElementsDrag,
  };
}
