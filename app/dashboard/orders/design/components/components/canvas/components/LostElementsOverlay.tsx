"use client";

import { memo, useMemo } from "react";
import { ImageIcon, Type } from "lucide-react";
import { getElementSize } from "../canvasMath";
import { isFullyOutsideSafeArea } from "../engine/bounds";

type SafeArea = { width: number; height: number };

type LostElementsOverlayProps = {
  elements: any[];
  safeArea: SafeArea;
  selectedIds?: string[];
  onSelect?: (element: any) => void;
};

const MARKER_WIDTH = 54;
const MARKER_HEIGHT = 34;
const EDGE_PAD = 8;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getLostMarkerPosition(el: any, safeArea: SafeArea) {
  const size = getElementSize(el);
  const x = Number(el?.x) || 0;
  const y = Number(el?.y) || 0;
  const centerX = x + size.width / 2;
  const centerY = y + size.height / 2;

  const markerX = clamp(centerX - MARKER_WIDTH / 2, EDGE_PAD, Math.max(EDGE_PAD, safeArea.width - MARKER_WIDTH - EDGE_PAD));
  const markerY = clamp(centerY - MARKER_HEIGHT / 2, EDGE_PAD, Math.max(EDGE_PAD, safeArea.height - MARKER_HEIGHT - EDGE_PAD));

  return { x: markerX, y: markerY };
}

function LostElementsOverlay({ elements, safeArea, selectedIds = [], onSelect }: LostElementsOverlayProps) {
  const lostElements = useMemo(() => {
    if (!safeArea?.width || !safeArea?.height) return [];

    return (Array.isArray(elements) ? elements : [])
      .filter((el) => {
        if (!el || el?.meta?.hidden) return false;
        const size = getElementSize(el);
        const rect = {
          x: Number(el.x) || 0,
          y: Number(el.y) || 0,
          width: size.width,
          height: size.height,
        };
        return isFullyOutsideSafeArea(rect, { x: 0, y: 0, width: safeArea.width, height: safeArea.height });
      })
      .map((el) => ({ el, pos: getLostMarkerPosition(el, safeArea) }));
  }, [elements, safeArea]);

  if (!lostElements.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[55] no-export" data-lost-elements-overlay>
      {lostElements.map(({ el, pos }) => {
        const selected = selectedIds.includes(el.id);
        const isText = el.type === "text";

        return (
          <button
            key={el.id}
            type="button"
            title="Element is outside the print area"
            data-lost-element-marker
            className={`pointer-events-auto absolute flex h-[34px] w-[54px] items-center justify-center rounded-[10px] border text-[10px] font-black shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-md transition active:scale-95 ${
              selected
                ? "border-orange-200 bg-orange-400/35 text-white ring-2 ring-orange-200/70"
                : "border-orange-300/80 bg-orange-400/22 text-orange-50 hover:bg-orange-400/32"
            }`}
            style={{ left: pos.x, top: pos.y }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onSelect?.(el);
            }}
          >
            <span className="absolute inset-1 rounded-[7px] border border-dashed border-orange-100/85" />
            <span className="relative flex items-center gap-1">
              {isText ? <Type size={12} strokeWidth={3} /> : <ImageIcon size={12} strokeWidth={3} />}
              !
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default memo(LostElementsOverlay);
