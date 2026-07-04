"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { X, ChevronUp, ChevronDown } from "lucide-react";

const PanelLoading = () => (
  <div className="flex min-h-[86px] items-center justify-center rounded-xl border border-violet-300/15 bg-violet-500/[0.06] text-[10px] font-black uppercase tracking-[0.14em] text-violet-200/70">
    Loading
  </div>
);

const TemplatesPanel = dynamic(() => import("./panels/TemplatesPanel"), { loading: PanelLoading });
const MobileTextPanel = dynamic(() => import("./panels/MobileTextPanel"), { loading: PanelLoading });
const UploadPanel = dynamic(() => import("./panels/UploadPanel"), { loading: PanelLoading });
const StickersPanel = dynamic(() => import("./panels/StickersPanel"), { loading: PanelLoading });
const IconsPanel = dynamic(() => import("./panels/IconsPanel"), { loading: PanelLoading });
const ImageTemplatesPanel = dynamic(() => import("./panels/ImageTemplatesPanel"), { loading: PanelLoading });
const Assets3DPanel = dynamic(() => import("./panels/Assets3DPanel"), { loading: PanelLoading });
const AiPanel = dynamic(() => import("./panels/AiPanel"), { loading: PanelLoading });
const LayersPanel = dynamic(() => import("./panels/LayersPanel"), { loading: PanelLoading });

const TOOLBAR_HEIGHT = 61;

type SheetSize = "peek" | "mid" | "full";

