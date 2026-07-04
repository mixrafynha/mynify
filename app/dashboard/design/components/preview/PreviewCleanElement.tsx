"use client";

import { memo, useMemo } from "react";
import type { PreviewElement } from "./types/preview";

function fontFamily(el: PreviewElement) {
  const f = el.meta?.fontFamily || el.fontFamily || "Inter";
  return `"${f}", Arial, sans-serif`;
}

function PreviewCleanElement({ el }: { el: PreviewElement }) {
  const element = el as PreviewElement & Record<string, any>;

  const style = useMemo<React.CSSProperties>(() => {
    const width = Math.max(1, Number(el.width || el.meta?.width || 1));
    const height = Math.max(1, Number(el.height || el.meta?.height || 1));
    const rotation =
      Number(element.meta?.rotation ?? element.rotation ?? 0) || 0;

    return {
      position: "absolute",
      left: 0,
      top: 0,
      width,
      height,
      transform: `translate3d(${Number(el.x || 0)}px, ${Number(el.y || 0)}px, 0) rotate(${rotation}deg) scale(${el.meta?.flipX ? -1 : 1}, 1)`,
      transformOrigin: "center center",
      zIndex: Number(el.zIndex || 1),
      opacity: Number(element.meta?.opacity ?? element.opacity ?? 1),
    };
  }, [el]);

  const imageSrc = el.src || el.meta?.src || el.meta?.image || el.meta?.url;

  if ((el.type === "image" || imageSrc) && imageSrc) {
    return (
      <div style={style}>
        <img
          src={imageSrc}
          alt=""
          draggable={false}
          className="block h-full w-full select-none object-fill"
          style={{
            filter: `brightness(${el.meta?.brightness ?? 100}%) contrast(${el.meta?.contrast ?? 100}%) saturate(${el.meta?.saturation ?? 100}%)`,
          }}
        />
      </div>
    );
  }

  if (el.type === "shape") {
    const fill =
      element.meta?.color ||
      element.meta?.fill ||
      element.color ||
      element.fill ||
      "#8b5cf6";
    const radius =
      element.meta?.radius ??
      element.meta?.borderRadius ??
      element.borderRadius ??
      0;

    return (
      <div
        style={{
          ...style,
          background: fill,
          borderRadius: radius,
          border: el.meta?.strokeWidth
            ? `${el.meta.strokeWidth}px solid ${el.meta?.strokeColor || "#fff"}`
            : undefined,
          boxSizing: "border-box",
        }}
      />
    );
  }

  const text = el.text || el.content || "";
  return (
    <div
      style={style}
      className="flex items-center justify-center whitespace-pre-wrap break-words text-center"
    >
      <div
        style={{
          width: "100%",
          fontFamily: fontFamily(el),
          fontSize: Number(el.meta?.fontSize || el.fontSize || 40),
          fontWeight: el.meta?.fontWeight || 800,
          lineHeight: Number(el.meta?.lineHeight || 1.15),
          letterSpacing: `${Number(el.meta?.letterSpacing || 0)}px`,
          color: el.meta?.color || "#111",
          textAlign: el.meta?.textAlign || "center",
          WebkitTextStroke: el.meta?.strokeWidth
            ? `${el.meta.strokeWidth}px ${el.meta?.strokeColor || "#000"}`
            : undefined,
          textShadow: el.meta?.shadow
            ? `0 8px 18px ${el.meta?.shadowColor || "rgba(0,0,0,.35)"}`
            : undefined,
        }}
      >
        {text}
      </div>
    </div>
  );
}

export default memo(PreviewCleanElement);
