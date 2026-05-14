"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import SafeArea from "@/app/dashboard/design/components/SafeArea";

import { PRODUCTS } from "./canvas/productConfig";
import { MOCKUP_AREA } from "./canvas/constants";
import { getPrintBox, getSafeArea, clampElementToSafeArea } from "./canvas/canvasMath";
import { Side } from "./canvas/types";
import DraggableElement from "./DraggableElement";
import CanvasMockup from "./canvas/CanvasMockup";

const DESKTOP_ZOOM_BOOST = 1.18;
const MOBILE_ZOOM_BOOST = 1.35;

export default function Canvas({
  side,
  elements,
  setElements,
  zoom = 1,
  selectedId,
  setSelectedId,
  setSelectedElement,
}: any) {
  const params = useParams();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [canvasScale, setCanvasScale] = useState(1);

  const mockupId = String(params?.id || "hoodie").toLowerCase();
  const currentSide: Side = side === "back" ? "back" : "front";
  const storageKey = `canvas:${mockupId}:${currentSide}`;

  const productMockup = PRODUCTS[mockupId] || PRODUCTS.hoodie;
  const mockup = productMockup[currentSide];

  const printBox = useMemo(
    () => getPrintBox(mockupId, currentSide),
    [mockupId, currentSide]
  );

  const safeArea = useMemo(() => getSafeArea(printBox), [printBox]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) setElements(JSON.parse(saved));
    } catch {}
  }, [storageKey, setElements]);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(elements));
    } catch {}
  }, [storageKey, elements]);

  useEffect(() => {
    const updateScale = () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const rect = wrapper.getBoundingClientRect();
      const isMobile = window.innerWidth < 768;

      const scaleX = rect.width / MOCKUP_AREA.width;
      const scaleY = rect.height / MOCKUP_AREA.height;
      const fitScale = Math.min(scaleX, scaleY);

      const boost = isMobile ? MOBILE_ZOOM_BOOST : DESKTOP_ZOOM_BOOST;

      setCanvasScale(Math.max(0.1, Number((fitScale * boost).toFixed(4))));
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    if (wrapperRef.current) observer.observe(wrapperRef.current);

    window.addEventListener("resize", updateScale);
    window.addEventListener("orientationchange", updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScale);
      window.removeEventListener("orientationchange", updateScale);
    };
  }, []);

  function handleUpdateElement(id: string, patch: any) {
    setElements((prev: any[]) => {
      const current = prev.find((item) => item.id === id);
      if (!current) return prev;

      if (patch.delete) {
        return prev.filter((item) => item.id !== id);
      }

      if (patch.duplicate) {
        const duplicated = clampElementToSafeArea(
          {
            ...current,
            id: crypto.randomUUID(),
            x: current.x + 20,
            y: current.y + 20,
            meta: { ...(current.meta || {}) },
          },
          safeArea
        );

        return [...prev, duplicated];
      }

      const cleanPatch = { ...patch };

      if (typeof patch.x !== "number") delete cleanPatch.x;
      if (typeof patch.y !== "number") delete cleanPatch.y;

      return prev.map((item) => {
        if (item.id !== id) return item;

        const nextElement = {
          ...item,
          ...cleanPatch,
          meta: {
            ...(item.meta || {}),
            ...(patch.meta || {}),
          },
        };

        return clampElementToSafeArea(nextElement, safeArea);
      });
    });
  }

  const finalScale = zoom * canvasScale;

  return (
    <div
      ref={wrapperRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-transparent"
      onPointerDown={() => {
        setSelectedId(null);
        setSelectedElement?.(null);
      }}
    >
      <div
        className="relative shrink-0 transition-transform duration-150 ease-out"
        style={{
          width: MOCKUP_AREA.width,
          height: MOCKUP_AREA.height,
          transform: `translateZ(0) scale(${finalScale})`,
          transformOrigin: "center center",
          touchAction: "none",
          willChange: "transform",
        }}
      >
        <CanvasMockup
          mockup={mockup}
          mockupId={mockupId}
          currentSide={currentSide}
        />

        <div
          className="absolute z-20 overflow-hidden"
          style={{
            left: safeArea.x,
            top: safeArea.y,
            width: safeArea.width,
            height: safeArea.height,
            pointerEvents: "none",
            overflow: "hidden",
            clipPath: "inset(0px)",
          }}
        >
          {elements.map((el: any) => (
            <DraggableElement
              key={el.id}
              el={{
                ...el,
                x: el.x - safeArea.x,
                y: el.y - safeArea.y,
              }}
              safeArea={safeArea}
              zoom={finalScale}
              isSelected={selectedId === el.id}
              setSelectedId={setSelectedId}
              setSelectedElement={setSelectedElement}
              updateElement={(patch: any) => {
                const nextPatch = { ...patch };

                if (typeof patch.x === "number") {
                  nextPatch.x = patch.x + safeArea.x;
                }

                if (typeof patch.y === "number") {
                  nextPatch.y = patch.y + safeArea.y;
                }

                handleUpdateElement(el.id, nextPatch);
              }}
            />
          ))}
        </div>

        <SafeArea printBox={printBox} selected />
      </div>
    </div>
  );
}