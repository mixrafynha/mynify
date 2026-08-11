"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ElementRenderer from "@/shared/rendering/ElementRenderer";
import { getElementBoxStyle } from "@/shared/rendering/elementBox";
import SelectionFrame from "./element/SelectionFrame";
import { finiteNumber, getElementSize } from "./canvas/canvasMath";
import {
  getElementRect,
  getOutsideSeverity,
  isOutsideSafeArea,
  isFullyOutsideSafeArea,
} from "./canvas/engine/bounds";
import { fitElementToSafeArea } from "./canvas/engine/transform";
import { normalizeTextElement } from "./canvas/engine/textBounds";
import { getRenderableElement } from "./element/renderAsset";

import { useElementSelection } from "./element/hooks/useElementSelection";
import { useElementDrag } from "./element/hooks/useElementDrag";
import { useElementResize } from "./element/hooks/useElementResize";
import { useElementRotate } from "./element/hooks/useElementRotate";
import { useMobileDetection } from "./canvas/hooks/useMobileDetection";

function stopPointer(e: React.PointerEvent) {
  e.preventDefault();
  e.stopPropagation();
}

function shortUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const url = value.trim();
  return {
    start: url.slice(0, 80),
    end: url.slice(-30),
    length: url.length,
  };
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
}: any) {
  const [editing, setEditing] = useState(false);
  const isMobile = useMobileDetection();

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

  useEffect(() => {
    if (!editing || isSelected || !isText) return;

    setEditing(false);
    inputRef.current?.blur();
  }, [editing, inputRef, isSelected, isText]);

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

  useEffect(() => {
    if (!isText || isHidden || previewMode) return;

    let cancelled = false;

    async function syncTextBoundsAfterFontsReady() {
      try {
        await (document.fonts?.ready ?? Promise.resolve());
      } catch {
        return;
      }

      if (cancelled) return;

      const normalized = normalizeTextElement(
        {
          ...el,
          height: undefined,
        },
        localSafeArea,
      );

      if (
        normalized.width !== el.width ||
        normalized.height !== el.height ||
        normalized.meta?.fontSize !== el.meta?.fontSize
      ) {
        updateElement?.({
          width: normalized.width,
          height: normalized.height,
          meta: normalized.meta,
        });
      }
    }

    void syncTextBoundsAfterFontsReady();

    return () => {
      cancelled = true;
    };
  }, [
    el,
    el.content,
    el.fontFamily,
    el.fontSize,
    el.fontStyle,
    el.fontWeight,
    el.height,
    el.meta,
    el.text,
    el.width,
    isHidden,
    isText,
    localSafeArea,
    previewMode,
    updateElement,
  ]);

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
    () =>
      getElementBoxStyle(
        {
          ...el,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
        {
          selected: isSelected,
          previewMode,
          locked: isLocked,
          interactive: !previewMode,
        },
      ),
    [el, isLocked, isSelected, previewMode, rect.height, rect.width, rect.x, rect.y],
  );

  const rendererElement = useMemo(
    () => getRenderableElement({
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

  useEffect(() => {
    if (isHidden) return;

    const root = elementRef.current?.closest("[data-mockup-export-root]");
    const mockup = root?.querySelector("img");
    const style = elementRef.current ? window.getComputedStyle(elementRef.current) : null;
    const rectSnapshot = elementRef.current?.getBoundingClientRect() ?? null;

    console.info("[checkout-preview:artwork-created]", {
      side: root?.getAttribute("data-mockup-export-root") ?? null,
      elementType: el?.type ?? null,
      artworkUrl: shortUrl(el?.src),
      artworkId: el?.id ?? null,
      parentElement: elementRef.current?.parentElement?.tagName ?? null,
      insideExportRoot: Boolean(root),
      dimensions: { width: rect.width, height: rect.height },
      position: { x: rect.x, y: rect.y },
      scale: el?.meta?.scale ?? null,
      rotation: el?.meta?.rotation ?? null,
      opacity: style?.opacity ?? null,
      zIndex: style?.zIndex ?? null,
      transform: style?.transform ?? null,
      layersBeforeAfter: {
        before: null,
        after: null,
      },
      mockupStillExists: Boolean(mockup),
    });
    console.info("[checkout-preview:mockup-after-artwork]", {
      side: root?.getAttribute("data-mockup-export-root") ?? null,
      mockupFound: Boolean(mockup),
      mockupInsideExportRoot: Boolean(root && mockup && root.contains(mockup)),
      mockupRect: mockup
        ? (() => {
            const r = mockup.getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width, height: r.height };
          })()
        : null,
      mockupDisplay: mockup ? window.getComputedStyle(mockup).display : null,
      mockupVisibility: mockup ? window.getComputedStyle(mockup).visibility : null,
      mockupOpacity: mockup ? window.getComputedStyle(mockup).opacity : null,
      mockupZIndex: mockup ? window.getComputedStyle(mockup).zIndex : null,
      artworkZIndex: style?.zIndex ?? null,
      mockupConnected: mockup ? mockup.isConnected : null,
      mockupUrl: shortUrl((mockup as HTMLImageElement | null)?.currentSrc || (mockup as HTMLImageElement | null)?.src),
      rootChildrenCount: root?.children.length ?? null,
    });
  }, [el, isHidden, rect.height, rect.width, rect.x, rect.y]);

  if (isHidden) return null;

  return (
    <div
      data-draggable-element
      data-design-element-id={el?.id ?? undefined}
      data-design-element-type={el?.type ?? undefined}
      data-asset-id={el?.assetId ?? el?.meta?.assetId ?? undefined}
      data-sticker-id={el?.stickerId ?? el?.meta?.stickerId ?? undefined}
      data-shape-id={el?.shapeId ?? el?.meta?.shapeId ?? undefined}
      data-font-family={el?.fontFamily ?? el?.meta?.fontFamily ?? undefined}
      data-resource-src={el?.src ?? el?.imageUrl ?? el?.url ?? undefined}
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
        isMobile={isMobile}
        zoom={zoom}
        boxWidth={rect.width}
        boxHeight={rect.height}
        outside={outside}
        severity={severity}
        dpiBadge={null}
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
