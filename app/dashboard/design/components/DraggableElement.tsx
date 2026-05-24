"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import ElementRenderer from "./element/ElementRenderer";
import ElementControls from "./element/ElementControls";
import ResizeHandles from "./element/ResizeHandles";

export default function DraggableElement({
  el,
  safeArea,
  zoom = 1,
  isSelected,
  selectedIds = [],
  setSelectedIds,
  setSelectedId,
  setSelectedElement,
  updateSelectedElements,
  updateElement,
}: any) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLInputElement | null>(null);
  const lastTapRef = useRef(0);

  useEffect(() => {
    if (!editing) return;

    const handleOutsideClick = (e: PointerEvent) => {
      const target = e.target as Node;

      // se clicou dentro do input continua a editar
      if (ref.current?.contains(target)) return;

      // qualquer clique fora fecha edição
      setEditing(false);
    };

    window.addEventListener("pointerdown", handleOutsideClick, true);

    return () => {
      window.removeEventListener(
        "pointerdown",
        handleOutsideClick,
        true
      );
    };
  }, [editing]);

  const rotation = el.meta?.rotation || 0;
  const flipX = el.meta?.flipX ? -1 : 1;
  const flipY = el.meta?.flipY ? -1 : 1;

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

  function selectElement(e?: React.PointerEvent) {
    const multi = e?.shiftKey || e?.ctrlKey || e?.metaKey;

    if (multi) {
      setSelectedIds?.((prev: string[]) => {
        const next = prev.includes(el.id)
          ? prev.filter((id) => id !== el.id)
          : [...prev, el.id];

        setSelectedId?.(next[next.length - 1] || null);
        return next;
      });
    } else {
      setSelectedIds?.([el.id]);
      setSelectedId?.(el.id);
    }

    setSelectedElement?.(el);
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
    setSelectedIds?.([el.id]);
    setSelectedId?.(el.id);
    setSelectedElement?.(el);

    setEditing(true);

    window.setTimeout(() => {
      ref.current?.focus();
      ref.current?.select();
    }, 50);
  };

 function startDrag(e: React.PointerEvent<HTMLDivElement>) {
  if (editing || el.meta?.lock) return;

  e.preventDefault();
  e.stopPropagation();

  selectElement(e);

  if (el.type === "text") {
    if (e.pointerType === "touch") {
      const now = Date.now();

      if (now - lastTapRef.current < 400) {
        startEditing();
        return;
      }

      lastTapRef.current = now;
    }
  }

  e.currentTarget.setPointerCapture?.(e.pointerId);

  const startX = e.clientX;
  const startY = e.clientY;
  const startElX = el.x;
  const startElY = el.y;

  let moved = false;

  const dragIds =
    selectedIds.includes(el.id) && selectedIds.length > 1
      ? selectedIds
      : [el.id];

  const onMove = (ev: PointerEvent) => {
    ev.preventDefault();

    const dx = (ev.clientX - startX) / zoom;
    const dy = (ev.clientY - startY) / zoom;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      moved = true;
    }

    if (dragIds.length > 1) {
      updateSelectedElements?.(dragIds, dx, dy);
      return;
    }

    patchElement({
      x: startElX + dx,
      y: startElY + dy,
    });
  };

  const onUp = (ev: PointerEvent) => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);

    if (
      el.type === "text" &&
      ev.pointerType === "mouse" &&
      !moved
    ) {
      startEditing();
    }
  };

  window.addEventListener("pointermove", onMove, {
    passive: false,
  });

  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
}

 const resizeElement = (
  e: React.PointerEvent,
  direction: "br" | "tr" | "bl" | "tl"
) => {
  e.preventDefault();
  e.stopPropagation();

  selectElement(e);

  const startX = e.clientX;
  const startY = e.clientY;
  const startWidth = elementWidth;
  const startHeight = elementHeight;
  const startElX = el.x;
  const startElY = el.y;

  const onMove = (ev: PointerEvent) => {
    ev.preventDefault();

    const dx = (ev.clientX - startX) / zoom;
    const dy = (ev.clientY - startY) / zoom;

    const factor = 1.35;

    let nextWidth = startWidth;
    let nextHeight = startHeight;
    let nextX = startElX;
    let nextY = startElY;

    // WIDTH
    if (direction.includes("r")) {
      nextWidth = Math.max(24, startWidth + dx * factor);
    }

    if (direction.includes("l")) {
      nextWidth = Math.max(24, startWidth - dx * factor);
      nextX = startElX + dx;
    }

    // HEIGHT
    if (direction.includes("b")) {
      nextHeight = Math.max(24, startHeight + dy * factor);
    }

    if (direction.includes("t")) {
      nextHeight = Math.max(24, startHeight - dy * factor);
      nextY = startElY + dy;
    }

    // IMAGE SCALE ONLY
    const widthRatio = nextWidth / startWidth;
    const heightRatio = nextHeight / startHeight;

    patchElement({
      x: nextX,
      y: nextY,
      width: nextWidth,
      height: nextHeight,
      meta: {
        ...(el.meta || {}),

        // IMAGEM escala
        scale:
          el.type === "image"
            ? Math.max(widthRatio, heightRatio)
            : el.meta?.scale,

        // TEXTO NÃO muda no resize (IMPORTANTE)
        fontSize: el.meta?.fontSize,
        fontFamily: el.meta?.fontFamily,
        fontWeight: el.meta?.fontWeight,
        fontStyle: el.meta?.fontStyle,
      },
    });
  };

  const onUp = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
  };

  window.addEventListener("pointermove", onMove, {
    passive: false,
  });

  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
};

  const rotateElement = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    selectElement(e);

    const box = (
      e.currentTarget.parentElement as HTMLElement
    ).getBoundingClientRect();

    const centerX = box.left + box.width / 2;
    const centerY = box.top + box.height / 2;

    const onMove = (ev: PointerEvent) => {
      ev.preventDefault();

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
      window.removeEventListener("pointercancel", onUp);
    };

    window.addEventListener("pointermove", onMove, {
      passive: false,
    });

    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
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
        <ElementRenderer
          el={el}
          isSelected={isSelected}
          editing={editing}
          inputRef={ref}
          startEditing={startEditing}
          updateText={updateText}
          setEditing={setEditing}
        />

        {isSelected &&
          !editing &&
          selectedIds.length <= 1 && (
            <div
              className="pointer-events-none absolute inset-0 z-[90]"
              style={{ overflow: "visible" }}
            >
              <ElementControls
                rotateElement={rotateElement}
                flipElement={flipElement}
                duplicateElement={duplicateElement}
                removeElement={removeElement}
              />

              <ResizeHandles
                resizeElement={resizeElement}
              />
            </div>
          )}
      </div>
    </div>
  );
}