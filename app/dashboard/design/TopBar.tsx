"use client";

import {
  Monitor,
  Layers,
  ZoomIn,
  ZoomOut,
  Eye,
  Save,
  Undo2,
  Redo2,
  RotateCcw,
} from "lucide-react";

interface TopBarProps {
  side: "front" | "back";
  setSide: (side: "front" | "back") => void;
  zoomIn: () => void;
  zoomOut: () => void;
  onSaveDesign: () => void;
  onPreviewDesign: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  saving?: boolean;
}

export default function TopBar({
  side,
  setSide,
  zoomIn,
  zoomOut,
  onSaveDesign,
  onPreviewDesign,
  onUndo,
  onRedo,
  saving,
}: TopBarProps) {
  const btn =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/70 transition-all duration-200 active:scale-95 hover:bg-white/10 hover:text-white sm:h-10 sm:w-10 sm:rounded-xl";

  const active =
    "bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 text-purple-300 shadow-[0_0_18px_rgba(168,85,247,0.35)]";

  const nextSide = side === "front" ? "back" : "front";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#03030a]/95 backdrop-blur-2xl">
      <div className="flex h-14 w-full items-center justify-between gap-2 px-2 sm:h-16 sm:px-4">
        <div className="flex min-w-0 items-center">
          <h1 className="select-none text-[22px] font-black uppercase leading-none tracking-[-0.04em] sm:text-[38px]">
            <span className="text-white">MY</span>
            <span className="bg-gradient-to-r from-violet-300 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
              NIFY
            </span>
          </h1>
        </div>

        <div className="flex flex-1 items-center justify-center gap-1 overflow-x-auto px-1 scrollbar-hide">
          <button
            type="button"
            onClick={() => setSide(nextSide)}
            className={`${btn} ${active}`}
            title={side === "front" ? "Back" : "Front"}
          >
            {side === "front" ? <Monitor size={17} /> : <Layers size={17} />}
          </button>

          <div className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />

          <button type="button" onClick={zoomOut} className={btn} title="Zoom out">
            <ZoomOut size={17} />
          </button>

          <button type="button" onClick={zoomIn} className={btn} title="Zoom in">
            <ZoomIn size={17} />
          </button>

          <div className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />

          <button
            type="button"
            onClick={onUndo}
            disabled={!onUndo}
            className={`${btn} disabled:pointer-events-none disabled:opacity-30`}
            title="Undo"
          >
            <Undo2 size={17} />
          </button>

          <button
            type="button"
            onClick={onRedo}
            disabled={!onRedo}
            className={`${btn} disabled:pointer-events-none disabled:opacity-30`}
            title="Redo"
          >
            <Redo2 size={17} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPreviewDesign}
            disabled={saving}
            className={`${btn} disabled:opacity-40`}
            title="Preview"
          >
            <Eye size={17} />
          </button>

          <button
            type="button"
            onClick={onSaveDesign}
            disabled={saving}
            className="
              flex h-8 min-w-8 items-center justify-center gap-2 rounded-lg
              bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500
              px-2 text-white shadow-[0_0_24px_rgba(168,85,247,0.4)]
              transition-all duration-200 active:scale-95 disabled:opacity-40
              sm:h-10 sm:rounded-xl sm:px-4
            "
            title="Save"
          >
            {saving ? <RotateCcw size={16} className="animate-spin" /> : <Save size={16} />}

            <span className="hidden text-sm font-black md:block">
              {saving ? "Saving..." : "Save"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}