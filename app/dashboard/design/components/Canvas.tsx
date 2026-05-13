"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import DraggableElement from "@/app/dashboard/design/components/DraggableElement";

const PRODUCTS: Record<string, { front: string; back: string }> = {
  tshirt: { front: "/mockups/tshirt-front.png", back: "/mockups/tshirt-back.png" },
  hoodie: { front: "/mockups/hoodie-front.png", back: "/mockups/hoodie-back.png" },
  cap: { front: "/mockups/cap-front.png", back: "/mockups/cap-back.png" },
  mug: { front: "/mockups/mug-front.png", back: "/mockups/mug-back.png" },
};

export const MOCKUP_AREA = { width: 520, height: 640 };

export const DPI = 300;
export const MM_TO_INCH = 1 / 25.4;
export const SAFE_PADDING = 10;

export const PRINT_BOX_BY_PRODUCT = {
  tshirt: { x: 150, y: 180, width: 220, height: 250 },
  hoodie: { x: 170, y: 210, width: 180, height: 210 },
  cap: { x: 190, y: 252, width: 140, height: 58 },
  mug: { x: 145, y: 222, width: 230, height: 108 },
};

export const GELATO_PRINT_SIZE_MM_BY_PRODUCT = {
  tshirt: { widthMm: 300, heightMm: 360 },
  hoodie: { widthMm: 300, heightMm: 325 },
  cap: { widthMm: 120, heightMm: 55 },
  mug: { widthMm: 220, heightMm: 90 },
};

export function getPrintBox(productId: string) {
  return (
    PRINT_BOX_BY_PRODUCT[productId as keyof typeof PRINT_BOX_BY_PRODUCT] ||
    PRINT_BOX_BY_PRODUCT.hoodie
  );
}

export function getGelatoPrintSizeMm(productId: string) {
  return (
    GELATO_PRINT_SIZE_MM_BY_PRODUCT[
      productId as keyof typeof GELATO_PRINT_SIZE_MM_BY_PRODUCT
    ] || GELATO_PRINT_SIZE_MM_BY_PRODUCT.hoodie
  );
}

export function getGelatoExportSizePx(productId: string) {
  const size = getGelatoPrintSizeMm(productId);

  return {
    width: Math.round(size.widthMm * MM_TO_INCH * DPI),
    height: Math.round(size.heightMm * MM_TO_INCH * DPI),
  };
}

