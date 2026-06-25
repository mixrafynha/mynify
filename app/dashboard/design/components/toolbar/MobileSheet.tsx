"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { X, Sparkles, ChevronUp, ChevronDown } from "lucide-react";

const PanelLoading = () => (
  <div className="flex min-h-[140px] items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.035] text-xs font-black uppercase tracking-[0.16em] text-slate-400">
    Loading
  </div>
);

const TemplatesPanel = dynamic(() => import("./panels/TemplatesPanel"), { loading: PanelLoading });
const TextPanel = dynamic(() => import("./panels/TextPanel"), { loading: PanelLoading });
const UploadPanel = dynamic(() => import("./panels/UploadPanel"), { loading: PanelLoading });
const StickersPanel = dynamic(() => import("./panels/StickersPanel"), { loading: PanelLoading });
const IconsPanel = dynamic(() => import("./panels/IconsPanel"), { loading: PanelLoading });
const ImageTemplatesPanel = dynamic(() => import("./panels/ImageTemplatesPanel"), { loading: PanelLoading });
const Assets3DPanel = dynamic(() => import("./panels/Assets3DPanel"), { loading: PanelLoading });
const AiPanel = dynamic(() => import("./panels/AiPanel"), { loading: PanelLoading });
const LayersPanel = dynamic(() => import("./panels/LayersPanel"), { loading: PanelLoading });

const TOOLBAR_HEIGHT = 86;

type SheetSize = "peek" | "mid" | "full";

const SHEET_HEIGHTS: Record<SheetSize, string> = {
  peek: "24dvh",
  mid: "46dvh",
  full: "72dvh",
};

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

function MobileSheet({
  open,
  panel,
  setOpen,
  selected,
  onUpload,
  onAddText,
  createElement,
  updateSelected,
  deleteSelected,
  elements = [],
  updateElement,
  deleteElement,
}: MobileSheetProps) {
  const [sheetSize, setSheetSize] = useState<SheetSize>("mid");

  const dragStartY = useRef(0);
  const dragging = useRef(false);

  const close = useCallback(() => setOpen(false), [setOpen]);

  const createAiElement = useCallback(
    (element: any) => {
      createElement?.(element);
      setOpen(false);
    },
    [createElement, setOpen]
  );

  const expandSheet = useCallback(() => {
    setSheetSize((current) => {
      if (current === "peek") return "mid";
      if (current === "mid") return "full";
      return "full";
    });
  }, []);

  const shrinkSheet = useCallback(() => {
    setSheetSize((current) => {
      if (current === "full") return "mid";
      if (current === "mid") return "peek";
      return "peek";
    });
  }, []);

  const toggleSheet = useCallback(() => {
    setSheetSize((current) => (current === "full" ? "peek" : "full"));
  }, []);

  const onHandlePointerDown = useCallback((event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();

    dragging.current = true;
    dragStartY.current = event.clientY;

    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const onHandlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!dragging.current) return;

      event.preventDefault();
      event.stopPropagation();

      const diff = event.clientY - dragStartY.current;

      if (diff < -18) {
        expandSheet();
        dragStartY.current = event.clientY;
      }

      if (diff > 18) {
        shrinkSheet();
        dragStartY.current = event.clientY;
      }
    },
    [expandSheet, shrinkSheet]
  );

  const onHandlePointerUp = useCallback((event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();

    dragging.current = false;

    event.currentTarget.releasePointerCapture?.(event.pointerId);
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

    if (panel === "images") {
      return <ImageTemplatesPanel createElement={createElement} />;
    }

    if (panel === "assets3d") {
      return <Assets3DPanel createElement={createElement} />;
    }

    if (panel === "ai") {
      return <AiPanel createElement={createAiElement} />;
    }

    if (panel === "layers") {
      return <LayersPanel elements={elements} selected={selected} updateElement={updateElement} deleteElement={deleteElement} />;
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
    elements,
    updateElement,
    deleteElement,
  ]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close mobile sheet overlay"
        onClick={close}
        className="fixed inset-0 z-30 bg-black/15 md:hidden"
      />

      <section
        className="
          fixed inset-x-0 bottom-0 z-40 md:hidden
          overflow-hidden rounded-t-[20px]
          border-t border-white/10
          bg-[#090a14]/96 text-white
          shadow-[0_-8px_24px_rgba(0,0,0,0.32)]
          backdrop-blur-md
          transition-[height] duration-200 ease-out
        "
        style={{
          height: `min(${SHEET_HEIGHTS[sheetSize]}, 620px)`,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="relative border-b border-white/10 bg-[#101124]/80 px-3 pb-1.5 pt-1.5">
          <div
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerUp}
            className="
              relative mx-auto mb-1
              flex h-7 w-full max-w-[220px]
              touch-none select-none
              items-center justify-center
            "
          >
            <div className="h-1.5 w-14 rounded-full bg-white/35" />
          </div>

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-violet-200 ring-1 ring-white/10">
                <Sparkles size={16} />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-[15px] font-black leading-none tracking-[-0.04em] text-white">
                  {getTitle(panel)}
                </h2>

                <p className="mt-1 truncate text-[10px] font-semibold text-slate-400">
                  {getSubtitle(panel)}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={toggleSheet}
                aria-label="Expand panel"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.08] text-white ring-1 ring-white/10 active:scale-95"
              >
                {sheetSize === "full" ? (
                  <ChevronDown size={17} />
                ) : (
                  <ChevronUp size={17} />
                )}
              </button>

              <button
                type="button"
                onClick={close}
                aria-label="Close panel"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.08] text-white ring-1 ring-white/10 active:scale-95"
              >
                <X size={17} />
              </button>
            </div>
          </div>
        </div>

        <div
          className="
            h-[calc(100%-62px)]
            overflow-y-auto
            overflow-x-hidden
            overscroll-contain
            touch-pan-y
            px-2.5 py-2
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
          style={{
            WebkitOverflowScrolling: "touch",
            paddingBottom: `calc(${TOOLBAR_HEIGHT}px + env(safe-area-inset-bottom))`,
          }}
        >
          <div className="mx-auto w-full max-w-[720px]">
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
    <div className="flex min-h-[130px] flex-col items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.035] px-5 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/15 text-xl text-violet-200">
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
    ai: "AI",
    stickers: "Stickers",
    icons: "Elements",
    images: "Images",
    assets3d: "3D Assets",
    layers: "Layers",
  };

  return titles[panel] || "Editor";
}

function getSubtitle(panel: string) {
  const subtitles: Record<string, string> = {
    templates: "Browse layouts",
    text: "Text tools",
    upload: "Add image",
    ai: "Generate graphics",
    stickers: "Browse stickers",
    icons: "Browse elements",
    images: "Image templates",
    assets3d: "3D graphics",
  };

  return subtitles[panel] || "Premium editor";
}