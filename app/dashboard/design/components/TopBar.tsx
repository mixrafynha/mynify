"use client";

import {
  Monitor,
  Layers,
  ZoomIn,
  ZoomOut,
  Eye,
  Save,
} from "lucide-react";

export default function TopBar({
  side,
  setSide,
  zoomIn,
  zoomOut,
  onSaveDesign,
  onPreviewDesign,
  saving,
}: any) {
  const btn =
    "w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg transition hover:bg-black/5 active:scale-95";

  return (
    <div className="w-full flex items-center justify-center px-2 sm:px-6 py-2 sm:py-3">
      <div
        className="
          flex items-center justify-center sm:justify-between
          gap-1 sm:gap-3 w-full max-w-[900px]
          px-2 sm:px-4 py-1 sm:py-2
          bg-white/60 backdrop-blur-md
          border border-black/10
          rounded-2xl shadow-sm
        "
      >
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setSide("front")}
            className={`${btn} ${side === "front" ? "bg-black/5" : ""}`}
          >
            <Monitor size={18} />
          </button>

          <button
            type="button"
            onClick={() => setSide("back")}
            className={`${btn} ${side === "back" ? "bg-black/5" : ""}`}
          >
            <Layers size={18} />
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button type="button" onClick={zoomOut} className={btn}>
            <ZoomOut size={18} />
          </button>

          <div className="hidden sm:block w-px h-6 bg-black/10 mx-1" />

          <button type="button" onClick={zoomIn} className={btn}>
            <ZoomIn size={18} />
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={onSaveDesign}
            disabled={saving}
            className={`${btn} bg-black text-white hover:bg-black disabled:opacity-40`}
          >
            <Save size={18} />
          </button>

          <button
            type="button"
            onClick={onPreviewDesign}
            disabled={saving}
            className={btn}
          >
            <Eye size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
