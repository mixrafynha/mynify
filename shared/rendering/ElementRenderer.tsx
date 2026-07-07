"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { resolveFontFamily } from "./font";
import { resolveElementImageSrc } from "./imageSource";
import { getTextPadding } from "./textLayout";
import type { ElementRendererProps, RenderElement } from "./types";

function sanitizeTextInput(value: string): string {
  return value.normalize("NFKC").replace(/[<>]/g, "").slice(0, 200);
}


const fill: React.CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  overflow: "visible",
  touchAction: "none",
  userSelect: "none",
  boxSizing: "border-box",
};

function withRetryToken(src: string, retry: number) {
  if (!retry) return src;

  try {
    const url = new URL(src);
    url.searchParams.set("ryfio_retry", String(retry));
    return url.toString();
  } catch {
    return src;
  }
}

const ImageElement = memo(function ImageElement({
  el,
  imageCrossOrigin = "anonymous",
}: {
  el: RenderElement;
  imageCrossOrigin?: "anonymous" | false;
}) {
  const src = resolveElementImageSrc(el);
  const [retry, setRetry] = useState(0);

  if (!src) {
    console.error("RYFIO IMAGE RENDER ERROR: missing image src", { el });
    return null;
  }

  const displaySrc = withRetryToken(src, retry);

  return (
    <div style={fill}>
      <img
        key={displaySrc}
        crossOrigin={imageCrossOrigin || undefined}
        referrerPolicy="no-referrer"
        src={displaySrc}
        draggable={false}
        alt=""
        decoding="sync"
        loading="eager"
        onError={() => {
          console.error("RYFIO IMAGE RENDER ERROR: failed to load image", { src, displaySrc, el });
          if (retry < 2) window.setTimeout(() => setRetry((value) => value + 1), 250);
        }}
        style={{
          pointerEvents: "none",
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: el.meta?.objectFit || "fill",
          userSelect: "none",
          opacity: el.meta?.imageOpacity ?? el.meta?.opacity ?? 1,
          filter: `brightness(${el.meta?.brightness ?? 100}%) contrast(${el.meta?.contrast ?? 100}%) saturate(${el.meta?.saturation ?? 100}%)`,
        }}
      />
    </div>
  );
});

const TextElement = memo(function TextElement({
  el,
  editing = false,
  inputRef,
  startEditing,
  updateText,
  setEditing,
}: ElementRendererProps) {
  const content = el.text || el.content || "";
  const fontSize = Math.max(8, Number(el.meta?.fontSize || el.fontSize || 40));
  const lineHeight = Number(el.meta?.lineHeight || 1.16);
  const padding = getTextPadding(fontSize, el.meta || {});

  const textStyle = useMemo<React.CSSProperties>(
    () => ({
      boxSizing: "border-box",
      width: "100%",
      height: "100%",
      fontFamily: resolveFontFamily(el.meta?.fontFamily || el.fontFamily),
      fontSize,
      fontWeight: el.meta?.fontWeight || el.fontWeight || 700,
      fontStyle: el.meta?.fontStyle || el.fontStyle || "normal",
      color: el.meta?.color || el.color || "#000000",
      letterSpacing: `${el.meta?.letterSpacing ?? 0}px`,
      lineHeight,
      textAlign: el.meta?.textAlign || el.textAlign || "center",
      opacity: el.meta?.textOpacity ?? 1,
      padding: `${padding.y}px ${padding.x}px`,
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
      textShadow: el.meta?.shadow
        ? `0 8px 18px ${el.meta?.shadowColor || "rgba(0,0,0,.35)"}`
        : el.meta?.glow
          ? `0 0 18px ${el.meta?.glowColor || el.meta?.color || "#8b5cf6"}`
          : undefined,
      WebkitTextStroke: el.meta?.strokeWidth
        ? `${el.meta.strokeWidth}px ${el.meta?.strokeColor || "#000000"}`
        : undefined,
      paintOrder: el.meta?.strokeWidth ? "stroke" : undefined,
      background: el.meta?.gradient
        ? `linear-gradient(90deg, ${el.meta?.gradientFrom || "#8b5cf6"}, ${el.meta?.gradientTo || "#22d3ee"})`
        : undefined,
      WebkitBackgroundClip: el.meta?.gradient ? "text" : undefined,
      WebkitTextFillColor: el.meta?.gradient ? "transparent" : undefined,
      overflow: "visible",
    }),
    [el.color, el.fontFamily, el.fontWeight, el.fontSize, el.meta, el.textAlign, fontSize, lineHeight, padding.x, padding.y],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!editing) startEditing?.();
    },
    [editing, startEditing],
  );

  const handleBlur = useCallback(() => setEditing?.(false), [setEditing]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Escape" || ((e.metaKey || e.ctrlKey) && e.key === "Enter")) {
        e.preventDefault();
        setEditing?.(false);
      }
    },
    [setEditing],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateText?.(sanitizeTextInput(e.target.value));
    },
    [updateText],
  );

  return (
    <div onDoubleClick={handleDoubleClick} style={fill}>
      {editing ? (
        <textarea
          ref={inputRef as any}
          defaultValue={content}
          autoFocus
          spellCheck={false}
          maxLength={200}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          style={{
            ...textStyle,
            display: "block",
            resize: "none",
            background: "transparent",
            outline: "none",
            border: 0,
            margin: 0,
          }}
        />
      ) : (
        <div
          style={{
            ...textStyle,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}
        >
          {content || "Text"}
        </div>
      )}
    </div>
  );
});

const ShapeElement = memo(function ShapeElement({ el }: { el: RenderElement }) {
  return (
    <div
      style={{
        ...fill,
        backgroundColor: el.meta?.color || el.meta?.fill || el.fill || el.color || "#8b5cf6",
        border: el.meta?.strokeWidth
          ? `${el.meta.strokeWidth}px solid ${el.meta?.strokeColor || "#ffffff"}`
          : undefined,
        borderRadius: el.borderRadius ?? el.meta?.borderRadius ?? 0,
        boxShadow: el.meta?.shadow
          ? `0 12px 32px ${el.meta?.shadowColor || "rgba(0,0,0,.32)"}`
          : undefined,
        opacity: el.meta?.shapeOpacity ?? 1,
      }}
    />
  );
});

const ElementRenderer = memo(function ElementRenderer(props: ElementRendererProps) {
  return (
    <div style={{ width: "100%", height: "100%", boxSizing: "border-box" }}>
      {props.el.type === "image" && <ImageElement el={props.el} imageCrossOrigin={props.imageCrossOrigin} />}
      {props.el.type === "text" && <TextElement {...props} />}
      {props.el.type === "shape" && <ShapeElement el={props.el} />}
    </div>
  );
});

ElementRenderer.displayName = "ElementRenderer";

export default ElementRenderer;
