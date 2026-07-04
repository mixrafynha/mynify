"use client";

import { memo, useMemo } from "react";
import DraggableElement from "../DraggableElement";
import { getPrintBox } from "../canvas/canvasMath";
import { getConfiguredSafeArea } from "../canvas/productConfig";
import type { ProductDisplayConfig } from "../canvas/productConfig";
import { MOCKUP_AREA } from "../canvas/constants";
import type { CanvasSide } from "../canvas/types";

type SideElements = Partial<Record<CanvasSide, any[]>>;

function sorted(elements: any[]) {
  return [...(Array.isArray(elements) ? elements : [])].sort(
    (a, b) => (Number(a?.zIndex) || 0) - (Number(b?.zIndex) || 0),
  );
}

function noop() {}

function CaptureSideLayer({
  category,
  side,
  elements,
  productConfig,
}: {
  category: string;
  side: CanvasSide;
  elements: any[];
  productConfig?: ProductDisplayConfig | null;
}) {
  const printBox = useMemo(() => getPrintBox(category, side, productConfig), [category, side, productConfig]);
  const safeArea = useMemo(() => getConfiguredSafeArea(category, side, productConfig), [category, side, productConfig]);
  const sideElements = useMemo(() => sorted(elements), [elements]);

  return (
    <div
      data-production-capture-stage={side}
      aria-hidden="true"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: MOCKUP_AREA.width,
        height: MOCKUP_AREA.height,
        overflow: "hidden",
        background: "transparent",
        pointerEvents: "none",
        contain: "layout paint size style",
        isolation: "isolate",
      }}
    >
      <div
        data-production-capture-source="true"
        data-printable-capture-layer={side}
        data-logical-width={safeArea.width}
        data-logical-height={safeArea.height}
        style={{
          position: "absolute",
          left: `${(safeArea.x / MOCKUP_AREA.width) * 100}%`,
          top: `${(safeArea.y / MOCKUP_AREA.height) * 100}%`,
          width: `${(safeArea.width / MOCKUP_AREA.width) * 100}%`,
          height: `${(safeArea.height / MOCKUP_AREA.height) * 100}%`,
          overflow: "hidden",
          clipPath: "inset(0)",
          background: "transparent",
          pointerEvents: "none",
          contain: "layout paint size style",
          isolation: "isolate",
        }}
      >
        {sideElements.map((el: any) => (
          <DraggableElement
            key={`production-capture-${side}-${el?.id}`}
            el={el}
            safeArea={{ x: 0, y: 0, width: safeArea.width, height: safeArea.height }}
            zoom={1}
            isSelected={false}
            selectedIds={[]}
            setSelectedIds={noop}
            setSelectedId={noop}
            setSelectedElement={noop}
            updateSelectedElements={noop}
            endSelectedElementsDrag={noop}
            updateElement={noop}
            allElements={sideElements}
            previewMode
          />
        ))}
      </div>
    </div>
  );
}

function ProductionCaptureLayers({
  category = "tshirt",
  frontElements = [],
  backElements = [],
  productConfig = null,
}: {
  category?: string;
  frontElements?: any[];
  backElements?: any[];
  productConfig?: ProductDisplayConfig | null;
}) {
  const sideElements: SideElements = {
    front: frontElements,
    back: backElements,
  };

  return (
    <div
      data-production-capture-layers="true"
      aria-hidden="true"
      style={{
        position: "fixed",
        left: "-20000px",
        top: 0,
        width: MOCKUP_AREA.width,
        height: MOCKUP_AREA.height,
        overflow: "hidden",
        pointerEvents: "none",
        background: "transparent",
        zIndex: -2147483647,
        contain: "layout paint size style",
        isolation: "isolate",
      }}
    >
      {(["front", "back"] as CanvasSide[]).map((side) => (
        <CaptureSideLayer
          key={side}
          category={category}
          side={side}
          elements={sideElements[side] || []}
          productConfig={productConfig}
        />
      ))}
    </div>
  );
}

export default memo(ProductionCaptureLayers);
