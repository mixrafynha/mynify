"use client";

import { useMemo, useRef, useState } from "react";

export default function DraggableElement({
  el,
  safeArea,
  zoom = 1,
  isSelected,
  setSelectedId,
  setSelectedElement,
  updateElement,
}: any) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLInputElement | null>(null);

  const rotation = el.meta?.rotation || 0;
  const flipX = el.meta?.flipX ? -1 : 1;
  const flipY = el.meta?.flipY ? -1 : 1;
  const textShape = el.meta?.textShape || "straight";

  const elementWidth = el.width || 220;
  const elementHeight =
    el.height || (el.type === "text" ? el.meta?.fontSize || 40 : 120);

  const baseStyle = useMemo(
    () => ({
      position: "absolute" as const,
      left: el.x,
      top: el.y,
      width: elementWidth,
      height: elementHeight,
      transform: `rotate(${rotation}deg) scale(${flipX}, ${flipY})`,
      transformOrigin: "center center",
      pointerEvents: "auto" as const,
      touchAction: "none" as const,
      willChange: "left, top, width, height, transform",
    }),
    [el.x, el.y, rotation, flipX, flipY, elementWidth, elementHeight]
  );

  const patchElement = (patch: any) => updateElement?.(patch);

  function startDrag(e: React.PointerEvent) {
    if (editing || el.meta?.lock) return;

    e.preventDefault();
    e.stopPropagation();

    setSelectedId?.(el.id);
    setSelectedElement?.(el);

    const startX = e.clientX;
    const startY = e.clientY;
    const startElX = el.x;
    const startElY = el.y;

    const onMove = (ev: PointerEvent) => {
      patchElement({
        x: startElX + (ev.clientX - startX) / zoom,
        y: startElY + (ev.clientY - startY) / zoom,
      });
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  const updateText = (value: string) => {
    patchElement({
      text: value,
      content: value,
      width: elementWidth,
      height: elementHeight,
    });
  };

  const startEditing = () => {
    if (!isSelected) return;
    setEditing(true);
    window.setTimeout(() => ref.current?.focus(), 50);
  };

  const resizeElement = (
    e: React.PointerEvent,
    direction: "br" | "tr" | "bl" | "tl"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedId?.(el.id);
    setSelectedElement?.(el);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = elementWidth;
    const startHeight = elementHeight;
    const startElX = el.x;
    const startElY = el.y;

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;

      let nextWidth = startWidth;
      let nextHeight = startHeight;
      let nextX = startElX;
      let nextY = startElY;

      if (direction.includes("r")) nextWidth = Math.max(24, startWidth + dx);
      if (direction.includes("l")) {
        nextWidth = Math.max(24, startWidth - dx);
        nextX = startElX + dx;
      }

      if (direction.includes("b")) nextHeight = Math.max(24, startHeight + dy);
      if (direction.includes("t")) {
        nextHeight = Math.max(24, startHeight - dy);
        nextY = startElY + dy;
      }

      patchElement({
        x: nextX,
        y: nextY,
        width: nextWidth,
        height: nextHeight,
        meta: {
          ...(el.meta || {}),
          fontSize:
            el.type === "text"
              ? Math.max(10, Math.round(nextHeight * 0.85))
              : el.meta?.fontSize,
        },
      });
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const rotateElement = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedId?.(el.id);
    setSelectedElement?.(el);

    const box = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    const centerX = box.left + box.width / 2;
    const centerY = box.top + box.height / 2;

    const onMove = (ev: PointerEvent) => {
      const angle =
        Math.atan2(ev.clientY - centerY, ev.clientX - centerX) *
          (180 / Math.PI) +
        90;

      patchElement({
        meta: {
          ...(el.meta || {}),
          rotation: Math.round(angle),
        },
      });
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const flipElement = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    patchElement({
      meta: {
        ...(el.meta || {}),
        flipX: !el.meta?.flipX,
      },
    });
  };

  const duplicateElement = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    patchElement({ duplicate: true });
  };

  const removeElement = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    patchElement({ delete: true });
  };

  return (
    <div
      onPointerDown={startDrag}
      className={`absolute select-none touch-none cursor-move ${
        isSelected ? "z-50" : "z-10"
      }`}
      style={baseStyle}
    >
      <div className="relative h-full w-full overflow-visible">
        {el.type === "image" && (
          <div
            className={`relative h-full w-full overflow-hidden rounded-md ${
              isSelected ? "ring-2 ring-violet-500" : ""
            }`}
          >
            <img
              src={el.src}
              draggable={false}
              alt=""
              className="pointer-events-none h-full w-full select-none object-contain"
            />
          </div>
        )}

        {el.type === "text" && (
          <div
            onDoubleClick={startEditing}
            onTouchEnd={startEditing}
            className={`relative h-full w-full overflow-hidden px-1 py-0.5 leading-tight ${
              isSelected ? "outline outline-2 outline-violet-500" : ""
            }`}
            style={{
              minWidth: 24,
              fontSize: el.meta?.fontSize || 24,
              fontFamily: el.meta?.fontFamily || "Inter",
              color: el.meta?.color || "#000",
              letterSpacing: `${el.meta?.letterSpacing || 0}px`,
              lineHeight: 1.05,
              textAlign: el.meta?.textAlign || "center",
              fontWeight: el.meta?.fontWeight || 900,
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
                className="block h-full w-full bg-transparent outline-none"
                style={{
                  fontSize: el.meta?.fontSize || 24,
                  fontFamily: el.meta?.fontFamily || "Inter",
                  color: el.meta?.color || "#000",
                }}
              />
            ) : (
              <div
                className={`h-full w-full overflow-hidden whitespace-pre-wrap break-words font-black ${
                  textShape === "wave" ? "animate-pulse" : ""
                }`}
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

        {isSelected && !editing && (
          <div
            className="pointer-events-none absolute inset-0 z-[90]"
            style={{ overflow: "visible" }}
          >
            <button
              type="button"
              onPointerDown={rotateElement}
              className="
                pointer-events-auto absolute -top-11 left-1/2 flex h-9 w-9
                -translate-x-1/2 items-center justify-center rounded-full
                border border-violet-400 bg-neutral-950 text-base font-black
                text-white shadow-[0_0_18px_rgba(168,85,247,0.55)]
                active:scale-95
              "
            >
              ↻
            </button>

            <span
              onPointerDown={(e) => resizeElement(e, "tl")}
              className="pointer-events-auto absolute -left-3 -top-3 h-5 w-5 cursor-nwse-resize rounded-full border border-white/70 bg-violet-600 shadow-lg active:scale-110"
            />
            <span
              onPointerDown={(e) => resizeElement(e, "tr")}
              className="pointer-events-auto absolute -right-3 -top-3 h-5 w-5 cursor-nesw-resize rounded-full border border-white/70 bg-violet-600 shadow-lg active:scale-110"
            />
            <span
              onPointerDown={(e) => resizeElement(e, "bl")}
              className="pointer-events-auto absolute -bottom-3 -left-3 h-5 w-5 cursor-nesw-resize rounded-full border border-white/70 bg-violet-600 shadow-lg active:scale-110"
            />
            <span
              onPointerDown={(e) => resizeElement(e, "br")}
              className="pointer-events-auto absolute -bottom-3 -right-3 h-5 w-5 cursor-nwse-resize rounded-full border border-white/70 bg-violet-600 shadow-lg active:scale-110"
            />

            <div
              className="
                pointer-events-auto absolute -bottom-14 left-1/2 flex
                -translate-x-1/2 items-center gap-1 rounded-full
                border border-violet-500/60 bg-neutral-950/95 px-3 py-2
                text-[11px] font-bold text-white shadow-[0_0_24px_rgba(0,0,0,0.5)]
                backdrop-blur-md
                md:-bottom-14
              "
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <button
                type="button"
                className="rounded-full px-2.5 py-1 hover:bg-violet-600 active:scale-95"
                onPointerDown={flipElement}
              >
                Flip
              </button>

              <button
                type="button"
                className="rounded-full px-2.5 py-1 hover:bg-violet-600 active:scale-95"
                onPointerDown={duplicateElement}
              >
                Copy
              </button>

              <button
                type="button"
                className="rounded-full px-2.5 py-1 text-red-300 hover:bg-red-600 hover:text-white active:scale-95"
                onPointerDown={removeElement}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}