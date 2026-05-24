"use client";

import { memo, useCallback, useMemo, useRef } from "react";
import { X, Sparkles } from "lucide-react";

import TemplatesPanel from "./panels/TemplatesPanel";
import TextPanel from "./panels/TextPanel";
import UploadPanel from "./panels/UploadPanel";
import StickersPanel from "./panels/StickersPanel";
import IconsPanel from "./panels/IconsPanel";
import ColorsPanel from "./panels/ColorsPanel";
import EditPanel from "./panels/EditPanel";
import AiPanel from "./panels/AiPanel";

const TOOLBAR_HEIGHT = 86;

type MobileSheetProps = {
  open: boolean;
  panel: string;
  setOpen: (value: boolean) => void;
  selected?: any;
  onUpload?: (file: File) => void;
  onUploadClick?: () => void;
  onAddText?: () => void;
  createElement?: (element: any) => void;
  updateSelected?: (patch: any) => void;
  deleteSelected?: () => void;
};

function MobileSheet({
  open,
  panel,
  setOpen,
  selected,
  onUpload,
  onUploadClick,
  onAddText,
  createElement,
  updateSelected,
  deleteSelected,
}: MobileSheetProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({
    active: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  const close = useCallback(() => setOpen(false), [setOpen]);

  const createAiElement = useCallback(
    (element: any) => {
      createElement?.(element);
      setOpen(false);
    },
    [createElement, setOpen],
  );

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    dragRef.current = {
      active: true,
      startX: event.clientX,
      scrollLeft: scroller.scrollLeft,
      moved: false,
    };

    scroller.setPointerCapture?.(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;
    const drag = dragRef.current;

    if (!scroller || !drag.active) return;

    const deltaX = event.clientX - drag.startX;

    if (Math.abs(deltaX) > 4) {
      drag.moved = true;
      scroller.scrollLeft = drag.scrollLeft - deltaX;
    }
  }, []);

  const stopDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;

    dragRef.current.active = false;
    scroller?.releasePointerCapture?.(event.pointerId);
  }, []);

  const content = useMemo(() => {
    if (panel === "templates") {
      return <TemplatesPanel createElement={createElement} />;
    }

    if (panel === "text") {
      return <TextPanel createElement={createElement} onAddText={onAddText} />;
    }

    if (panel === "upload") {
      return <UploadPanel onUpload={onUpload} />;
    }

    if (panel === "stickers") {
      return <StickersPanel createElement={createElement} />;
    }

    if (panel === "icons") {
      return <IconsPanel createElement={createElement} />;
    }

    if (panel === "colors" || panel === "brand") {
      return <ColorsPanel selected={selected} updateSelected={updateSelected} />;
    }

    if (panel === "edit") {
      return selected ? (
        <EditPanel
          selected={selected}
          createElement={createElement}
          updateSelected={updateSelected}
          deleteSelected={deleteSelected}
        />
      ) : (
        <EmptyState />
      );
    }

    if (panel === "ai") {
      return <AiPanel createElement={createAiElement} />;
    }

    return <EmptyState />;
  }, [
    panel,
    selected,
    onUpload,
    onAddText,
    createElement,
    createAiElement,
    updateSelected,
    deleteSelected,
  ]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close mobile sheet overlay"
        onClick={close}
        className="fixed inset-0 z-30 bg-black/35 backdrop-blur-[2px] md:hidden"
      />

      <section
        className="
          fixed inset-x-0 bottom-0 z-40 md:hidden
          overflow-hidden rounded-t-[30px]
          border-t border-white/10
          bg-[#090a14]/95 text-white
          shadow-[0_-22px_70px_rgba(0,0,0,0.58)]
          backdrop-blur-3xl
        "
        style={{
          height: "min(68dvh, 590px)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="relative border-b border-white/10 bg-[#101124]/75 px-4 pb-3 pt-3">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.22),transparent_34%),radial-gradient(circle_at_90%_20%,rgba(6,182,212,0.11),transparent_32%)]" />

          <div className="relative mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/20" />

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/[0.08] text-violet-200 ring-1 ring-white/10">
                <Sparkles size={18} />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-[18px] font-black leading-none tracking-[-0.04em] text-white">
                  {getTitle(panel)}
                </h2>

                <p className="mt-1 truncate text-xs font-semibold text-slate-400">
                  {getSubtitle(panel)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={close}
              aria-label="Close panel"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/[0.08] text-white ring-1 ring-white/10 transition active:scale-95"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          className="
            h-full overflow-x-auto overflow-y-auto overscroll-contain
            px-3 py-3
            cursor-grab active:cursor-grabbing
            select-none touch-pan-x
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
          style={{
            WebkitOverflowScrolling: "touch",
            paddingBottom: `calc(${TOOLBAR_HEIGHT}px + env(safe-area-inset-bottom))`,
          }}
        >
          <div className="min-w-[680px] pr-3 sm:min-w-0 sm:pr-0">
            {content}
          </div>
        </div>
      </section>
    </>
  );
}

export default memo(MobileSheet);

function EmptyState() {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.035] px-5 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-2xl text-violet-200">
        ✨
      </div>

      <h3 className="text-sm font-black text-white">Select an element</h3>

      <p className="mt-1 max-w-[240px] text-xs font-medium leading-5 text-slate-400">
        Tap an item on the canvas to edit it.
      </p>
    </div>
  );
}

function getTitle(panel: string) {
  const titles: Record<string, string> = {
    templates: "Templates",
    text: "Text",
    upload: "Uploads",
    edit: "Edit",
    ai: "AI",
    stickers: "Stickers",
    icons: "Elements",
    colors: "Colors",
    brand: "Brand",
  };

  return titles[panel] || "Editor";
}

function getSubtitle(panel: string) {
  const subtitles: Record<string, string> = {
    templates: "Drag sideways to browse layouts",
    text: "Drag sideways to browse text tools",
    upload: "Add an image",
    edit: "Move sideways like a canvas",
    ai: "Generate graphics",
    stickers: "Drag sideways to browse stickers",
    icons: "Drag sideways to browse elements",
    colors: "Pick colors",
    brand: "Brand styles",
  };

  return subtitles[panel] || "Premium editor";
}
