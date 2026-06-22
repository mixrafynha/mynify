"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useSearchParams } from "next/navigation";

import DraggableElement from "./DraggableElement";
import CanvasMockup from "./canvas/CanvasMockup";
import SafeAreaLayer from "./canvas/components/SafeAreaLayer";
import SafeArea from "@/app/dashboard/design/components/SafeArea";
import ColorSelector from "./canvas/components/ColorSelector";
import WarningsPanel from "./canvas/components/WarningsPanel";
import LostElementsOverlay from "./canvas/components/LostElementsOverlay";
import GelatoDesignDropzone from "./canvas/components/GelatoDesignDropzone";
import FloatingEditToolbar from "./toolbar/FloatingEditToolbar";

import { useCanvasPan } from "./canvas/hooks/useCanvasPan";
import { useCanvasScale } from "./canvas/hooks/useCanvasScale";
import { useCanvasPinch } from "./canvas/hooks/useCanvasPinch";
import { useCanvasColors } from "./canvas/hooks/useCanvasColors";
import { useCanvasElements } from "./canvas/hooks/useCanvasElements";
import { useCanvasStorage } from "./canvas/hooks/useCanvasStorage";
import { useCanvasWarnings } from "./canvas/hooks/useCanvasWarnings";
import { useHistory } from "./canvas/hooks/useHistory";

