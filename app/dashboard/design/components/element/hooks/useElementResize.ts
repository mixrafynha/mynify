"use client";

import { useCallback, useRef } from "react";
import { finiteNumber, getElementSize } from "../../canvas/canvasMath";
import { resizeElementByType } from "../../canvas/engine/transform";
import { useRafPointer } from "./useRafPointer";
import type { Direction } from "../ResizeHandles";

function normalizeZoom(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function stopPointer(e: React.PointerEvent) {
  e.preventDefault();
  e.stopPropagation();
}

export function useElementResize({
  el,
  elementRef,
  editing,
  isLocked,
  safeArea,
  zoom,
  updateElement,
}: any) {
  const resizeRef = useRef<any>(null);
  const { schedule, clearRaf } = useRafPointer();
  const scale = normalizeZoom(zoom);

  const resizeElement = useCallback(
    (e: React.PointerEvent, direction: Direction) => {
      if (isLocked || editing || e.button !== 0) return;
      stopPointer(e);

      const node = elementRef.current;
      node?.setPointerCapture?.(e.pointerId);

      const currentSize = getElementSize(el);
      resizeRef.current = {
        pointerId: e.pointerId,
        direction,
        startX: e.clientX,
        startY: e.clientY,
        start: {
          x: finiteNumber(el.x, 0),
          y: finiteNumber(el.y, 0),
          width: currentSize.width,
          height: currentSize.height,
        },
        fontSize: Number(el.meta?.fontSize) || 42,
      };

      let lastPatch: any = null;

      const onMove = (ev: PointerEvent) => {
        if (!resizeRef.current) return;
        ev.preventDefault();

        schedule(() => {
          const r = resizeRef.current;
          if (!r) return;

          const dx = (ev.clientX - r.startX) / scale;
          const dy = (ev.clientY - r.startY) / scale;

          lastPatch = resizeElementByType({
            el,
            direction: r.direction,
            start: r.start,
            startFontSize: r.fontSize,
            dx,
            dy,
            safeArea,
          });

          updateElement?.({ ...lastPatch, __transient: true });
        });
      };

      const onUp = () => {
        clearRaf();
        node?.releasePointerCapture?.(resizeRef.current?.pointerId);
        resizeRef.current = null;
        if (lastPatch) updateElement?.(lastPatch);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp, { passive: true });
      window.addEventListener("pointercancel", onUp, { passive: true });
    },
    [clearRaf, editing, el, elementRef, isLocked, safeArea, scale, schedule, updateElement]
  );

  return { resizeElement };
}
