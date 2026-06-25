"use client";

import { useCallback, useRef } from "react";
import { useRafPointer } from "./useRafPointer";

function stopPointer(e: React.PointerEvent) {
  e.preventDefault();
  e.stopPropagation();
}

export function useElementRotate({ el, elementRef, editing, isLocked, updateElement }: any) {
  const rotateRef = useRef<any>(null);
  const { schedule, clearRaf } = useRafPointer();

  const startRotate = useCallback(
    (e: React.PointerEvent) => {
      if (isLocked || editing || e.button !== 0) return;
      stopPointer(e);

      const node = elementRef.current;
      node?.setPointerCapture?.(e.pointerId);

      const rect = node?.getBoundingClientRect();
      if (!rect) return;

      const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const startAngle = Math.atan2(e.clientY - center.y, e.clientX - center.x) * (180 / Math.PI);

      rotateRef.current = {
        pointerId: e.pointerId,
        center,
        startAngle,
        startRotation: Number(el.meta?.rotation) || 0,
      };

      let lastPatch: any = null;

      const onMove = (ev: PointerEvent) => {
        if (!rotateRef.current) return;
        ev.preventDefault();

        schedule(() => {
          const r = rotateRef.current;
          if (!r) return;
          const angle = Math.atan2(ev.clientY - r.center.y, ev.clientX - r.center.x) * (180 / Math.PI);
          const rawRotation = r.startRotation + angle - r.startAngle;
          const rotation = ev.shiftKey ? Math.round(rawRotation / 15) * 15 : Math.round(rawRotation);
          lastPatch = { meta: { ...(el.meta || {}), rotation } };
          updateElement?.({ ...lastPatch, __transient: true });
        });
      };

      const onUp = () => {
        clearRaf();
        node?.releasePointerCapture?.(rotateRef.current?.pointerId);
        rotateRef.current = null;
        if (lastPatch) updateElement?.(lastPatch);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp, { passive: true });
      window.addEventListener("pointercancel", onUp, { passive: true });
    },
    [clearRaf, editing, el.meta, elementRef, isLocked, schedule, updateElement]
  );

  return { startRotate };
}
