"use client";

import { memo, useCallback, useRef } from "react";
import {
  Image,
  Type,
  Wand2,
  Star,
  LayoutTemplate,
  Sparkles,
  Box,
  Images,
  Layers,
} from "lucide-react";

import ToolButton from "./ToolButton";

const tools = [
  { id: "ai", label: "AI", icon: <Wand2 size={18} />, badge: "AI" },
  { id: "templates", label: "Templates", icon: <LayoutTemplate size={18} /> },
  { id: "text", label: "Text", icon: <Type size={18} /> },
  { id: "icons", label: "Elements", icon: <Star size={18} /> },
  { id: "images", label: "Images", icon: <Images size={18} /> },
  { id: "assets3d", label: "3D", icon: <Box size={18} /> },
  { id: "stickers", label: "Stickers", icon: <Sparkles size={18} /> },
  { id: "layers", label: "Layers", icon: <Layers size={18} /> },
  { id: "upload", label: "Upload", icon: <Image size={18} /> },
] as const;

type MobileToolbarProps = {
  open: boolean;
  panel: string;
  setOpen: (value: boolean) => void;
  setPanel: (value: string) => void;
  selected?: unknown;
};

function MobileToolbar({
  open,
  panel,
  setOpen,
  setPanel,
}: MobileToolbarProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const dragRef = useRef({
    dragging: false,
    moved: false,
    startX: 0,
    scrollLeft: 0,
  });

  const openPanel = useCallback(
    (nextPanel: string) => {
      if (dragRef.current.moved) return;

      if (open && panel === nextPanel) {
        setOpen(false);
        return;
      }

      setPanel(nextPanel);
      setOpen(true);
    },
    [open, panel, setOpen, setPanel]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const scroller = scrollerRef.current;
      if (!scroller) return;

      dragRef.current = {
        dragging: true,
        moved: false,
        startX: event.clientX,
        scrollLeft: scroller.scrollLeft,
      };

      scroller.setPointerCapture?.(event.pointerId);
    },
    []
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const scroller = scrollerRef.current;
      const drag = dragRef.current;

      if (!scroller || !drag.dragging) return;

      const deltaX = event.clientX - drag.startX;

      if (Math.abs(deltaX) > 5) {
        drag.moved = true;
        scroller.scrollLeft = drag.scrollLeft - deltaX;
      }
    },
    []
  );

  const stopDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;

    dragRef.current.dragging = false;

    try {
      scroller?.releasePointerCapture?.(event.pointerId);
    } catch {}

    window.setTimeout(() => {
      dragRef.current.moved = false;
    }, 90);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden ${
        open
          ? "pointer-events-none translate-y-[110%] opacity-0"
          : "translate-y-0 opacity-100"
      }`}
    >
      <div className="mx-auto max-w-[640px] px-1.5 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        <div
          className="
            relative overflow-hidden rounded-[16px]
            bg-[#070817] text-white
            shadow-[0_-10px_28px_rgba(0,0,0,0.34),0_0_22px_rgba(124,58,237,0.12)]
            ring-1 ring-violet-300/15
          "
        >
          <div
            ref={scrollerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDrag}
            onPointerCancel={stopDrag}
            className="
              relative overflow-x-auto overscroll-x-contain
              px-1 pt-1
              [-webkit-overflow-scrolling:touch]
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
              select-none touch-pan-x
            "
          >
            <div className="flex min-w-max items-center gap-0.5 pb-1">
              {tools.map((tool) => (
                <ToolButton
                  key={tool.id}
                  active={open && panel === tool.id}
                  icon={tool.icon}
                  label={tool.label}
                  badge={"badge" in tool ? tool.badge : undefined}
                  onClick={() => openPanel(tool.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(MobileToolbar);