const SHEET_HEIGHTS: Record<SheetSize, string> = {
  peek: "16dvh",
  mid: "32dvh",
  full: "54dvh",
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

  useEffect(() => {
    if (!open || typeof document === "undefined") return;

    const previous = document.body.dataset.ryfioMobileSheetOpen;
    document.body.dataset.ryfioMobileSheetOpen = "true";

    return () => {
      if (previous === undefined) {
        delete document.body.dataset.ryfioMobileSheetOpen;
        return;
      }

      document.body.dataset.ryfioMobileSheetOpen = previous;
    };
  }, [open]);

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
      return <MobileTextPanel createElement={createElement} onAddText={onAddText} />;
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
      <style jsx global>{`
        body[data-ryfio-mobile-sheet-open="true"] [class*="z-[10000]"][class*="bottom-0"][class*="md:hidden"] {
          display: none !important;
          pointer-events: none !important;
        }
        body[data-ryfio-mobile-sheet-open="true"] {
          overscroll-behavior: none;
        }
        [data-ryfio-mobile-sheet="true"] * {
          -webkit-tap-highlight-color: transparent;
        }
        [data-ryfio-mobile-sheet-content="true"] > * {
          content-visibility: auto;
          contain-intrinsic-size: 280px;
        }
        [data-ryfio-mobile-sheet="true"] {
          --ryfio-panel-bg: #070817;
          --ryfio-panel-card: rgba(255,255,255,0.055);
          --ryfio-panel-card-strong: rgba(139,92,246,0.14);
          --ryfio-panel-border: rgba(196,181,253,0.16);
          --ryfio-panel-text: rgba(255,255,255,0.94);
          --ryfio-panel-muted: rgba(216,180,254,0.68);
        }
        [data-ryfio-mobile-sheet="true"] [class*="bg-white"],
        [data-ryfio-mobile-sheet="true"] [class*="bg-slate-100"],
        [data-ryfio-mobile-sheet="true"] [class*="bg-gray-"],
        [data-ryfio-mobile-sheet="true"] [class*="bg-zinc-"] {
          background-color: var(--ryfio-panel-card) !important;
        }
        [data-ryfio-mobile-sheet="true"] [class*="text-white"],
        [data-ryfio-mobile-sheet="true"] [class*="text-slate-900"],
        [data-ryfio-mobile-sheet="true"] [class*="text-gray-"],
        [data-ryfio-mobile-sheet="true"] [class*="text-zinc-"],
        [data-ryfio-mobile-sheet="true"] [class*="text-black"] {
          color: var(--ryfio-panel-text) !important;
        }
        [data-ryfio-mobile-sheet="true"] [class*="text-slate-400"],
        [data-ryfio-mobile-sheet="true"] [class*="text-slate-500"],
        [data-ryfio-mobile-sheet="true"] [class*="text-slate-600"],
        [data-ryfio-mobile-sheet="true"] [class*="text-white/"] {
          color: var(--ryfio-panel-muted) !important;
        }
        [data-ryfio-mobile-sheet="true"] [class*="border-white"],
        [data-ryfio-mobile-sheet="true"] [class*="border-slate"],
        [data-ryfio-mobile-sheet="true"] [class*="border-gray"],
        [data-ryfio-mobile-sheet="true"] [class*="border-zinc"] {
          border-color: var(--ryfio-panel-border) !important;
        }
        [data-ryfio-mobile-sheet="true"] [class*="ring-white"],
        [data-ryfio-mobile-sheet="true"] [class*="ring-slate"],
        [data-ryfio-mobile-sheet="true"] [class*="ring-gray"] {
          --tw-ring-color: var(--ryfio-panel-border) !important;
        }
        [data-ryfio-mobile-sheet="true"] input,
        [data-ryfio-mobile-sheet="true"] textarea,
        [data-ryfio-mobile-sheet="true"] select {
          background: rgba(255,255,255,0.055) !important;
          color: rgba(255,255,255,0.94) !important;
          border-color: rgba(196,181,253,0.16) !important;
        }
      `}</style>

      <button
        type="button"
        aria-label="Close mobile sheet overlay"
        onClick={close}
        className="fixed inset-0 z-30 bg-black/30 md:hidden"
      />

      <section
        data-ryfio-mobile-sheet="true"
        className="
          fixed inset-x-0 bottom-0 z-40 md:hidden
          overflow-hidden rounded-t-[18px]
          border-t border-violet-300/15
          bg-[#070817] text-white
          shadow-[0_-12px_34px_rgba(0,0,0,0.34),0_0_28px_rgba(124,58,237,0.12)]
          transition-[height] duration-150 ease-out
          will-change-[height]
        "
        style={{
          height: `min(${SHEET_HEIGHTS[sheetSize]}, 480px)`,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div
          className="relative touch-none select-none border-b border-violet-300/15 bg-[#090a1b]/95 px-3 py-0.5"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
        >
          <div className="relative mx-auto mb-0 flex h-2.5 w-full max-w-[150px] items-center justify-center">
            <div className="h-0.5 w-9 rounded-full bg-violet-300/45" />
          </div>

          <div className="relative flex h-7 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-[13px] font-black leading-none tracking-[-0.02em] text-white">
                  {getTitle(panel)}
                </h2>

                <p className="hidden">
                  {getSubtitle(panel)}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={toggleSheet}
                aria-label="Expand panel"
                className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/12 text-violet-100 ring-1 ring-violet-300/20 active:scale-95"
              >
                {sheetSize === "full" ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>

              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={close}
                aria-label="Close panel"
                className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/12 text-violet-100 ring-1 ring-violet-300/20 active:scale-95"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>

        <div
          className="
            overflow-y-auto
            overflow-x-hidden
            overscroll-contain
            touch-pan-y
            px-3
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
          style={{
            height: "calc(100% - 34px)",
            paddingTop: "6px",
            WebkitOverflowScrolling: "touch",
            paddingBottom: `calc(${TOOLBAR_HEIGHT}px + env(safe-area-inset-bottom))`,
          }}
        >
          <div data-ryfio-mobile-sheet-content="true" className="mx-auto w-full max-w-[720px]">
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
    <div className="flex min-h-[92px] flex-col items-center justify-center rounded-xl border border-violet-300/15 bg-violet-500/[0.06] px-3 text-center">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/15 text-xl text-violet-200">
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