function getElementSize(el: any) {
  const fontSize = el.meta?.fontSize || 40;

  if (el.type === "text") {
    const text = el.text || "";
    return {
      width: el.width || Math.max(40, text.length * fontSize * 0.62),
      height: el.height || fontSize * 1.25,
    };
  }

  return {
    width: el.width || 80,
    height: el.height || 80,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function fitElementInsidePrintArea(el: any, printBox: any) {
  const maxWidth = printBox.width - SAFE_PADDING * 2;
  const maxHeight = printBox.height - SAFE_PADDING * 2;

  const currentWidth = el.width || 80;
  const currentHeight = el.height || el.meta?.fontSize || 40;

  const scale = Math.min(1, maxWidth / currentWidth, maxHeight / currentHeight);

  const nextWidth = Math.max(10, Math.floor(currentWidth * scale));
  const nextHeight = Math.max(10, Math.floor(currentHeight * scale));

  return {
    ...el,
    width: el.width ? nextWidth : el.width,
    height: el.height ? nextHeight : el.height,
    meta: {
      ...(el.meta || {}),
      fontSize: el.meta?.fontSize
        ? Math.max(10, Math.floor(el.meta.fontSize * scale))
        : el.meta?.fontSize,
    },
  };
}

function clampElementToPrintArea(el: any, printBox: any) {
  const fitted = fitElementInsidePrintArea(el, printBox);
  const { width, height } = getElementSize(fitted);

  const minX = printBox.x + SAFE_PADDING;
  const minY = printBox.y + SAFE_PADDING;
  const maxX = printBox.x + printBox.width - width - SAFE_PADDING;
  const maxY = printBox.y + printBox.height - height - SAFE_PADDING;

  return {
    ...fitted,
    x: clamp(fitted.x, minX, Math.max(minX, maxX)),
    y: clamp(fitted.y, minY, Math.max(minY, maxY)),
  };
}

export function isInsidePrintArea(el: any, printBox: any) {
  const { width, height } = getElementSize(el);

  return (
    el.x >= printBox.x + SAFE_PADDING &&
    el.y >= printBox.y + SAFE_PADDING &&
    el.x + width <= printBox.x + printBox.width - SAFE_PADDING &&
    el.y + height <= printBox.y + printBox.height - SAFE_PADDING
  );
}

export function hasElementsOutsidePrintArea(elements: any[], productId = "hoodie") {
  const printBox = getPrintBox(productId);
  return elements.some((el) => !isInsidePrintArea(el, printBox));
}

export function mapElementToGelatoExport(el: any, productId = "hoodie") {
  const printBox = getPrintBox(productId);
  const exportSize = getGelatoExportSizePx(productId);

  const scaleX = exportSize.width / printBox.width;
  const scaleY = exportSize.height / printBox.height;

  return {
    ...el,
    x: Math.round((el.x - printBox.x) * scaleX),
    y: Math.round((el.y - printBox.y) * scaleY),
    width: el.width ? Math.round(el.width * scaleX) : undefined,
    height: el.height ? Math.round(el.height * scaleY) : undefined,
    meta: {
      ...(el.meta || {}),
      fontSize: el.meta?.fontSize
        ? Math.round(el.meta.fontSize * scaleY)
        : undefined,
    },
  };
}

export function getGelatoProductionPayload(elements: any[], productId = "hoodie") {
  return {
    dpi: DPI,
    transparentBackground: true,
    exportSizePx: getGelatoExportSizePx(productId),
    elements: elements.map((el) => mapElementToGelatoExport(el, productId)),
  };
}

export default function Canvas({
  side,
  elements,
  setElements,
  zoom,
  setZoom,
  selectedId,
  setSelectedId,
  setSelectedElement,
}: any) {
  const params = useParams();
  const mockupId = String(params?.id || "hoodie").toLowerCase();

  const [draggingId, setDraggingId] = useState<string | null>(null);

  const lastPointer = useRef({ offsetX: 0, offsetY: 0 });
  const lastDistance = useRef<number | null>(null);

  const productMockup = PRODUCTS[mockupId] || PRODUCTS.hoodie;
  const mockup = side === "front" ? productMockup.front : productMockup.back;

  const printBox = useMemo(() => getPrintBox(mockupId), [mockupId]);

  const safeSetSelectedElement = (el: any) => {
    if (typeof setSelectedElement === "function") setSelectedElement(el);
  };

  const updateElement = useCallback(
    (id: string, patch: any) => {
      setElements((prev: any[]) =>
        prev.map((el) => {
          if (el.id !== id) return el;

          const next = {
            ...el,
            ...patch,
            meta: {
              ...(el.meta || {}),
              ...(patch.meta || {}),
            },
          };

          return clampElementToPrintArea(next, printBox);
        })
      );
    },
    [setElements, printBox]
  );

  const onMove = useCallback(
    (e: PointerEvent) => {
      if (!draggingId) return;

      setElements((prev: any[]) =>
        prev.map((el) => {
          if (el.id !== draggingId) return el;

          return clampElementToPrintArea(
            {
              ...el,
              x: e.clientX - lastPointer.current.offsetX,
              y: e.clientY - lastPointer.current.offsetY,
            },
            printBox
          );
        })
      );
    },
    [draggingId, setElements, printBox]
  );

  useEffect(() => {
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [onMove]);

  useEffect(() => {
    const up = () => setDraggingId(null);
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  const startDrag = (e: any, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    const el = elements.find((x: any) => x.id === id);
    if (!el) return;

    const fixed = clampElementToPrintArea(el, printBox);

    setDraggingId(id);
    setSelectedId(id);
    safeSetSelectedElement(fixed);

    lastPointer.current = {
      offsetX: e.clientX - fixed.x,
      offsetY: e.clientY - fixed.y,
    };
  };

  const getDistance = (touches: TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      e.preventDefault();

      const distance = getDistance(e.touches);

      if (lastDistance.current !== null) {
        const diff = distance - lastDistance.current;

        setZoom((z: number) => {
          const next = z + diff * 0.004;
          return Math.min(2, Math.max(0.4, Number(next.toFixed(2))));
        });
      }

      lastDistance.current = distance;
    },
    [setZoom]
  );

  const onTouchEnd = useCallback(() => {
    lastDistance.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onTouchMove, onTouchEnd]);

  useEffect(() => {
    setElements((prev: any[]) =>
      prev.map((el) => clampElementToPrintArea(el, printBox))
    );
  }, [mockupId, side, setElements, printBox]);

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-transparent"
      onPointerDown={() => setSelectedId(null)}
    >
      <div
        className="relative transition-transform duration-150 ease-out"
        style={{
          width: MOCKUP_AREA.width,
          height: MOCKUP_AREA.height,
          transform: `scale(${zoom})`,
          transformOrigin: "center",
          touchAction: "none",
        }}
      >
        <img
          src={mockup}
          alt={mockupId}
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain drop-shadow-[0_35px_45px_rgba(0,0,0,0.35)]"
        />

        <div
          className="pointer-events-none absolute z-20 overflow-hidden rounded-[24px] border border-fuchsia-400/70 bg-fuchsia-500/[0.045] shadow-[0_0_35px_rgba(168,85,247,0.25)]"
          style={{
            left: printBox.x,
            top: printBox.y,
            width: printBox.width,
            height: printBox.height,
          }}
        >
          <div className="absolute inset-[10px] rounded-[18px] border border-dashed border-white/25" />

          <span className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-[#070711]/90 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-fuchsia-200">

          </span>
        </div>

        {elements.map((el: any) => (
          <DraggableElement
            key={el.id}
            el={clampElementToPrintArea(el, printBox)}
            isSelected={selectedId === el.id}
            isInvalid={false}
            onPointerDown={(e: any) => startDrag(e, el.id)}
            updateElement={(patch: any) => updateElement(el.id, patch)}
          />
        ))}
      </div>
    </div>
  );
}