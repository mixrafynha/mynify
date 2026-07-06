import ElementRenderer from "./ElementRenderer";
import { getElementBoxStyle } from "./elementBox";
import type { Box, RenderElement } from "./types";

export default function PrintCanvas({
  elements,
  safeArea,
  scaleX = 1,
  scaleY = 1,
  imageCrossOrigin = "anonymous",
}: {
  elements: RenderElement[];
  safeArea: Box;
  scaleX?: number;
  scaleY?: number;
  imageCrossOrigin?: "anonymous" | false;
}) {
  const width = Math.max(1, Number(safeArea?.width || 1));
  const height = Math.max(1, Number(safeArea?.height || 1));

  return (
    <div
      id="print-canvas"
      style={{
        position: "relative",
        width,
        height,
        overflow: "hidden",
        clipPath: "inset(0)",
        boxSizing: "border-box",
      }}
    >
      {elements.map((el) => (
        <div
          key={el.id || `${el.type}-${el.x}-${el.y}`}
          data-print-element
          style={getElementBoxStyle(el, { scaleX, scaleY, interactive: false })}
        >
          <ElementRenderer el={el} editing={false} imageCrossOrigin={imageCrossOrigin} />
        </div>
      ))}
    </div>
  );
}
