"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import SafeArea from "@/app/dashboard/design/components/SafeArea";
import {
  PRODUCTS,
  MOCKUP_AREA,
  getPrintBox,
  getSafeArea,
  clampElementToSafeArea,
  type Side,
} from "./canvas";

const DESKTOP_ZOOM_BOOST = 0.68;
const MOBILE_ZOOM_BOOST = 0.92;

export default function Canvas({
  side,
  elements,
  setElements,
  zoom = 1,
  selectedId,
  setSelectedId,
  setSelectedElement,
  mockupColor = "#ffffff",
  setMockupColor,
}: any) {
  const params = useParams();
  const searchParams = useSearchParams();

  const productId = searchParams.get("productId");

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const groupDragStartRef = useRef<any[] | null>(null);

  const [canvasScale, setCanvasScale] = useState(1);
  const [showColors, setShowColors] = useState(false);
  const [selectionBox, setSelectionBox] = useState<any>(null);
  const [availableColors, setAvailableColors] = useState<
    { name: string; hex: string }[]
  >([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    selectedId ? [selectedId] : []
  );

  const paramsId = String(params?.id || "hoodie").toLowerCase();
  const mockupId = paramsId;
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
    async function loadColors() {
      try {
        if (!productId) {
          setAvailableColors([]);
          return;
        }

        const res = await fetch(`/api/product-colors?productId=${productId}`, {
          cache: "no-store",
        });

        const json = await res.json();

        setAvailableColors(json.colors || []);
      } catch {
        setAvailableColors([]);
      }
    }

    loadColors();
  }, [productId]);

  useEffect(() => {
    if (!availableColors.length) return;

    const exists = availableColors.some(
      (color) => color.hex.toLowerCase() === String(mockupColor).toLowerCase()
    );

    if (!exists) {
      setMockupColor?.(availableColors[0].hex);
    }
  }, [availableColors, mockupColor, setMockupColor]);

  useEffect(() => {
    if (selectedId && !selectedIds.includes(selectedId)) {
      setSelectedIds([selectedId]);
    }

    if (!selectedId && selectedIds.length) {
      setSelectedIds([]);
    }
  }, [selectedId]);

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
      const nextScale = fitScale * boost;

      setCanvasScale(
        Math.max(0.5, Math.min(1.45, Number(nextScale.toFixed(4))))
      );
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
        setSelectedIds((prevIds) =>
          prevIds.filter((selected) => selected !== id)
        );

        if (selectedId === id) {
          setSelectedId(null);
          setSelectedElement?.(null);
        }

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

  function updateSelectedElements(ids: string[], dx: number, dy: number) {
    setElements((prev: any[]) => {
      if (!groupDragStartRef.current) {
        groupDragStartRef.current = prev
          .filter((item) => ids.includes(item.id))
          .map((item) => ({
            id: item.id,
            x: item.x,
            y: item.y,
          }));
      }

      return prev.map((item) => {
        if (!ids.includes(item.id)) return item;

        const start = groupDragStartRef.current?.find(
          (pos) => pos.id === item.id
        );

        if (!start) return item;

        return clampElementToSafeArea(
          {
            ...item,
            x: start.x + dx,
            y: start.y + dy,
          },
          safeArea
        );
      });
    });
  }

  function endSelectedElementsDrag() {
    groupDragStartRef.current = null;
  }

  const finalScale = zoom * canvasScale;

  return (
    <div
      ref={wrapperRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-transparent"
      onPointerDown={(e) => {
        if (e.target !== e.currentTarget) return;

        setSelectedIds([]);
        setSelectedId(null);
        setSelectedElement?.(null);
      }}
    >
      <div className="absolute right-4 top-4 z-50">
        <div className="relative flex justify-center">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setShowColors((v) => !v)}
            className="
              flex h-8 w-8 items-center justify-center
              rounded-full border border-zinc-200
              bg-white/90 shadow-md backdrop-blur
              transition-transform hover:scale-105
            "
          >
            <span
              className="h-4 w-4 rounded-full border border-black/10"
              style={{ backgroundColor: mockupColor }}
            />
          </button>

          {showColors && (
            <div
              className="
                absolute top-10 left-1/2 -translate-x-1/2
                flex flex-col items-center gap-1.5
                rounded-full border border-zinc-200
                bg-white/95 px-1.5 py-2
                shadow-xl backdrop-blur
              "
            >
              {availableColors.map((color) => {
                const selected =
                  color.hex.toLowerCase() === String(mockupColor).toLowerCase();

                return (
                  <button
                    key={`${color.name}-${color.hex}`}
                    type="button"
                    title={color.name}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => {
                      setMockupColor?.(color.hex);
                      setShowColors(false);
                    }}
                    className={`
                      relative h-5 w-5 rounded-full border transition-all duration-150
                      ${
                        selected
                          ? "scale-110 border-black ring-2 ring-black/15"
                          : "border-black/10 hover:scale-110"
                      }
                    `}
                    style={{ backgroundColor: color.hex }}
                  >
                    {selected && (
                      <span className="absolute inset-0 rounded-full border border-white/50" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

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
          color={mockupColor}
        />

        <div
          className="absolute z-20 overflow-hidden"
          onPointerDown={(e) => {
            if (e.target !== e.currentTarget) return;

            const rect = e.currentTarget.getBoundingClientRect();

            const startX = (e.clientX - rect.left) / finalScale;
            const startY = (e.clientY - rect.top) / finalScale;

            setSelectedIds([]);
            setSelectedId(null);
            setSelectedElement?.(null);

            setSelectionBox({
              x: startX,
              y: startY,
              w: 0,
              h: 0,
            });

            const onMove = (ev: PointerEvent) => {
              const currentX = (ev.clientX - rect.left) / finalScale;
              const currentY = (ev.clientY - rect.top) / finalScale;

              setSelectionBox({
                x: Math.min(startX, currentX),
                y: Math.min(startY, currentY),
                w: Math.abs(currentX - startX),
                h: Math.abs(currentY - startY),
              });
            };

            const onUp = (ev: PointerEvent) => {
              const endX = (ev.clientX - rect.left) / finalScale;
              const endY = (ev.clientY - rect.top) / finalScale;

              const box = {
                x: Math.min(startX, endX),
                y: Math.min(startY, endY),
                w: Math.abs(endX - startX),
                h: Math.abs(endY - startY),
              };

              const selected = elements
                .filter((el: any) => {
                  const x = el.x - safeArea.x;
                  const y = el.y - safeArea.y;
                  const w = el.width || 220;
                  const h =
                    el.height ||
                    (el.type === "text" ? el.meta?.fontSize || 40 : 120);

                  return (
                    x < box.x + box.w &&
                    x + w > box.x &&
                    y < box.y + box.h &&
                    y + h > box.y
                  );
                })
                .map((el: any) => el.id);

              setSelectedIds(selected);
              setSelectedId(selected[selected.length - 1] || null);

              const lastSelected = elements.find(
                (el: any) => el.id === selected[selected.length - 1]
              );

              setSelectedElement?.(lastSelected || null);
              setSelectionBox(null);

              window.removeEventListener("pointermove", onMove);
              window.removeEventListener("pointerup", onUp);
              window.removeEventListener("pointercancel", onUp);
            };

            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
            window.addEventListener("pointercancel", onUp);
          }}
          style={{
            left: safeArea.x,
            top: safeArea.y,
            width: safeArea.width,
            height: safeArea.height,
            pointerEvents: "auto",
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
              isSelected={selectedIds.includes(el.id)}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              setSelectedId={setSelectedId}
              setSelectedElement={setSelectedElement}
              updateSelectedElements={updateSelectedElements}
              endSelectedElementsDrag={endSelectedElementsDrag}
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

          {selectionBox && (
            <div
              className="pointer-events-none absolute z-[999] border border-violet-500 bg-violet-500/10"
              style={{
                left: selectionBox.x,
                top: selectionBox.y,
                width: selectionBox.w,
                height: selectionBox.h,
              }}
            />
          )}
        </div>

        <SafeArea printBox={printBox} selected />
      </div>
    </div>
  );
}
