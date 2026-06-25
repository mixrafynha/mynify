"use client";

import { memo } from "react";
import { Layers, Shirt } from "lucide-react";
import type { EditorSide } from "../types";

interface SideSwitcherProps {
  side: EditorSide;
  setSide: (side: EditorSide) => void;
  disabled?: boolean;
}

function SideSwitcher({ side, setSide, disabled }: SideSwitcherProps) {
  const nextSide: EditorSide = side === "front" ? "back" : "front";

  return (
    <div className="flex shrink-0 items-center">
      <button
        type="button"
        onClick={() => setSide(nextSide)}
        disabled={disabled}
        className="flex h-8 min-w-[42px] touch-manipulation items-center justify-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.045] px-1.5 text-[0] font-black uppercase tracking-[0.05em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:bg-white/[0.08] active:scale-[0.95] disabled:pointer-events-none disabled:opacity-40 sm:hidden"
        title={`Current side: ${side}. Tap to switch to ${nextSide}.`}
        aria-label={`Current side: ${side}. Tap to switch to ${nextSide}.`}
      >
        {side === "front" ? <Shirt size={15} /> : <Layers size={15} />}
        <span className="text-[9px]">{side === "front" ? "F" : "B"}</span>
      </button>

      <div className="hidden h-9 grid-cols-2 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:grid">
        {(["front", "back"] as EditorSide[]).map((value) => {
          const active = side === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setSide(value)}
              disabled={disabled}
              className={`flex h-7 min-w-[62px] touch-manipulation items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-black uppercase tracking-[0.07em] transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 md:min-w-[76px] ${
                active
                  ? "bg-white text-[#080812] shadow-[0_8px_18px_rgba(255,255,255,0.12)]"
                  : "text-white/55 hover:bg-white/[0.07] hover:text-white"
              }`}
              title={`Show ${value}`}
              aria-label={`Show ${value}`}
            >
              {value === "front" ? <Shirt size={12} /> : <Layers size={12} />}
              <span>{value}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(SideSwitcher);
