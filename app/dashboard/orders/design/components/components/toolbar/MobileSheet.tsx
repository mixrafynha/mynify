"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, ChevronUp, ChevronDown } from "lucide-react";

import TemplatesPanel from "./panels/TemplatesPanel";
import TextPanel from "./panels/TextPanel";
import UploadPanel from "./panels/UploadPanel";
import StickersPanel from "./panels/StickersPanel";
import IconsPanel from "./panels/IconsPanel";
import ImageTemplatesPanel from "./panels/ImageTemplatesPanel";
import Assets3DPanel from "./panels/Assets3DPanel";
import AiPanel from "./panels/AiPanel";
import LayersPanel from "./panels/LayersPanel";

type MobileSheetProps = {
  open: boolean;
  panel: string;
  setOpen: (value: boolean) => void;
  selected?: any;
  onUpload?: (file: File) => void;
  onAddText?: () => void;
  createElement?: (element: any) => void;
  updateSelected?: (patch: any) => void;
  deleteSelected?: () => void;
  elements?: any[];
  updateElement?: (id: string, patch: any) => void;
  deleteElement?: (id: string) => void;
  setSelectedId?: (id: string | null) => void;
  setSelectedElement?: (el: any | null) => void;
};

const MIN_HEIGHT = 16;
const DEFAULT_HEIGHT = 26;
const MAX_HEIGHT = 56;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function MobileSheet({
  open,
  panel,
  setOpen,
  selected,
  onUpload,
  onAddText,
  createElement,
  elements = [],
  updateElement,
  deleteElement,
}: MobileSheetProps) {
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const dragRef = useRef({ active: false, startY: 0, startHeight: DEFAULT_HEIGHT });

  const close = useCallback(() => setOpen(false), [setOpen]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    document.body.classList.add("mynify-mobile-panel-open");
    return () => document.body.classList.remove("mynify-mobile-panel-open");
  }, [open]);

  const createAiElement = useCallback(
    (element: any) => {
      createElement?.(element);
      setOpen(false);
    },
    [createElement, setOpen]
  );

  const expandSheet = useCallback(() => {
    setHeight((current) => clamp(current + 14, MIN_HEIGHT, MAX_HEIGHT));
  }, []);

  const shrinkSheet = useCallback(() => {
    setHeight((current) => clamp(current - 14, MIN_HEIGHT, MAX_HEIGHT));
  }, []);

  const toggleSheet = useCallback(() => {
    setHeight((current) => (current > 38 ? MIN_HEIGHT : MAX_HEIGHT));
  }, []);

  const onHandlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = { active: true, startY: event.clientY, startHeight: height };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, [height]);

  const onHandlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    event.preventDefault();
    event.stopPropagation();

    const viewportHeight = Math.max(window.innerHeight || 1, 1);
    const delta = ((dragRef.current.startY - event.clientY) / viewportHeight) * 100;
    setHeight(clamp(dragRef.current.startHeight + delta, MIN_HEIGHT, MAX_HEIGHT));
  }, []);

  const onHandlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current.active = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }, []);

  const content = useMemo(() => {
    if (panel === "templates") return <TemplatesPanel createElement={createElement} />;
    if (panel === "text") return <TextPanel createElement={createElement} onAddText={onAddText} />;
    if (panel === "upload") return <UploadPanel onUpload={onUpload} />;
    if (panel === "stickers") return <StickersPanel createElement={createElement} />;
    if (panel === "icons") return <IconsPanel createElement={createElement} />;
    if (panel === "images") return <ImageTemplatesPanel createElement={createElement} />;
    if (panel === "assets3d") return <Assets3DPanel createElement={createElement} />;
    if (panel === "ai") return <AiPanel createElement={createAiElement} />;
    if (panel === "layers") return <LayersPanel elements={elements} selected={selected} updateElement={updateElement} deleteElement={deleteElement} />;
    return <EmptyState />;
  }, [panel, selected, onUpload, onAddText, createElement, createAiElement, elements, updateElement, deleteElement]);

  if (!open) return null;

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          body.mynify-mobile-panel-open .mynify-mobile-toolbar,
          body.mynify-mobile-panel-open .mynify-mobile-edit-toolbar {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }
        }
      `}</style>
      <button
        type="button"
        aria-label="Close mobile sheet overlay"
        onClick={close}
        className="fixed inset-0 z-40 bg-transparent md:hidden"
      />

      <section
        className="fixed inset-x-0 bottom-0 z-50 md:hidden overflow-hidden rounded-t-xl border-t border-slate-200 bg-white text-slate-950 shadow-[0_-2px_8px_rgba(15,23,42,0.06)] will-change-[height]"
        style={{
          height: `min(${height}dvh, 420px)`,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="border-b border-slate-100 bg-white px-2 pb-0.5 pt-0">
          <div
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerUp}
            className="mx-auto flex h-4 w-full max-w-[160px] touch-none select-none items-center justify-center active:cursor-grabbing"
            role="separator"
            aria-label="Drag panel up or down"
          >
            <div className="h-1 w-12 rounded-full bg-slate-300" />
          </div>

          <div className="flex h-6 items-center justify-between gap-2">
            <h2 className="min-w-0 truncate text-[11px] font-extrabold leading-none tracking-[-0.02em] text-slate-900">
              {getTitle(panel)}
            </h2>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={shrinkSheet}
                aria-label="Make panel smaller"
                className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-slate-600 active:scale-95"
              >
                <ChevronDown size={12} />
              </button>

              <button
                type="button"
                onClick={expandSheet}
                onDoubleClick={toggleSheet}
                aria-label="Make panel bigger"
                className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-slate-600 active:scale-95"
              >
                <ChevronUp size={12} />
              </button>

              <button
                type="button"
                onClick={close}
                aria-label="Close panel"
                className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-slate-600 active:scale-95"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        </div>

        <div
          className="h-[calc(100%-34px)] overflow-y-auto overflow-x-hidden overscroll-contain px-2 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            WebkitOverflowScrolling: "touch",
            paddingBottom: "calc(0.35rem + env(safe-area-inset-bottom))",
          }}
        >
          <div className="mx-auto w-full max-w-[540px] text-slate-900 [&_.rounded-2xl]:rounded-xl [&_.p-4]:p-2 [&_.p-3]:p-2 [&_.gap-4]:gap-2 [&_.gap-3]:gap-2 [&_.text-sm]:text-xs [&_.text-lg]:text-sm">{content}</div>
        </div>
      </section>
    </>
  );
}

export default memo(MobileSheet);

function EmptyState() {
  return (
    <div className="flex min-h-[100px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-center">
      <h3 className="text-sm font-black text-slate-950">Select an element</h3>
      <p className="mt-1 max-w-[230px] text-xs font-medium leading-5 text-slate-500">Tap an item on the canvas to edit it.</p>
    </div>
  );
}

function getTitle(panel: string) {
  const titles: Record<string, string> = {
    templates: "Templates",
    text: "Text",
    upload: "Uploads",
    ai: "AI",
    stickers: "Stickers",
    icons: "Elements",
    images: "Images",
    assets3d: "3D Assets",
    layers: "Layers",
  };

  return titles[panel] || "Editor";
}
