"use client";

import { memo, useCallback, useRef, type ReactNode, type PointerEvent } from "react";
import {
  Image,
  Type,
  Wand2,
  Star,
  Palette,
  LayoutTemplate,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import ToolButton from "./ToolButton";

type ToolItem = {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: string;
  requiresSelection: boolean;
};

const tools: ToolItem[] = [
  {
    id: "ai",
    label: "AI",
    icon: <Wand2 size={21} />,
    badge: "AI",
    requiresSelection: false,
  },
  {
    id: "templates",
    label: "Templates",
    icon: <LayoutTemplate size={21} />,
    requiresSelection: false,
  },
  {
    id: "icons",
    label: "Elements",
    icon: <Star size={21} />,
    requiresSelection: false,
  },
  {
    id: "text",
    label: "Text",
    icon: <Type size={21} />,
    requiresSelection: false,
  },
  {
    id: "edit",
    label: "Edit",
    icon: <SlidersHorizontal size={21} />,
    requiresSelection: true,
  },
  {
    id: "replace",
    label: "Replace",
    icon: <RotateCcw size={21} />,
    requiresSelection: true,
  },
  {
    id: "effects",
    label: "Tools",
    icon: <Sparkles size={21} />,
    requiresSelection: true,
  },
  {
    id: "upload",
    label: "Upload",
    icon: <Image size={21} />,
    requiresSelection: false,
  },
  {
    id: "brand",
    label: "Brand",
    icon: <Palette size={21} />,
    requiresSelection: true,
  },
];

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
  selected,
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

      setOpen(true);
      setPanel(nextPanel);
    },
    [setOpen, setPanel]
  );

  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    dragRef.current = {
      dragging: true,
      moved: false,
      startX: event.clientX,
      scrollLeft: scroller.scrollLeft,
    };

    scroller.setPointerCapture?.(event.pointerId);
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;
    const drag = dragRef.current;

    if (!scroller || !drag.dragging) return;

    const deltaX = event.clientX - drag.startX;

    if (Math.abs(deltaX) > 4) {
      drag.moved = true;
    }

    scroller.scrollLeft = drag.scrollLeft - deltaX;
  }, []);

  const stopDrag = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;

    dragRef.current.dragging = false;

    try {
      scroller?.releasePointerCapture?.(event.pointerId);
    } catch {
      // Ignore browsers that already released the pointer.
    }

    window.setTimeout(() => {
      dragRef.current.moved = false;
    }, 80);
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 md:hidden">
      <div className="mx-auto max-w-[680px] px-2 pb-2">
        <div
          className="
            relative overflow-hidden rounded-[26px]
            border border-white/10 bg-[#07111f]/92 text-white
            shadow-[0_-18px_45px_rgba(0,0,0,0.38),0_0_35px_rgba(14,165,233,0.12)]
            backdrop-blur-2xl
          "
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.16),transparent_52%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />

          <div
            ref={scrollerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDrag}
            onPointerCancel={stopDrag}
            className="
              relative overflow-x-auto overscroll-x-contain
              scroll-smooth px-2 pt-2
              [-webkit-overflow-scrolling:touch]
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
              select-none touch-pan-x cursor-grab active:cursor-grabbing
            "
          >
            <div
              className="
                flex min-w-max items-center gap-1.5
                pb-[calc(env(safe-area-inset-bottom)+8px)]
              "
            >
              {tools.map((tool) => {
                const disabled = tool.requiresSelection && !selected;

                return (
                  <ToolButton
                    key={tool.id}
                    active={open && panel === tool.id}
                    icon={tool.icon}
                    label={tool.label}
                    badge={tool.badge}
                    disabled={disabled}
                    onClick={() => openPanel(tool.id)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(MobileToolbar);
