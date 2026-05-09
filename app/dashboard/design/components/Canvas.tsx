"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import DraggableElement from "@/app/dashboard/design/components/DraggableElement";

const PRODUCTS: Record<string, { front: string; back: string }> = {
  tshirt: {
    front: "/mockups/tshirt-front.png",
    back: "/mockups/tshirt-back.png",
  },
  hoodie: {
    front: "/mockups/hoodie-front.png",
    back: "/mockups/hoodie-back.png",
  },
  cap: {
    front: "/mockups/cap-front.png",
    back: "/mockups/cap-back.png",
  },
  mug: {
    front: "/mockups/mug-front.png",
    back: "/mockups/mug-back.png",
  },
};

const PRINT_AREA = {
  width: 420,
  height: 520,
};

export default function Canvas({
  side,
  elements,
  setElements,
  zoom,
  setZoom,
  selectedId,
  setSelectedId,
  selectedElement,
  setSelectedElement,
}: any) {
  const params = useParams();
  const mockupId = String(params?.id || "hoodie").toLowerCase();

  const [draggingId, setDraggingId] = useState<string | null>(null);

  const lastPointer = useRef({
    offsetX: 0,
    offsetY: 0,
  });

  const lastDistance = useRef<number | null>(null);

  const productMockup = PRODUCTS[mockupId] || PRODUCTS.hoodie;

  const mockup =
    side === "front"
      ? productMockup.front
      : productMockup.back;

  const safeSetSelectedElement = (el: any) => {
    if (typeof setSelectedElement === "function") {
      setSelectedElement(el);
    }
  };

  const updateElement = (id: string, patch: any) => {
    setElements((prev: any[]) =>
      prev.map((el) =>
        el.id === id
          ? {
              ...el,
              ...patch,
              meta: {
                ...(el.meta || {}),
                ...(patch.meta || {}),
              },
            }
          : el
      )
    );

    if (selectedId === id && typeof setSelectedElement === "function") {
      setSelectedElement((prev: any) => ({
        ...prev,
        ...patch,
        meta: {
          ...(prev?.meta || {}),
          ...(patch.meta || {}),
        },
      }));
    }
  };

  const onMove = useCallback(
    (e: PointerEvent) => {
      if (!draggingId) return;

      const x = e.clientX - lastPointer.current.offsetX;
      const y = e.clientY - lastPointer.current.offsetY;

      setElements((prev: any[]) =>
        prev.map((el) =>
          el.id === draggingId ? { ...el, x, y } : el
        )
      );
    },
    [draggingId, setElements]
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

    setDraggingId(id);
    setSelectedId(id);
    safeSetSelectedElement(el);

    lastPointer.current = {
      offsetX: e.clientX - el.x,
      offsetY: e.clientY - el.y,
    };
  };

  const getDistance = (touches: TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length !== 2) return;

    const distance = getDistance(e.touches);

    if (lastDistance.current !== null) {
      const diff = distance - lastDistance.current;

      setZoom((z: number) => {
        const next = z + diff * 0.004;
        return Math.min(3, Math.max(0.5, next));
      });
    }

    lastDistance.current = distance;
  };

  const onTouchEnd = () => {
    lastDistance.current = null;
  };

  useEffect(() => {
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <div
      className="flex-1 flex items-center justify-center relative bg-transparent"
      onPointerDown={() => setSelectedId(null)}
    >
      <div className="relative w-full max-w-[1100px] h-[90vh] flex items-center justify-center px-4">
        <div
          className="relative"
          style={{
            width: PRINT_AREA.width,
            height: PRINT_AREA.height,
            transform: `scale(${zoom})`,
            transformOrigin: "center",
          }}
        >
          <img
            src={mockup}
            alt={mockupId}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div
              className="border border-dashed border-black/30 rounded-md"
              style={{ width: "34%", height: "34%" }}
            />
          </div>

          {elements.map((el: any) => (
            <DraggableElement
              key={el.id}
              el={el}
              isSelected={selectedId === el.id}
              onPointerDown={(e: any) => startDrag(e, el.id)}
              updateElement={(patch: any) =>
                updateElement(el.id, patch)
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
