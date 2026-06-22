"use client";

import { memo, useCallback, useRef } from "react";
import { Image, Type, Wand2, Star, LayoutTemplate, Sparkles, Box, Images, Layers } from "lucide-react";

import ToolButton from "./ToolButton";

const tools = [
  { id: "ai", label: "AI", icon: <Wand2 size={15} />, badge: "AI" },
  { id: "templates", label: "Tpl", icon: <LayoutTemplate size={15} /> },
  { id: "text", label: "Text", icon: <Type size={15} /> },
  { id: "icons", label: "Elem", icon: <Star size={15} /> },
  { id: "images", label: "Img", icon: <Images size={15} /> },
  { id: "assets3d", label: "3D", icon: <Box size={15} /> },
  { id: "stickers", label: "Stick", icon: <Sparkles size={15} /> },
  { id: "layers", label: "Layer", icon: <Layers size={15} /> },
  { id: "upload", label: "Upload", icon: <Image size={15} /> },
] as const;

type MobileToolbarProps = {
  open: boolean;
  panel: string;
  setOpen: (value: boolean) => void;
  setPanel: (value: string) => void;
  selected?: unknown;
};

function MobileToolbar({ open, panel, setOpen, setPanel }: MobileToolbarProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({ dragging: false, moved: false, startX: 0, scrollLeft: 0 });

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

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    dragRef.current = { dragging: true, moved: false, startX: event.clientX, scrollLeft: scroller.scrollLeft };
    scroller.setPointerCapture?.(event.pointerId);
  }, []);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;
    const drag = dragRef.current;
    if (!scroller || !drag.dragging) return;
    const deltaX = event.clientX - drag.startX;
    if (Math.abs(deltaX) > 5) {
      drag.moved = true;
      scroller.scrollLeft = drag.scrollLeft - deltaX;
    }
  }, []);

  const stopDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current.dragging = false;
    try { scrollerRef.current?.releasePointerCapture?.(event.pointerId); } catch {}
    window.setTimeout(() => { dragRef.current.moved = false; }, 80);
  }, []);

  // Hard rule for mobile UX: while a panel is open, the bottom toolbar must not render at all.
  // This avoids visual overlap, pointer hit-boxes, and extra mobile rendering work.
  if (open) return null;

  return (
    <div data-mynify-mobile-toolbar="true" className="mynify-mobile-toolbar fixed inset-x-0 bottom-0 z-50 md:hidden pointer-events-none">
      <div className="mx-auto max-w-[640px] px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] pointer-events-auto">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white/96 text-slate-900 shadow-[0_-2px_8px_rgba(15,23,42,0.06)]">
          <div
            ref={scrollerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDrag}
            onPointerCancel={stopDrag}
            className="overflow-x-auto overscroll-x-contain px-1 py-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden select-none touch-pan-x"
          >
            <div className="flex min-w-max items-center gap-0.5">
              {tools.map((tool) => (
                <ToolButton key={tool.id} active={open && panel === tool.id} icon={tool.icon} label={tool.label} badge={"badge" in tool ? tool.badge : undefined} onClick={() => openPanel(tool.id)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(MobileToolbar);