import { PRODUCTS, GELATO_PRINT_SIZE_MM_BY_PRODUCT } from "./canvas/productConfig";
import { withPrintQualityMeta } from "./canvas/engine/printQuality";
import { MOCKUP_AREA } from "./canvas/constants";
import {
  centerElementInSafeArea,
  getLocalSafeArea,
  getPrintBox,
  getSafeArea,
} from "./canvas/canvasMath";
import type { CanvasSide } from "./canvas/types";

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
}: any) {
  const params = useParams();
  const searchParams = useSearchParams();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const productId = searchParams.get("productId");
  const mockupId = String(params?.id || "hoodie").toLowerCase();
  const productColorKey = productId || mockupId;
  const currentSide: CanvasSide = side === "back" ? "back" : "front";
  const isPreviewMode = mode === "preview" || searchParams.get("mode") === "preview" || searchParams.get("preview") === "1";

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<any>(null);
  const [zoom, setZoom] = useState(externalZoom);

  const { panOffset, startPan, onPanMove, endPan, resetPan } = useCanvasPan();
  const { state: elements, push, replace, reset } = useHistory<any[]>(externalElements || []);

  useEffect(() => {
    reset(externalElements || []);
  }, [externalElements, reset]);

  useEffect(() => {
    setZoom(externalZoom);
  }, [externalZoom]);

  const setElements = useCallback(
    (updater: any, options: { record?: boolean } = {}) => {
      if (externalSetElements) {
        externalSetElements((prev: any[]) => {
          const next = typeof updater === "function" ? updater(prev || []) : updater;
          if (options.record !== false) push(next);
          else replace(next);
          return next;
        });
        return;
      }

      const next = typeof updater === "function" ? updater(elements || []) : updater;
      if (options.record !== false) push(next);
      else replace(next);
    },
    [elements, externalSetElements, push, replace]
  );

  const productMockup = PRODUCTS[mockupId] || PRODUCTS.hoodie;
  const mockup = useMemo(() => productMockup[currentSide], [currentSide, productMockup]);
  const printBox = useMemo(() => getPrintBox(mockupId, currentSide), [currentSide, mockupId]);
  const safeArea = useMemo(() => getSafeArea(printBox), [printBox]);
  const localSafeArea = useMemo(() => getLocalSafeArea(safeArea), [safeArea]);

  const gelatoPrintSize = useMemo(
    () =>
      GELATO_PRINT_SIZE_MM_BY_PRODUCT[mockupId]?.[currentSide] ||
      GELATO_PRINT_SIZE_MM_BY_PRODUCT.hoodie?.front,
    [currentSide, mockupId]
  );


  const productionElements = useMemo(
    () => (Array.isArray(elements) ? elements : []).map((element: any) => withPrintQualityMeta(element, localSafeArea, gelatoPrintSize)),
    [elements, localSafeArea, gelatoPrintSize]
  );

  const canvasScale = useCanvasScale(wrapperRef);
  const finalScale = useMemo(() => zoom * canvasScale, [canvasScale, zoom]);

  const handleZoomChange = useCallback(
    (value: number) => {
      const next = Math.min(4, Math.max(0.25, Number(value) || 1));
      setZoom(next);
      onZoomChange?.(Math.round(next * 100));
    },
    [onZoomChange]
  );

  const { updateSelectedElements, endSelectedElementsDrag } = useCanvasElements({
    safeArea: localSafeArea,
    setElements,
  });

  useCanvasStorage({
    storageKey: `canvas:${mockupId}:${currentSide}`,
    elements,
    setElements,
    safeArea: localSafeArea,
    centerElementInSafeArea,
  });

  const { warnings, warningCount, quality } = useCanvasWarnings(productionElements, localSafeArea, gelatoPrintSize);
  const { handlePinchDown, handlePinchMove, handlePinchEnd } = useCanvasPinch({
    zoom,
    onZoomChange: handleZoomChange,
  });
  const { showColors, setShowColors, availableColors } = useCanvasColors(
    productColorKey,
    mockupColor,
    setMockupColor
  );


  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setSelectedId?.(null);
    setSelectedElement?.(null);
  }, [setSelectedElement, setSelectedId]);

  const selectElement = useCallback((element: any) => {
    if (!element?.id) return;
    setSelectedIds([element.id]);
    setSelectedId?.(element.id);
    setSelectedElement?.(element);
  }, [setSelectedElement, setSelectedId]);

  const handleUpdateElement = useCallback(
    (id: string, patch: any) => {
      const record = patch?.__transient !== true;
      setElements((prev: any[]) => {
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

          setSelectedIds([copy.id]);
          setSelectedId?.(copy.id);
          setSelectedElement?.(copy);
          return [...list, copy];
        }

        if (patch.zAction === "bringForward") {
          return list.map((item) =>
            item.id === id ? { ...item, zIndex: (item.zIndex || 0) + 1 } : item
          );
        }

        if (patch.zAction === "sendBackward") {
          return list.map((item) =>
            item.id === id ? { ...item, zIndex: Math.max(0, (item.zIndex || 0) - 1) } : item
          );
        }

        if (patch.zAction === "bringToFront") {
          const maxZ = Math.max(0, ...list.map((item) => item.zIndex || 0));
          return list.map((item) => (item.id === id ? { ...item, zIndex: maxZ + 1 } : item));
        }

        if (patch.zAction === "sendToBack") {
          return list.map((item) =>
            item.id === id ? { ...item, zIndex: 0 } : { ...item, zIndex: (item.zIndex || 0) + 1 }
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
      }, { record });
    },
    [localSafeArea, setElements, setSelectedElement, setSelectedId]
  );

  const sortedElements = useMemo(
    () => [...productionElements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)),
    [productionElements]
  );

  const selectedElements = useMemo(
    () => sortedElements.filter((item: any) => selectedIds.includes(item.id)),
    [selectedIds, sortedElements]
  );

  const addImageFromFile = useCallback(
    (file: File) => {
      if (!file || !(file.type?.startsWith("image/") || file.name.toLowerCase().endsWith(".svg"))) return;

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
          const ratio = Math.min(1, maxWidth / naturalWidth, maxHeight / naturalHeight);
          const width = Math.max(48, Math.round(naturalWidth * ratio));
          const height = Math.max(48, Math.round(naturalHeight * ratio));
          const maxZ = Math.max(0, ...(Array.isArray(elements) ? elements : []).map((item: any) => item.zIndex || 0));

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
              originalWidth: naturalWidth,
              originalHeight: naturalHeight,
              fileName: file.name,
              printKind: "raster",
              dpiTarget: 300,
              uploadedAt: Date.now(),
              opacity: 1,
              transparent: /\.(png|webp|svg)$/i.test(file.name) || src.startsWith("data:image/png") || src.startsWith("data:image/webp") || src.startsWith("data:image/svg"),
              preserveAlpha: /\.(png|webp|svg)$/i.test(file.name) || src.startsWith("data:image/png") || src.startsWith("data:image/webp") || src.startsWith("data:image/svg"),
              preferredExportFormat: /\.svg$/i.test(file.name) || src.startsWith("data:image/svg") ? "svg" : /\.webp$/i.test(file.name) || src.startsWith("data:image/webp") ? "webp" : "png",
            },
          };

          setElements((prev: any[]) => [...(Array.isArray(prev) ? prev : []), next]);
          setSelectedIds([next.id]);
          setSelectedId?.(next.id);
          setSelectedElement?.(next);
        };
        img.src = src;
      };

      reader.readAsDataURL(file);
    },
    [elements, localSafeArea.height, localSafeArea.width, setElements, setSelectedElement, setSelectedId]
  );

  const deleteElements = useCallback(
    (ids: string[]) => {
      if (!ids.length) return;
      setElements((prev: any[]) => (prev || []).filter((item) => !ids.includes(item.id)));
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      setSelectedId?.(null);
      setSelectedElement?.(null);
    },
    [setElements, setSelectedElement, setSelectedId]
  );

  const duplicateElementById = useCallback(
    (id: string) => {
      handleUpdateElement(id, { duplicate: true });
    },
    [handleUpdateElement]
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
    [clearSelection, startPan]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const direction = e.deltaY > 0 ? -1 : 1;
      const step = e.shiftKey ? 0.18 : 0.08;
      handleZoomChange(zoom + direction * step);
    },
    [handleZoomChange, zoom]
  );

  const resetViewport = useCallback(() => {
    handleZoomChange(1);
    resetPan();
  }, [handleZoomChange, resetPan]);

  return (
    <div
      ref={wrapperRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-neutral-950"
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={onPanMove}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      onPointerDownCapture={handlePinchDown}
      onPointerMoveCapture={handlePinchMove}
      onPointerUpCapture={handlePinchEnd}
      onPointerCancelCapture={handlePinchEnd}
      onWheel={handleWheel}
    >
      {!isPreviewMode && <ColorSelector
        mockupColor={mockupColor}
        setMockupColor={setMockupColor}
        showColors={showColors}
        setShowColors={setShowColors}
        availableColors={availableColors}
      />}

      {!isPreviewMode && <WarningsPanel warnings={warnings} warningCount={warningCount} quality={quality} elements={productionElements} safeArea={localSafeArea} printSize={gelatoPrintSize} />}

      {!isPreviewMode && <FloatingEditToolbar
        selectedElements={selectedElements}
        safeArea={localSafeArea}
        updateElement={handleUpdateElement}
        deleteElements={deleteElements}
        duplicateElement={duplicateElementById}
        clearSelection={clearSelection}
      />}



      <div
        id="mockup-export-root"
        className="relative shrink-0"
        style={{
          width: MOCKUP_AREA.width,
          height: MOCKUP_AREA.height,
          transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${finalScale})`,
          transformOrigin: "center center",
          touchAction: "none",
          willChange: "transform",
        }}
      >
        <CanvasMockup mockup={mockup} mockupId={mockupId} currentSide={currentSide} color={mockupColor} />

        <SafeAreaLayer
          safeArea={safeArea}
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
              key={el.id}
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
              updateElement={(patch: any) => !isPreviewMode && handleUpdateElement(el.id, patch)}
              previewMode={isPreviewMode}
            />
          ))}
        </SafeAreaLayer>

        {!isPreviewMode && <SafeArea printBox={printBox} selected={selectedIds.length > 0} />}
      </div>
    </div>
  );
}
