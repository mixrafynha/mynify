"use client";

import { useCallback, useRef } from "react";
import { finiteNumber, getElementSize } from "../../canvas/canvasMath";
import { snapPosition } from "../../canvas/engine/snapping";
import {
  getElementRect,
  hideGuides,
  showGuides,
} from "../../canvas/engine/bounds";
import { useRafPointer } from "./useRafPointer";

function normalizeZoom(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function stopPointer(e: React.PointerEvent) {
  e.preventDefault();
  e.stopPropagation();
}

export function useElementDrag({
  el,
  elementRef,
  editing,
  isLocked,
  selectedIds = [],
  selectedIdSet,
  select,
  allElements = [],
  safeArea,
  zoom,
  updateElement,
  updateSelectedElements,
  endSelectedElementsDrag,
}: any) {
  const dragRef = useRef<any>(null);
  const { schedule, clearRaf } = useRafPointer();
  const scale = normalizeZoom(zoom);

  const startDrag = useCallback(
    (e: React.PointerEvent) => {
      if (editing || isLocked || e.button !== 0) return;

      stopPointer(e);

      const node = elementRef.current;
      node?.setPointerCapture?.(e.pointerId);

      const multi = e.shiftKey || e.ctrlKey || e.metaKey;
      const alreadySelected = selectedIdSet?.has?.(el.id);

      if (multi || !alreadySelected) {
        select(multi);
      }

      const activeIds = multi
        ? alreadySelected
          ? selectedIds
          : [...selectedIds, el.id]
        : alreadySelected && selectedIds.length > 1
          ? selectedIds
          : [el.id];

      const startPositions = activeIds
        .map((id: string) => {
          const item = allElements.find((candidate: any) => candidate.id === id);
          if (!item || item.locked || item.meta?.locked) return null;

          const rect = getElementRect(item);

          return {
            id,
            ...rect,
          };
        })
        .filter(Boolean);

      if (!startPositions.length) return;

      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startPositions,
      };

      let lastPatch: any = null;

      const onMove = (ev: PointerEvent) => {
        if (!dragRef.current) return;

        ev.preventDefault();

        schedule(() => {
          const drag = dragRef.current;
          if (!drag) return;

          const dx = (ev.clientX - drag.startX) / scale;
          const dy = (ev.clientY - drag.startY) / scale;

          const ids = drag.startPositions.map((item: any) => item.id);

          if (ids.length > 1) {
            updateSelectedElements?.(ids, dx, dy, {
              allElements,
              safeArea,
              dispatchGuides: true,
              transient: true,
              allowOverflow: true,
            });
            return;
          }

          const start = drag.startPositions[0];
          if (!start) return;

          /**
           * IMPORTANTE:
           * Drag livre. Não clampa na print area.
           */
          const raw = {
            x: start.x + dx,
            y: start.y + dy,
            width: start.width,
            height: start.height,
          };

          const otherElements = allElements
            .filter((item: any) => item.id !== el.id)
            .map((item: any) => {
              const size = getElementSize(item);

              return {
                x: finiteNumber(item.x, 0),
                y: finiteNumber(item.y, 0),
                width: size.width,
                height: size.height,
              };
            });

          /**
           * Snap usa safeArea local para guias.
           * Ele pode sugerir posição dentro/centro/bordas,
           * mas não bloqueia movemento fora se o user arrastar mais.
           */
          const snapped = snapPosition(
            raw,
            {
              width: safeArea.width,
              height: safeArea.height,
            },
            otherElements
          );

          lastPatch = {
            x: snapped.x,
            y: snapped.y,
          };

          updateElement?.({
            ...lastPatch,
            __transient: true,
          });

          showGuides(snapped.guides, safeArea);
        });
      };

      const onUp = () => {
        clearRaf();

        node?.releasePointerCapture?.(dragRef.current?.pointerId);
        dragRef.current = null;

        endSelectedElementsDrag?.();
        hideGuides();

        /**
         * Commit final sem __transient.
         */
        if (lastPatch) {
          updateElement?.(lastPatch);
        }

        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp, { passive: true });
      window.addEventListener("pointercancel", onUp, { passive: true });
    },
    [
      editing,
      isLocked,
      elementRef,
      selectedIdSet,
      el.id,
      select,
      selectedIds,
      allElements,
      safeArea,
      scale,
      schedule,
      updateElement,
      updateSelectedElements,
      endSelectedElementsDrag,
      clearRaf,
    ]
  );

  return { startDrag };
}