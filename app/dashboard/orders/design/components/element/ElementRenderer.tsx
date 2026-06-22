"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { getTextPadding } from "../canvas/canvasMath";

type Props = {
  el: any;
  isSelected: boolean;
  editing: boolean;
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  startEditing: () => void;
  updateText: (value: string) => void;
  setEditing: (value: boolean) => void;
};

const FONT_MAP: Record<string, string> = {
  Anton: "var(--font-anton)",
  "Bebas Neue": "var(--font-bebas)",
  Orbitron: "var(--font-orbitron)",
  "Playfair Display": "var(--font-playfair)",
  Poppins: "var(--font-poppins)",
  Cinzel: "var(--font-cinzel)",
  "DM Serif Display": "var(--font-dm-serif)",
  "Space Grotesk": "var(--font-space)",
  "Rubik Mono One": "var(--font-rubik-mono)",
};

function resolveFontFamily(font?: string): string {
  if (!font) return "var(--font-poppins), Arial, sans-serif";
  return `${FONT_MAP[font] || `"${font}"`}, Arial, sans-serif`;
}

function sanitizeTextInput(value: string): string {
  return value.normalize("NFKC").replace(/[<>]/g, "").slice(0, 200);
}

const ImageElement = memo(function ImageElement({
  el,
  isSelected,
  isHovered,
}: {
  el: any;
  isSelected: boolean;
  isHovered: boolean;
}) {
  return (
    <div className="relative h-full w-full overflow-visible touch-none select-none">
      <img
        src={el.src}
        draggable={false}
        alt=""
        decoding="async"
        loading="lazy"
        className="pointer-events-none block h-full w-full object-fill select-none"
        style={{ opacity: el.meta?.opacity ?? 1, filter: `brightness(${el.meta?.brightness ?? 100}%) contrast(${el.meta?.contrast ?? 100}%) saturate(${el.meta?.saturation ?? 100}%)` }}
      />
    </div>
  );
});

const TextElement = memo(function TextElement({
  el,
  isSelected,
  editing,
  inputRef,
  startEditing,
  updateText,
  setEditing,
  isHovered,
}: Props & { isHovered: boolean }) {
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
      fontWeight: el.meta?.fontWeight || 700,
      color: el.meta?.color || "#000000",
      letterSpacing: `${el.meta?.letterSpacing ?? 0}px`,
      lineHeight,
      textAlign: el.meta?.textAlign || "center",
      opacity: el.meta?.opacity ?? 1,
      padding: `${padding.y}px ${padding.x}px`,
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
      textShadow: el.meta?.shadow ? `0 8px 18px ${el.meta?.shadowColor || "rgba(0,0,0,.35)"}` : el.meta?.glow ? `0 0 18px ${el.meta?.glowColor || el.meta?.color || "#8b5cf6"}` : undefined,
      WebkitTextStroke: el.meta?.strokeWidth ? `${el.meta.strokeWidth}px ${el.meta?.strokeColor || "#000000"}` : undefined,
      background: el.meta?.gradient ? `linear-gradient(90deg, ${el.meta?.gradientFrom || "#8b5cf6"}, ${el.meta?.gradientTo || "#22d3ee"})` : undefined,
      WebkitBackgroundClip: el.meta?.gradient ? "text" : undefined,
      WebkitTextFillColor: el.meta?.gradient ? "transparent" : undefined,
      overflow: "visible",
    }),
    [el.fontFamily, el.meta, fontSize, lineHeight, padding.x, padding.y]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!editing) startEditing();
    },
    [editing, startEditing]
  );

  const handleBlur = useCallback(() => setEditing(false), [setEditing]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Escape" || ((e.metaKey || e.ctrlKey) && e.key === "Enter")) {
        e.preventDefault();
        setEditing(false);
      }
    },
    [setEditing]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateText(sanitizeTextInput(e.target.value));
    },
    [updateText]
  );

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className="relative h-full w-full overflow-visible touch-none select-none"
    >
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
          className="block h-full w-full resize-none bg-transparent outline-none"
          style={textStyle}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center whitespace-pre-wrap break-words"
          style={textStyle}
        >
          {content || "Text"}
        </div>
      )}
    </div>
  );
});

const ShapeElement = memo(function ShapeElement({
  el,
  isSelected,
  isHovered,
}: {
  el: any;
  isSelected: boolean;
  isHovered: boolean;
}) {
  return (
    <div
      className="relative h-full w-full overflow-visible touch-none select-none"
      style={{
        backgroundColor: el.meta?.color || el.meta?.fill || "#8b5cf6",
        border: el.meta?.strokeWidth ? `${el.meta.strokeWidth}px solid ${el.meta?.strokeColor || "#ffffff"}` : undefined,
        boxShadow: el.meta?.shadow ? `0 12px 32px ${el.meta?.shadowColor || "rgba(0,0,0,.32)"}` : undefined,
        opacity: el.meta?.opacity ?? 1,
      }}
    >
    </div>
  );
});

const ElementRenderer = memo(function ElementRenderer(props: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  return (
    <div className="h-full w-full" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {["image", "logo", "sticker", "template", "svg", "qr", "barcode"].includes(props.el.type) && (
        <ImageElement el={props.el} isSelected={props.isSelected} isHovered={isHovered} />
      )}

      {props.el.type === "text" && <TextElement {...props} isHovered={isHovered} />}

      {props.el.type === "shape" && (
        <ShapeElement el={props.el} isSelected={props.isSelected} isHovered={isHovered} />
      )}
    </div>
  );
});

ElementRenderer.displayName = "ElementRenderer";

export default ElementRenderer;
