"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";
import ElementRenderer from "./element/ElementRenderer";
import SelectionFrame from "./element/SelectionFrame";
import DPIBadge from "./canvas/components/DPIBadge";
import { finiteNumber, getElementSize } from "./canvas/canvasMath";
import {
  getElementRect,
  getOutsideSeverity,
  isOutsideSafeArea,
  isFullyOutsideSafeArea,
} from "./canvas/engine/bounds";
import { fitElementToSafeArea } from "./canvas/engine/transform";
import { normalizeTextElement } from "./canvas/engine/textBounds";

import { useElementSelection } from "./element/hooks/useElementSelection";
import { useElementDrag } from "./element/hooks/useElementDrag";
import { useElementResize } from "./element/hooks/useElementResize";
import { useElementRotate } from "./element/hooks/useElementRotate";

function stopPointer(e: React.PointerEvent) {
  e.preventDefault();
  e.stopPropagation();
}

function sanitizeText(value: string) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[<>]/g, "")
    .slice(0, 200);
}

function toLocalSafeArea(safeArea: any) {
  return {
    x: 0,
    y: 0,
    width: finiteNumber(safeArea?.width, 0),
    height: finiteNumber(safeArea?.height, 0),
  };
}

function DraggableElement({
  el,
  safeArea,
  zoom = 1,
  isSelected,
  selectedIds = [],
  setSelectedIds,
  setSelectedId,
  setSelectedElement,
  updateSelectedElements,
  endSelectedElementsDrag,
  updateElement,
  allElements = [],
  previewMode = false,
  printBox,
  gelatoPrintSize,
}: any) {
  const [editing, setEditing] = useState(false);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  const isHidden = !!el?.meta?.hidden;

  const isLocked = previewMode || !!el.locked || !!el.meta?.locked;
  const isText = el.type === "text";

  const localSafeArea = useMemo(() => toLocalSafeArea(safeArea), [safeArea]);

  const size = useMemo(() => getElementSize(el), [el]);

  /**
   * IMPORTANTE:
   * Não fazemos clamp aqui.
   * O elemento pode sair da área de edição.
   * O preflight/warning mostra o problema.
   */
  const rect = useMemo(
    () => ({
      x: finiteNumber(el.x, 0),
      y: finiteNumber(el.y, 0),
      width: size.width,
      height: size.height,
    }),
    [el.x, el.y, size.height, size.width]
  );

  const outside = useMemo(
    () => isOutsideSafeArea(rect, localSafeArea),
    [rect, localSafeArea]
  );

  const fullyOutside = useMemo(
    () => isFullyOutsideSafeArea(rect, localSafeArea),
    [rect, localSafeArea]
  );

  const severity = useMemo(
    () => getOutsideSeverity(rect, localSafeArea),
    [rect, localSafeArea]
  );

  const { selectedIdSet, select } = useElementSelection({
    el,
    selectedIds,
    setSelectedIds,
    setSelectedId,
    setSelectedElement,
  });

  const { startDrag } = useElementDrag({
    el,
    elementRef,
    editing,
    isLocked,
    selectedIds,
    selectedIdSet,
    select,
    allElements,
    safeArea: localSafeArea,
    zoom,
    updateElement,
    updateSelectedElements,
    endSelectedElementsDrag,

    /**
     * Se os teus hooks suportarem isto, usa para permitir overflow.
     * Se não suportarem, remove do hook e garante que lá dentro não usa clamp.
     */
    allowOverflow: true,
  });

  const { resizeElement } = useElementResize({
    el,
    elementRef,
    editing,
    isLocked,
    safeArea: localSafeArea,
    zoom,
    updateElement,
    allowOverflow: true,
  });

  const { startRotate } = useElementRotate({
    el,
    elementRef,
    editing,
    isLocked,
    updateElement,
  });

  const startEdit = useCallback(() => {
    if (!isText || isLocked) return;

    setEditing(true);
    window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select?.();
    }, 30);
  }, [isText, isLocked]);

  const updateText = useCallback(
    (text: string) => {
      const value = sanitizeText(text);

      const normalized = normalizeTextElement(
        {
          ...el,
          text: value,
          content: value,
          height: undefined,
        },
        localSafeArea
      );

      /**
       * Texto pode ficar fora.
       * Não clampa posição.
       * Só normaliza width/height/font metrics.
       */
      updateElement?.({
        x: finiteNumber(el.x, 0),
        y: finiteNumber(el.y, 0),
        width: normalized.width,
        height: normalized.height,
        text: value,
        content: value,
        meta: normalized.meta,
      });
    },
    [el, localSafeArea, updateElement]
  );

  const fitToBounds = useCallback(
    (e: React.PointerEvent) => {
      stopPointer(e);

      const currentRect = getElementRect(el);
      const patch = fitElementToSafeArea(el, localSafeArea, currentRect);

      if (isText) {
        const normalized = normalizeTextElement(
          {
            ...el,
            ...patch,
            height: undefined,
          },
          localSafeArea
        );

        updateElement?.({
          x: normalized.x,
          y: normalized.y,
          width: normalized.width,
          height: normalized.height,
          meta: normalized.meta,
        });

        return;
      }

      updateElement?.(patch);
    },
    [el, isText, localSafeArea, updateElement]
  );

  const flipElement = useCallback(
    (e: React.PointerEvent) => {
      stopPointer(e);
      if (isLocked) return;

      updateElement?.({
        meta: {
          ...(el.meta || {}),
          flipX: !el.meta?.flipX,
        },
      });
    },
    [el.meta, isLocked, updateElement]
  );

  const duplicateElement = useCallback(
    (e: React.PointerEvent) => {
      stopPointer(e);
      updateElement?.({ duplicate: true });
    },
    [updateElement]
  );

  const removeElement = useCallback(
    (e: React.PointerEvent) => {
      stopPointer(e);
      updateElement?.({ delete: true });
    },
    [updateElement]
  );

  const toggleLock = useCallback(
    (e: React.PointerEvent) => {
      stopPointer(e);

      updateElement?.({
        locked: !isLocked,
        meta: {
          ...(el.meta || {}),
          locked: !isLocked,
        },
      });
    },
    [el.meta, isLocked, updateElement]
  );

  const style: React.CSSProperties = useMemo(
    () => ({
      position: "absolute",
      left: 0,
      top: 0,
      width: rect.width,
      height: rect.height,
      transform: `translate3d(${rect.x}px, ${rect.y}px, 0) rotate(${
        Number(el.meta?.rotation) || 0
      }deg) scale(${el.meta?.flipX ? -1 : 1}, 1)`,
      transformOrigin: "center center",
      cursor: previewMode ? "default" : isLocked ? "not-allowed" : isSelected ? "move" : "grab",
      zIndex: el.zIndex ?? (isSelected ? 50 : 10),
      opacity: el.meta?.opacity ?? 1,
      touchAction: previewMode ? "auto" : "none",
      userSelect: "none",
      pointerEvents: previewMode ? "none" : "auto",
      willChange: isSelected ? "transform,width,height" : "auto",
    }),
    [
      el.meta?.flipX,
      el.meta?.opacity,
      el.meta?.rotation,
      el.zIndex,
      isLocked,
      isSelected,
      previewMode,
      rect.height,
      rect.width,
      rect.x,
      rect.y,
    ]
  );

  const rendererElement = useMemo(
    () => ({
      ...el,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      meta: {
        ...(el.meta || {}),
        outsidePrintArea: outside,
        outsideSeverity: severity,
      },
    }),
    [el, outside, rect.height, rect.width, rect.x, rect.y, severity]
  );


  const dpiBadge = useMemo(() => {
    if (previewMode || editing) return null;

    return (
      <DPIBadge
        element={rendererElement}
        printBox={printBox || localSafeArea}
        gelatoPrintSize={gelatoPrintSize}
      />
    );
  }, [editing, gelatoPrintSize, localSafeArea, previewMode, printBox, rendererElement]);

  if (isHidden) return null;

  return (
    <div
      data-draggable-element
      data-outside-print-area={outside ? "true" : "false"}
      ref={elementRef}
      onPointerDown={startDrag}
      onDoubleClick={startEdit}
      style={style}
      className="absolute select-none touch-none"
    >
      <ElementRenderer
        el={rendererElement}
        isSelected={isSelected}
        editing={editing}
        inputRef={inputRef}
        startEditing={startEdit}
        updateText={updateText}
        setEditing={setEditing}
      />

      {dpiBadge}

      {!previewMode && isText && fullyOutside && !isSelected && !editing && (
        <>
          <div
            data-lost-text-frame
            className="pointer-events-none absolute inset-0 z-20 rounded-[1px] border-2 border-orange-400 shadow-[0_0_0_1px_rgba(255,255,255,0.75)]"
          />
          <div className="pointer-events-none absolute -right-2 -top-2 z-40 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-orange-400 text-[11px] font-black text-white shadow-lg">
            !
          </div>
        </>
      )}

      {!previewMode && <SelectionFrame
        isSelected={isSelected}
        editing={editing}
        locked={isLocked}
        outside={outside}
        severity={severity}
        dpiBadge={dpiBadge}
        rotateElement={startRotate}
        resizeElement={resizeElement}
        flipElement={flipElement}
        duplicateElement={duplicateElement}
        removeElement={removeElement}
        fitToBounds={fitToBounds}
        toggleLock={toggleLock}
        bringForward={() => updateElement?.({ zAction: "bringForward" })}
        sendBackward={() => updateElement?.({ zAction: "sendBackward" })}
      />}
    </div>
  );
}

export default memo(DraggableElement);