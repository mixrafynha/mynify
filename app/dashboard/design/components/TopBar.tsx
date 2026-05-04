"use client";

import {
  Monitor,
  Layers,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
} from "lucide-react";

export default function TopBar({
  side,
  setSide,
  zoomIn,
  zoomOut,
  preview,
  setPreview,
  setUiHidden,
}: any) {
  const btn =
    "w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg transition hover:bg-black/5 active:scale-95";

  const togglePreview = () => {
    const newState = !preview;
    setPreview(newState);
    setUiHidden(newState);
  };

  return (
    <div className="w-full flex items-center justify-center px-2 sm:px-6 py-2 sm:py-3">

      {/* ================= TOOLBAR ================= */}
      <div
        className="
        flex items-center 
        justify-center sm:justify-between   /* 👈 KEY FIX */
        gap-1 sm:gap-3

        w-full max-w-[900px]
        px-2 sm:px-4 py-1 sm:py-2

        bg-white/60 backdrop-blur-md
        border border-black/10
        rounded-2xl shadow-sm
      "
      >

        {/* ================= LEFT ================= */}
        <div className="flex items-center gap-1 sm:gap-2">

          <button
            onClick={() => setSide("front")}
            className={`${btn} ${side === "front" ? "bg-black/5" : ""}`}
          >
            <Monitor size={18} />
          </button>

          <button
            onClick={() => setSide("back")}
            className={`${btn} ${side === "back" ? "bg-black/5" : ""}`}
          >
            <Layers size={18} />
          </button>

        </div>

        {/* ================= CENTER ================= */}
        <div className="flex items-center gap-1 sm:gap-2">

          <button onClick={zoomOut} className={btn}>
            <ZoomOut size={18} />
          </button>

          <div className="hidden sm:block w-px h-6 bg-black/10 mx-1" />

          <button onClick={zoomIn} className={btn}>
            <ZoomIn size={18} />
          </button>

        </div>

        {/* ================= RIGHT ================= */}
        <div className="flex items-center gap-1 sm:gap-2">

          <button
            onClick={togglePreview}
            className={`${btn} ${preview ? "bg-black/5" : ""}`}
          >
            {preview ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>

        </div>

      </div>
    </div>
  );
}