"use client";

import { useCallback } from "react";
import { MOCKUP_AREA } from "../constants";
import SelectionBox from "./SelectionBox";
import CanvasGuides from "./CanvasGuides";
import { getElementSize } from "../canvasMath";

interface SafeAreaLayerProps {
  safeArea: { x: number; y: number; width: number; height: number };
  finalScale: number;
  elements: any[];
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setSelectedId: (id: string | null) => void;
  setSelectedElement: (el: any | null) => void;
  setSelectionBox: (box: any) => void;
  selectionBox?: any;
  clearSelection: () => void;
  children: React.ReactNode;
  onOutsideClick?: () => void;
  previewMode?: boolean;
}

function toLocalPoint(e: PointerEvent | React.PointerEvent, rect: DOMRect, scale: number) {
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  return {
    x: (e.clientX - rect.left) / safeScale,
    y: (e.clientY - rect.top) / safeScale,
  };
}

export default function SafeAreaLayer({
  safeArea,
  finalScale,
  elements,
  setSelectedIds,
  setSelectedId,
  setSelectedElement,
  setSelectionBox,
  selectionBox,
  clearSelection,
  children,
  onOutsideClick,
  previewMode = false,
}: SafeAreaLayerProps) {
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (previewMode) return;
      if (e.button !== 0) return;

      const target = e.target as HTMLElement;

      if (
        target.closest("[data-draggable-element]") ||
        target.closest("[data-element-control]") ||
        target.closest("[data-resize-handle]")
      ) {
        return;
      }

      if (e.target !== e.currentTarget) return;

      e.preventDefault();
      e.stopPropagation();

      const node = e.currentTarget;
      const rect = node.getBoundingClientRect();
      const start = toLocalPoint(e, rect, finalScale);

      clearSelection();
      onOutsideClick?.();
      node.setPointerCapture?.(e.pointerId);

      setSelectionBox({ x: start.x, y: start.y, w: 0, h: 0 });

      const onMove = (ev: PointerEvent) => {
        const current = toLocalPoint(ev, rect, finalScale);

        setSelectionBox({
          x: Math.min(start.x, current.x),
          y: Math.min(start.y, current.y),
          w: Math.abs(current.x - start.x),
          h: Math.abs(current.y - start.y),
        });
      };

      const onUp = (ev: PointerEvent) => {
        const end = toLocalPoint(ev, rect, finalScale);
        const box = {
          x: Math.min(start.x, end.x),
          y: Math.min(start.y, end.y),
          w: Math.abs(end.x - start.x),
          h: Math.abs(end.y - start.y),
        };

        const selected = (Array.isArray(elements) ? elements : [])
          .filter((el: any) => {
            const size = getElementSize(el);
            const x = Number(el.x) || 0;
            const y = Number(el.y) || 0;

            return (
              x < box.x + box.w &&
              x + size.width > box.x &&
              y < box.y + box.h &&
              y + size.height > box.y
            );
          })
          .map((el: any) => el.id);

        setSelectedIds(selected);
        setSelectedId(selected[selected.length - 1] || null);
        setSelectedElement(
          elements.find((el: any) => el.id === selected[selected.length - 1]) || null
        );
        setSelectionBox(null);

        node.releasePointerCapture?.(e.pointerId);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp, { passive: true });
      window.addEventListener("pointercancel", onUp, { passive: true });
    },
    [
      clearSelection,
      elements,
      finalScale,
      onOutsideClick,
      setSelectedElement,
      setSelectedId,
      setSelectedIds,
      setSelectionBox,
      previewMode,
    ]
  );

  return (
    <>
      <div
        id="design-safe-area"
        data-logical-width={safeArea.width}
        data-logical-height={safeArea.height}
        className={`absolute z-20 overflow-hidden ${previewMode ? "pointer-events-none" : "pointer-events-auto"}`}
        onPointerDown={handlePointerDown}
        style={{
          left: `${(safeArea.x / MOCKUP_AREA.width) * 100}%`,
          top: `${(safeArea.y / MOCKUP_AREA.height) * 100}%`,
          width: `${(safeArea.width / MOCKUP_AREA.width) * 100}%`,
          height: `${(safeArea.height / MOCKUP_AREA.height) * 100}%`,
          touchAction: previewMode ? "auto" : "none",
          contain: "layout paint size",
        }}
      >
        {!previewMode && <CanvasGuides logicalWidth={safeArea.width} logicalHeight={safeArea.height} />}
        {children}
        {!previewMode && selectionBox && <SelectionBox box={selectionBox} />}
      </div>
    </>
  );
}
