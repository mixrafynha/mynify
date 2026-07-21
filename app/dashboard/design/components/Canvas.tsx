"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

import DraggableElement from "./DraggableElement";
import CanvasMockup from "./canvas/CanvasMockup";
import SafeAreaLayer from "./canvas/components/SafeAreaLayer";
import SafeArea from "@/app/dashboard/design/components/SafeArea";

import { useCanvasPan } from "./canvas/hooks/useCanvasPan";
import { useCanvasScale } from "./canvas/hooks/useCanvasScale";
import { useCanvasPinch } from "./canvas/hooks/useCanvasPinch";
import { useCanvasColors } from "./canvas/hooks/useCanvasColors";
import { useCanvasElements } from "./canvas/hooks/useCanvasElements";
import { useCanvasWarnings } from "./canvas/hooks/useCanvasWarnings";

import {
  getConfiguredSafeArea,
  getGelatoPrintSizeMm,
  getMockupUrl,
  getMockupVisualScale,
  type ProductDisplayConfig,
} from "./canvas/productConfig";
import { MOCKUP_AREA } from "./canvas/constants";
import {
  getLocalSafeArea,
  getPrintBox,
} from "./canvas/canvasMath";
import type { CanvasSide } from "./canvas/types";

const ColorSelector = dynamic(
  () => import("./canvas/components/ColorSelector"),
);
const WarningsPanel = dynamic(
  () => import("./canvas/components/WarningsPanel"),
);
const LostElementsOverlay = dynamic(
  () => import("./canvas/components/LostElementsOverlay"),
);
const GelatoDesignDropzone = dynamic(
  () => import("./canvas/components/GelatoDesignDropzone"),
);
const FloatingEditToolbar = dynamic(
  () => import("./toolbar/FloatingEditToolbar"),
);

const MemoDraggableElement = memo(DraggableElement);

