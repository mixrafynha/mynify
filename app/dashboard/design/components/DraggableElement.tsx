"use client";

import { useMemo, useRef, useState } from "react";

export default function DraggableElement({
  el,
  isSelected,
  onPointerDown,
  updateElement,
}: any) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLInputElement | null>(null);

  const rotation = el.meta?.rotation || 0;
  const flipX = el.meta?.flipX ? -1 : 1;
  const flipY = el.meta?.flipY ? -1 : 1;
  const textShape = el.meta?.textShape || "straight";

  const baseStyle = useMemo(
    () => ({
      position: "absolute" as const,
      transform: `translate3d(${el.x}px, ${el.y}px, 0) rotate(${rotation}deg) scale(${flipX}, ${flipY})`,
      transformOrigin: "center center",
    }),
    [el.x, el.y, rotation, flipX, flipY]
  );

  const updateText = (value: string) => {
    updateElement?.({
      text: value,
      content: value,
    });
  };

  const startEditing = () => {
    if (!isSelected) return;

    setEditing(true);
    window.setTimeout(() => ref.current?.focus(), 50);
  };

  return (
    <div
      onPointerDown={(e) => {
        if (editing) return;
        onPointerDown?.(e);
      }}
      className={`
        absolute
        select-none
        touch-none
        cursor-move
        will-change-transform
        ${isSelected ? "z-50" : "z-10"}
      `}
      style={baseStyle}
    >
      {el.type === "image" && (
        <div
          className={`
            relative
            overflow-hidden
            rounded-md
            ${isSelected ? "ring-2 ring-fuchsia-400 ring-offset-2 ring-offset-transparent" : ""}
          `}
          style={{
            width: el.width || 120,
            height: el.height || 120,
          }}
        >
          <img
            src={el.src}
            draggable={false}
            alt=""
            className="pointer-events-none h-full w-full select-none object-contain"
          />

          {isSelected && (
            <div className="pointer-events-none absolute inset-0 border border-fuchsia-300/50" />
          )}
        </div>
      )}

      {el.type === "text" && (
        <div
          onDoubleClick={startEditing}
          onTouchEnd={startEditing}
          className={`
            relative
            px-1
            py-0.5
            leading-tight
            transition
            ${isSelected ? "outline outline-1 outline-fuchsia-400" : ""}
          `}
          style={{
            width: el.width || "auto",
            minWidth: 24,
            maxWidth: 9999,
            fontSize: el.meta?.fontSize || 24,
            fontFamily: el.meta?.fontFamily || "Inter",
            color: el.meta?.color || "#000",
            letterSpacing: `${el.meta?.letterSpacing || 0}px`,
            lineHeight: 1.05,
          }}
        >
          {editing ? (
            <input
              ref={ref}
              value={el.content || el.text || ""}
              autoFocus
              maxLength={200}
              onChange={(e) => updateText(e.target.value)}
              onBlur={() => setEditing(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setEditing(false);
              }}
              className="bg-transparent outline-none"
              style={{
                width: Math.max(
                  90,
                  String(el.content || el.text || "").length *
                    ((el.meta?.fontSize || 24) * 0.58)
                ),
                fontSize: el.meta?.fontSize || 24,
                fontFamily: el.meta?.fontFamily || "Inter",
                color: el.meta?.color || "#000",
                letterSpacing: `${el.meta?.letterSpacing || 0}px`,
              }}
            />
          ) : (
            <div
              className={`
                whitespace-pre-wrap
                break-words
                font-black
                ${textShape === "wave" ? "animate-pulse" : ""}
              `}
              style={{
                transform:
                  textShape === "wave"
                    ? "skewY(-5deg) rotate(-2deg)"
                    : textShape === "arc"
                    ? "rotate(-5deg)"
                    : "none",
              }}
            >
              {el.content || el.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}