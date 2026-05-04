"use client";

import { useMemo, useState, useRef } from "react";

export default function DraggableElement({
  el,
  isSelected,
  onPointerDown,
  updateElement,
}: any) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLInputElement | null>(null);

  // ================= MOVE FIX =================
  const baseStyle = useMemo(
    () => ({
      position: "absolute",
      transform: `translate(${el.x}px, ${el.y}px)`,
    }),
    [el.x, el.y]
  );

  // ================= UPDATE TEXT =================
  const updateText = (value: string) => {
    updateElement?.({
      ...el,
      content: value,
      text: value,
    });
  };

  return (
    <div
      onPointerDown={(e) => {
        if (editing) return; // ❌ impede drag durante edição
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
     style={baseStyle as React.CSSProperties}
    >

      {/* ================= IMAGE ================= */}
      {el.type === "image" && (
        <div
          className={`
            relative
            rounded-md
            overflow-hidden
            ${isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""}
          `}
          style={{
            width: el.width,
            height: el.height,
            maxWidth: "80vw",
            maxHeight: "60vh",
          }}
        >
          <img
            src={el.src}
            draggable={false}
            className="w-full h-full object-contain pointer-events-none"
          />

          {isSelected && (
            <div className="absolute inset-0 border border-blue-400/40 pointer-events-none" />
          )}
        </div>
      )}

      {/* ================= TEXT (EDITABLE) ================= */}
      {el.type === "text" && (
        <div
          onDoubleClick={() => {
            setEditing(true);
            setTimeout(() => ref.current?.focus(), 50);
          }}

          // 👇 suporte mobile (tap rápido)
          onTouchEnd={() => {
            if (!isSelected) return;
            setEditing(true);
            setTimeout(() => ref.current?.focus(), 50);
          }}
          className={`
            px-1 py-0.5
            leading-tight
            transition
            ${isSelected ? "outline outline-1 outline-blue-500" : ""}
          `}
          style={{
            fontSize: el.meta?.fontSize || 24,
            fontFamily: el.meta?.fontFamily || "Inter",
            color: el.meta?.color || "#000",
            maxWidth: "80vw",
          }}
        >
          {editing ? (
            <input
              ref={ref}
              value={el.content || el.text}
              autoFocus
              maxLength={200}
              onChange={(e) => updateText(e.target.value)}
              onBlur={() => setEditing(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setEditing(false);
              }}
              className="bg-transparent outline-none"
              style={{
                fontSize: el.meta?.fontSize || 24,
                fontFamily: el.meta?.fontFamily || "Inter",
                color: el.meta?.color || "#000",

                // 🔥 menor e fixo (sem crescer demais)
                width: "120px",
                minWidth: "80px",
              }}
            />
          ) : (
            <div className="whitespace-pre-wrap break-words">
              {el.content || el.text}
            </div>
          )}
        </div>
      )}

    </div>
  );
}