"use client";

import { memo } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import { ZOOM_MAX, ZOOM_MIN, ZOOM_PRESETS, ZOOM_STEP } from "../constants";

interface ZoomSectionProps {
  zoom: number;
  setZoom: (zoom: number) => void;
  disabled?: boolean;
  mobile?: boolean;
}

function ZoomSection({ zoom, setZoom, disabled, mobile }: ZoomSectionProps) {
  if (mobile) {
    const mobileStep = zoom >= 200 ? 50 : ZOOM_STEP;
    return (
      <div className="flex h-12 items-center gap-1 rounded-[20px] border border-white/[0.08] bg-white/[0.055] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
        <button
          type="button"
          onClick={() => setZoom(zoom - mobileStep)}
          disabled={disabled}
          className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-2xl text-white/72 transition hover:bg-white/[0.08] active:scale-[0.96] disabled:opacity-35"
          aria-label="Zoom out"
        >
          <Minus size={18} />
        </button>

        <button
          type="button"
          onClick={() => setZoom(100)}
          disabled={disabled}
          className="flex h-10 min-w-[62px] touch-manipulation items-center justify-center rounded-2xl bg-black/24 px-3 text-[12px] font-black tabular-nums text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] active:scale-[0.97] disabled:opacity-35"
          aria-label="Reset zoom"
        >
          {zoom}%
        </button>

        <button
          type="button"
          onClick={() => setZoom(zoom + mobileStep)}
          disabled={disabled}
          className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-2xl text-white/72 transition hover:bg-white/[0.08] active:scale-[0.96] disabled:opacity-35"
          aria-label="Zoom in"
        >
          <Plus size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-2 rounded-[20px] border border-white/[0.08] bg-white/[0.045] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:flex">
      <button
        type="button"
        onClick={() => setZoom(zoom - ZOOM_STEP)}
        disabled={disabled}
        className="flex h-8 w-8 items-center justify-center rounded-xl text-white/62 transition hover:bg-white/[0.08] hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-35"
        title="Zoom out"
        aria-label="Zoom out"
      >
        <Minus size={16} />
      </button>

      <input
        type="range"
        min={ZOOM_MIN}
        max={ZOOM_MAX}
        step={5}
        value={zoom}
        disabled={disabled}
        onChange={(event) => setZoom(Number(event.target.value))}
        aria-label="Canvas zoom"
        className="h-1.5 w-[130px] cursor-pointer appearance-none rounded-full bg-white/15 accent-cyan-300 disabled:cursor-not-allowed disabled:opacity-45 lg:w-[180px] 2xl:w-[230px]"
      />

      <span className="w-11 text-right text-[11px] font-black tabular-nums text-white/66">{zoom}%</span>

      <button
        type="button"
        onClick={() => setZoom(zoom + ZOOM_STEP)}
        disabled={disabled}
        className="flex h-8 w-8 items-center justify-center rounded-xl text-white/62 transition hover:bg-white/[0.08] hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-35"
        title="Zoom in"
        aria-label="Zoom in"
      >
        <Plus size={16} />
      </button>

      <div className="ml-1 hidden items-center gap-1 xl:flex">
        {ZOOM_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setZoom(preset)}
            disabled={disabled}
            className={`h-8 rounded-xl px-2.5 text-[10px] font-black transition active:scale-95 ${
              zoom === preset
                ? "bg-cyan-400/16 text-cyan-100 ring-1 ring-cyan-300/25"
                : "text-white/48 hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            {preset}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setZoom(100)}
          disabled={disabled}
          className="flex h-8 items-center gap-1 rounded-xl px-2.5 text-[10px] font-black text-violet-100 transition hover:bg-violet-400/12 active:scale-95 disabled:opacity-35"
        >
          <Maximize2 size={12} /> Fit
        </button>
      </div>
    </div>
  );
}

export default memo(ZoomSection);
