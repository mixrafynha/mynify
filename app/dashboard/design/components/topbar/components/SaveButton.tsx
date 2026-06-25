"use client";

import { memo } from "react";
import { RotateCcw, Save } from "lucide-react";

interface SaveButtonProps {
  saving?: boolean;
  disabled?: boolean;
  onClick: () => void;
  compact?: boolean;
}

function SaveButton({ saving, disabled, onClick, compact }: SaveButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative flex shrink-0 touch-manipulation items-center justify-center overflow-hidden border border-white/10 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 text-white shadow-[0_10px_24px_rgba(168,85,247,0.22)] transition duration-150 hover:brightness-110 active:scale-[0.94] disabled:pointer-events-none disabled:opacity-40 ${
        compact ? "h-7 w-7 rounded-lg p-0 sm:h-8 sm:w-8 sm:rounded-xl md:h-9 md:w-9" : "h-10 min-w-[92px] rounded-2xl px-3.5"
      }`}
      title="Save"
      aria-label="Save"
    >
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.22),transparent)] opacity-35" />
      {saving ? <RotateCcw size={compact ? 13 : 16} className="relative animate-spin" /> : <Save size={compact ? 13 : 16} className="relative" />}
      {!compact && (
        <span className="relative ml-2 text-[12px] font-black tracking-[-0.02em]">
          {saving ? "Saving" : "Save"}
        </span>
      )}
    </button>
  );
}

export default memo(SaveButton);
