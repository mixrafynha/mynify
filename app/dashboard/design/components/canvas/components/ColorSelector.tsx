"use client";

import { memo } from "react";
import { Palette } from "lucide-react";

interface ColorSelectorProps {
  mockupColor: string;
  setMockupColor?: (color: string) => void;
  showColors: boolean;
  setShowColors: (show: boolean) => void;
  availableColors: { name: string; hex: string }[];
}

function ColorSelector({
  mockupColor,
  setMockupColor,
  showColors,
  setShowColors,
  availableColors,
}: ColorSelectorProps) {
  return (
    <div className="absolute left-3 top-3 z-[72] md:left-4 md:top-4" onPointerDown={(e) => e.stopPropagation()}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowColors(!showColors)}
          className="flex h-8 items-center gap-1.5 rounded-xl border border-white/10 bg-[#090914]/88 px-2 text-[10px] font-black uppercase tracking-[0.08em] text-white/78 shadow-[0_12px_34px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:border-violet-300/35 hover:bg-white/[0.08] active:scale-95 md:h-8 md:px-2.5"
          title="Change product color"
        >
          <Palette size={13} />
          <span
            className="h-3.5 w-3.5 rounded-full border border-white/35"
            style={{ backgroundColor: mockupColor }}
          />
          <span className="hidden sm:inline">Color</span>
        </button>

        {showColors && (
          <div className="absolute left-0 top-10 w-[210px] overflow-hidden rounded-2xl border border-white/10 bg-[#070711]/95 p-2 text-white shadow-[0_24px_70px_rgba(0,0,0,0.48)] backdrop-blur-xl">
            <div className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/42">Product color</div>
            <div className="grid grid-cols-6 gap-1.5">
              {(availableColors || []).map((color) => {
                const selected = color.hex.toLowerCase() === String(mockupColor).toLowerCase();
                return (
                  <button
                    key={`${color.name}-${color.hex}`}
                    type="button"
                    title={color.name}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => {
                      setMockupColor?.(color.hex);
                      setShowColors(false);
                    }}
                    className={`relative h-7 w-7 rounded-full border transition active:scale-95 ${
                      selected ? "border-white ring-2 ring-violet-300/70" : "border-white/20 hover:border-white/60"
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    {selected && <span className="absolute inset-[3px] rounded-full border border-black/20" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ColorSelector);
