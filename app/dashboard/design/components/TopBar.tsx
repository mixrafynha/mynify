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
    "h-9 w-9 sm:h-10 sm:w-10 flex shrink-0 items-center justify-center rounded-xl text-white/70 transition-all duration-200 active:scale-95 hover:bg-white/10 hover:text-white";

  const active =
    "bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 text-purple-300 shadow-[0_0_18px_rgba(168,85,247,0.35)]";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#03030a]/95 backdrop-blur-2xl">
      <div className="flex h-16 w-full items-center justify-between px-2 sm:px-4">
        {/* LOGO */}
        <div className="flex items-center">
          <h1
            className="
              select-none
              text-[28px]
              font-black
              uppercase
              leading-none
              tracking-[-0.04em]
              sm:text-[38px]
            "
          >
            <span className="text-white">MY</span>
            <span className="bg-gradient-to-r from-violet-300 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
              NIFY
            </span>
          </h1>
        </div>

        {/* CENTER */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          <button
            type="button"
            onClick={() => setSide("front")}
            className={`${btn} ${side === "front" ? active : ""}`}
          >
            <Monitor size={18} />
          </button>

          <button
            type="button"
            onClick={() => setSide("back")}
            className={`${btn} ${side === "back" ? active : ""}`}
          >
            <Layers size={18} />
          </button>

          <div className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />

          <button type="button" onClick={zoomOut} className={btn}>
            <ZoomOut size={18} />
          </button>

          <button type="button" onClick={zoomIn} className={btn}>
            <ZoomIn size={18} />
          </button>

          <div className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />

          <button type="button" onClick={onUndo} className={btn}>
            <Undo2 size={18} />
          </button>

          <button type="button" onClick={onRedo} className={btn}>
            <Redo2 size={18} />
          </button>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPreviewDesign}
            disabled={saving}
            className={btn}
          >
            <Eye size={18} />
          </button>

          <button
            type="button"
            onClick={onSaveDesign}
            disabled={saving}
            className="
              flex h-9 items-center justify-center gap-2 rounded-xl
              bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500
              px-3 text-white shadow-[0_0_30px_rgba(168,85,247,0.45)]
              transition-all duration-200 active:scale-95
              disabled:opacity-40
              sm:h-10 sm:px-4
            "
          >
            <Save size={16} />

            <span className="hidden text-sm font-black sm:block">
              {saving ? "Saving..." : "Save"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}