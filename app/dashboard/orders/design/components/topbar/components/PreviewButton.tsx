"use client";

import { memo } from "react";
import { Eye, RotateCcw } from "lucide-react";

interface PreviewButtonProps {
  previewing?: boolean;
  disabled?: boolean;
  onClick: () => void;
  compact?: boolean;
}

function PreviewButton({ previewing, disabled, onClick, compact }: PreviewButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title="Preview"
      aria-label="Preview"
      className={`relative flex shrink-0 touch-manipulation items-center justify-center overflow-hidden border border-cyan-300/22 bg-cyan-300/[0.10] text-cyan-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_10px_24px_rgba(34,211,238,0.14)] transition duration-150 hover:bg-cyan-300/[0.15] active:scale-[0.94] disabled:pointer-events-none disabled:opacity-40 ${
        compact ? "h-7 w-7 rounded-lg p-0 sm:h-8 sm:w-8 sm:rounded-xl md:h-9 md:w-9" : "h-10 min-w-[108px] rounded-2xl px-4"
      }`}
    >
      <span className="pointer-events-none absolute inset-x-1.5 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
      {previewing ? (
        <RotateCcw size={compact ? 13 : 18} className="relative animate-spin" />
      ) : (
        <Eye size={compact ? 13 : 18} className="relative" />
      )}
      {!compact && <span className="relative ml-2 text-[12px] font-black tracking-[-0.02em]">Preview</span>}
    </button>
  );
}

export default memo(PreviewButton);
