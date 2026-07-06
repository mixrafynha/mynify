import type { CSSProperties } from "react";
import type { RenderElement } from "./types";
import { finiteNumber } from "./textLayout";

const DEFAULT_IMAGE_SIZE = 140;
const DEFAULT_SHAPE_SIZE = 120;

export function getElementRenderWidth(el: RenderElement) {
  const fallback = el.type === "shape" ? DEFAULT_SHAPE_SIZE : DEFAULT_IMAGE_SIZE;
  return Math.max(1, finiteNumber(el.width, fallback));
}

export function getElementRenderHeight(el: RenderElement) {
  const fallback = el.type === "shape" ? DEFAULT_SHAPE_SIZE : DEFAULT_IMAGE_SIZE;
  return Math.max(1, finiteNumber(el.height, fallback));
}

export function getElementBoxStyle(
  el: RenderElement,
  options: {
    selected?: boolean;
    previewMode?: boolean;
    locked?: boolean;
    interactive?: boolean;
    scaleX?: number;
    scaleY?: number;
  } = {},
): CSSProperties {
  const scaleX = Math.max(0.0001, finiteNumber(options.scaleX, 1));
  const scaleY = Math.max(0.0001, finiteNumber(options.scaleY, 1));
  const width = getElementRenderWidth(el) * scaleX;
  const height = getElementRenderHeight(el) * scaleY;
  const x = finiteNumber(el.x, 0) * scaleX;
  const y = finiteNumber(el.y, 0) * scaleY;
  const rotation = finiteNumber(el.meta?.rotation ?? el.rotation, 0);
  const flipX = !!(el.flipX || el.meta?.flipX);
  const flipY = !!(el.flipY || el.meta?.flipY);
  const opacity = Math.max(0, Math.min(1, finiteNumber(el.opacity ?? el.meta?.opacity, 1)));

  return {
    position: "absolute",
    left: 0,
    top: 0,
    width,
    height,
    transform: `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
    transformOrigin: "center center",
    boxSizing: "border-box",
    overflow: "visible",
    zIndex: el.zIndex ?? (options.selected ? 50 : 10),
    opacity,
    cursor: options.previewMode ? "default" : options.locked ? "not-allowed" : options.selected ? "move" : "grab",
    touchAction: options.previewMode ? "auto" : "none",
    userSelect: "none",
    pointerEvents: options.interactive === false || options.previewMode ? "none" : "auto",
    willChange: options.selected ? "transform,width,height" : "auto",
  };
}