export default function Canvas({
  side,
  elements: externalElements = [],
  setElements: externalSetElements,
  zoom: externalZoom = 1,
  onZoomChange,
  selectedId,
  setSelectedId,
  setSelectedElement,
  mockupColor = "#ffffff",
  setMockupColor,
  mode = "edit",
  canvasRef,
  productConfig = null,
}: any & { productConfig?: ProductDisplayConfig | null }) {
  const params = useParams();
  const searchParams = useSearchParams();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const mockupRootRef = useRef<HTMLDivElement | null>(null);

  const setWrapperNode = useCallback(
    (node: HTMLDivElement | null) => {
      wrapperRef.current = node;

      if (typeof canvasRef === "function") {
        canvasRef(node);
        return;
      }

      if (canvasRef && typeof canvasRef === "object") {
        canvasRef.current = node;
      }
    },
    [canvasRef],
  );

  const productId = searchParams.get("productId");
  const mockupId = String(params?.id || "hoodie").toLowerCase();
  const productColorKey = productConfig?.productId || productId || mockupId;
  const currentSide: CanvasSide = side === "back" ? "back" : "front";
  const isPreviewMode =
    mode === "preview" ||
    searchParams.get("mode") === "preview" ||
    searchParams.get("preview") === "1";

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<any>(null);
  const [internalZoom, setInternalZoom] = useState(externalZoom);
  const pendingSelectionRef = useRef<any | null>(null);

  const { panOffset, startPan, onPanMove, endPan, resetPan } = useCanvasPan();
  const elements = useMemo(
    () => (Array.isArray(externalElements) ? externalElements : []),
    [externalElements],
  );
  const zoom = internalZoom;

  useEffect(() => {
    setInternalZoom(externalZoom);
  }, [externalZoom]);

  useEffect(() => {
    // The canvas now stays mounted across side switches. Clear its local
    // selection while preserving the shared garment colour and image cache.
    setSelectedIds([]);
    setSelectionBox(null);
  }, [currentSide]);

  useEffect(() => {
    const next = pendingSelectionRef.current;
    if (!next) return;

    pendingSelectionRef.current = null;
    setSelectedIds([next.id]);
    setSelectedId?.(next.id);
    setSelectedElement?.(next);
  });

  const setElements = useCallback(
    (updater: any) => {
      if (typeof externalSetElements !== "function") return;

      externalSetElements((prev: any[]) => {
        const list = Array.isArray(prev) ? prev : [];
        return typeof updater === "function" ? updater(list) : updater;
      });
    },
    [externalSetElements],
  );

  const resolvedProductId = productConfig?.category || productConfig?.productId || mockupId;

  const mockup = useMemo(
    () => getMockupUrl(resolvedProductId, currentSide, productConfig),
    [currentSide, resolvedProductId, productConfig],
  );
  const printBox = useMemo(
    () => getPrintBox(resolvedProductId, currentSide, productConfig),
    [currentSide, resolvedProductId, productConfig],
  );
  const safeArea = useMemo(
    () => getConfiguredSafeArea(resolvedProductId, currentSide, productConfig),
    [currentSide, resolvedProductId, productConfig],
  );
  const localSafeArea = useMemo(() => getLocalSafeArea(safeArea), [safeArea]);

  const gelatoPrintSize = useMemo(
    () => getGelatoPrintSizeMm(resolvedProductId, currentSide, productConfig),
    [currentSide, resolvedProductId, productConfig],
  );

  const canvasScale = useCanvasScale(wrapperRef);
  const finalScale = useMemo(() => zoom * canvasScale, [canvasScale, zoom]);

  const handleZoomChange = useCallback(
    (value: number) => {
      const next = Math.min(6, Math.max(0.25, Number(value) || 1));
      setInternalZoom(next);
      onZoomChange?.(next);
      if (typeof window !== "undefined" && window.innerWidth >= 1024) resetPan();
    },
    [onZoomChange, resetPan],
  );

  const handlePinchZoom = useCallback((value: number) => {
    const next = Math.min(6, Math.max(0.25, Number(value) || 1));
    const root = mockupRootRef.current;
    if (!root) return;

    // Mobile pinch is previewed directly on the compositor. Avoiding React
    // state here prevents every design element from rerendering each frame.
    root.style.transform = `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${next * canvasScale})`;
  }, [canvasScale, panOffset.x, panOffset.y]);

  const commitPinchZoom = useCallback((value: number) => {
    const next = Math.min(6, Math.max(0.25, Number(value) || 1));
    setInternalZoom(next);
    onZoomChange?.(next);
  }, [onZoomChange]);

  const { updateSelectedElements, endSelectedElementsDrag } = useCanvasElements(
    {
      safeArea: localSafeArea,
      setElements,
    },
  );

  const { warnings, warningCount, quality } = useCanvasWarnings(
    elements,
    localSafeArea,
    gelatoPrintSize,
  );
  const { handlePinchDown, handlePinchMove, handlePinchEnd } = useCanvasPinch({
    zoom,
    onZoomChange: handlePinchZoom,
    onZoomEnd: commitPinchZoom,
    minZoom: 0.25,
    maxZoom: 6,
  });

  const desktopPrintCenterOffset = useMemo(() => {
    if (typeof window === "undefined" || window.innerWidth < 1024) return { x: 0, y: 0 };
    const printCenterX = printBox.x + printBox.width / 2;
    const printCenterY = printBox.y + printBox.height / 2;
    return {
      x: (MOCKUP_AREA.width / 2 - printCenterX) * finalScale,
      y: (MOCKUP_AREA.height / 2 - printCenterY) * finalScale,
    };
  }, [finalScale, printBox.height, printBox.width, printBox.x, printBox.y]);
  const { showColors, setShowColors, availableColors } = useCanvasColors(
    productColorKey,
    mockupColor,
    setMockupColor,
  );

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setSelectedId?.(null);
    setSelectedElement?.(null);
  }, [setSelectedElement, setSelectedId]);

  const selectElement = useCallback(
    (element: any) => {
      if (!element?.id) return;
      setSelectedIds([element.id]);
      setSelectedId?.(element.id);
      setSelectedElement?.(element);
    },
    [setSelectedElement, setSelectedId],
  );

  const handleUpdateElement = useCallback(
    (id: string, patch: any) => {
      setElements(
        (prev: any[]) => {
          const list = Array.isArray(prev) ? prev : [];
          const current = list.find((item) => item.id === id);
          if (!current) return list;

          if (patch.delete) {
            return list.filter((item) => item.id !== id);
          }

          if (patch.duplicate) {
            const maxZ = Math.max(0, ...list.map((item) => item.zIndex || 0));
            const copy = {
              ...current,
              id: crypto.randomUUID(),
              x: (Number(current.x) || 0) + 24,
              y: (Number(current.y) || 0) + 24,
              zIndex: maxZ + 1,
              selected: false,
            };

            pendingSelectionRef.current = copy;
            return [...list, copy];
          }

          if (patch.zAction === "bringForward") {
            return list.map((item) =>
              item.id === id
                ? { ...item, zIndex: (item.zIndex || 0) + 1 }
                : item,
            );
          }

          if (patch.zAction === "sendBackward") {
            return list.map((item) =>
              item.id === id
                ? { ...item, zIndex: Math.max(0, (item.zIndex || 0) - 1) }
                : item,
            );
          }

          if (patch.zAction === "bringToFront") {
            const maxZ = Math.max(0, ...list.map((item) => item.zIndex || 0));
            return list.map((item) =>
              item.id === id ? { ...item, zIndex: maxZ + 1 } : item,
            );
          }

          if (patch.zAction === "sendToBack") {
            return list.map((item) =>
              item.id === id
                ? { ...item, zIndex: 0 }
                : { ...item, zIndex: (item.zIndex || 0) + 1 },
            );
          }

          return list.map((item) => {
            if (item.id !== id) return item;

            const next = {
              ...item,
              ...patch,
              meta: {
                ...(item.meta || {}),
                ...(patch.meta || {}),
              },
            };

            delete next.delete;
            delete next.duplicate;
            delete next.zAction;
            delete next.__transient;

            return next;
          });
        }
      );
    },
    [setElements],
  );

  const sortedElements = useMemo(
    () =>
      [...(elements || [])].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)),
    [elements],
  );

  const selectedElements = useMemo(
    () => sortedElements.filter((item: any) => selectedIds.includes(item.id)),
    [selectedIds, sortedElements],
  );

  const addImageFromFile = useCallback(
    (file: File) => {
      if (!file || !file.type?.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result || "");
        if (!src) return;

        const img = new Image();
        img.onload = () => {
          const naturalWidth = img.naturalWidth || 1000;
          const naturalHeight = img.naturalHeight || 1000;
          const maxWidth = Math.max(80, localSafeArea.width * 0.72);
          const maxHeight = Math.max(80, localSafeArea.height * 0.72);
          const ratio = Math.min(
            1,
            maxWidth / naturalWidth,
            maxHeight / naturalHeight,
          );
          const width = Math.max(48, Math.round(naturalWidth * ratio));
          const height = Math.max(48, Math.round(naturalHeight * ratio));
          const maxZ = Math.max(
            0,
            ...(Array.isArray(elements) ? elements : []).map(
              (item: any) => item.zIndex || 0,
            ),
          );

          const next = {
            id: crypto.randomUUID(),
            type: "image",
            src,
            x: Math.round((localSafeArea.width - width) / 2),
            y: Math.round((localSafeArea.height - height) / 2),
            width,
            height,
            zIndex: maxZ + 1,
            meta: {
              naturalWidth,
              naturalHeight,
              fileName: file.name,
              uploadedAt: Date.now(),
              opacity: 1,
            },
          };

          setElements((prev: any[]) => [
            ...(Array.isArray(prev) ? prev : []),
            next,
          ]);
          setSelectedIds([next.id]);
          setSelectedId?.(next.id);
          setSelectedElement?.(next);
        };
        img.src = src;
      };

      reader.readAsDataURL(file);
    },
    [
      elements,
      localSafeArea.height,
      localSafeArea.width,
      setElements,
      setSelectedElement,
      setSelectedId,
    ],
  );

  const deleteElements = useCallback(
    (ids: string[]) => {
      if (!ids.length) return;
      setElements((prev: any[]) =>
        (prev || []).filter((item) => !ids.includes(item.id)),
      );
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      setSelectedId?.(null);
      setSelectedElement?.(null);
    },
    [setElements, setSelectedElement, setSelectedId],
  );

  const duplicateElementById = useCallback(
    (id: string) => {
      handleUpdateElement(id, { duplicate: true });
    },
    [handleUpdateElement],
  );

  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const clickedCanvas = e.currentTarget === e.target;
      const clickedMockupRoot = target.id === "mockup-export-root";

      if (!clickedCanvas && !clickedMockupRoot) return;

      clearSelection();

      if (e.button === 1) {
        startPan(e);
      }
    },
    [clearSelection, startPan],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const direction = e.deltaY > 0 ? -1 : 1;
      const step = e.shiftKey ? 0.18 : 0.08;
      handleZoomChange(zoom + direction * step);
    },
    [handleZoomChange, zoom],
  );

  const resetViewport = useCallback(() => {
    handleZoomChange(1);
    resetPan();
  }, [handleZoomChange, resetPan]);

  return (
    <div
      ref={setWrapperNode}
      className="relative flex h-full w-full touch-none items-center justify-center overflow-hidden bg-[#05070d] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={onPanMove}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      onPointerDownCapture={handlePinchDown}
      onPointerMoveCapture={handlePinchMove}
      onPointerUpCapture={handlePinchEnd}
      onPointerCancelCapture={handlePinchEnd}
      onWheel={handleWheel}
      style={{ overscrollBehavior: "none" }}
    >
      {!isPreviewMode && (
        <ColorSelector
          mockupColor={mockupColor}
          setMockupColor={setMockupColor}
          showColors={showColors}
          setShowColors={setShowColors}
          availableColors={availableColors}
        />
      )}

      {!isPreviewMode && (
        <WarningsPanel
          warnings={warnings}
          warningCount={warningCount}
          quality={quality}
          elements={elements}
          safeArea={localSafeArea}
          printSize={gelatoPrintSize}
        />
      )}

      {!isPreviewMode && (
        <FloatingEditToolbar
          selectedElements={selectedElements}
          safeArea={localSafeArea}
          updateElement={handleUpdateElement}
          deleteElements={deleteElements}
          duplicateElement={duplicateElementById}
          clearSelection={clearSelection}
        />
      )}

      <div
        ref={mockupRootRef}
        id="mockup-export-root"
        className="relative shrink-0"
        style={{
          width: MOCKUP_AREA.width,
          height: MOCKUP_AREA.height,
          transform: `translate3d(${panOffset.x + desktopPrintCenterOffset.x}px, ${panOffset.y + desktopPrintCenterOffset.y}px, 0) scale(${finalScale})`,
          transformOrigin: "center center",
          touchAction: "none",
          backfaceVisibility: "hidden",
        }}
      >
        <CanvasMockup
          mockup={mockup}
          mockupId={resolvedProductId}
          currentSide={currentSide}
          color={mockupColor}
          visualScale={getMockupVisualScale(resolvedProductId, currentSide, productConfig)}
        />

        <SafeAreaLayer
          safeArea={safeArea}
          side={currentSide}
          finalScale={finalScale}
          elements={sortedElements}
          setSelectedIds={setSelectedIds}
          setSelectedId={setSelectedId}
          setSelectedElement={setSelectedElement}
          setSelectionBox={setSelectionBox}
          selectionBox={selectionBox}
          clearSelection={clearSelection}
          previewMode={isPreviewMode}
        >
          <GelatoDesignDropzone
            visible={!isPreviewMode && sortedElements.length === 0}
            onUpload={addImageFromFile}
          />

          {!isPreviewMode && (
            <LostElementsOverlay
              elements={sortedElements}
              safeArea={localSafeArea}
              selectedIds={selectedIds}
              onSelect={selectElement}
            />
          )}

          {sortedElements.map((el: any) => (
            <MemoDraggableElement
              key={`${currentSide}:${el.id}`}
              el={el}
              safeArea={localSafeArea}
              zoom={finalScale}
              isSelected={!isPreviewMode && selectedIds.includes(el.id)}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              setSelectedId={setSelectedId}
              setSelectedElement={setSelectedElement}
              updateSelectedElements={updateSelectedElements}
              endSelectedElementsDrag={endSelectedElementsDrag}
              allElements={sortedElements}
              printBox={printBox}
              gelatoPrintSize={gelatoPrintSize}
              updateElement={(patch: any) =>
                !isPreviewMode && handleUpdateElement(el.id, patch)
              }
              previewMode={isPreviewMode}
            />
          ))}
        </SafeAreaLayer>

        {!isPreviewMode && (
          <SafeArea printBox={printBox} selected={selectedIds.length > 0} />
        )}
      </div>
    </div>
  );
}
