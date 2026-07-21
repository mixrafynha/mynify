"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

type ToolButtonProps = {
  icon: ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  badge?: string;
  onClick?: () => void;
  compact?: boolean;
};

export default function ToolButton({ icon, label, active = false, disabled = false, badge, onClick, compact = false }: ToolButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "relative flex shrink-0 select-none flex-col items-center justify-center font-bold leading-none touch-manipulation transition-colors duration-75 active:scale-[0.98]",
        compact
          ? "h-[36px] min-w-[42px] gap-px rounded-[11px] px-1 text-[7.5px]"
          : "h-[38px] min-w-[44px] gap-0.5 rounded-lg px-1 text-[8px]",
        active
          ? compact
            ? "bg-violet-500/16 text-white ring-1 ring-violet-300/25"
            : "bg-gradient-to-b from-violet-500 to-fuchsia-600 text-white shadow-[0_0_14px_rgba(168,85,247,0.35)]"
          : "bg-transparent text-violet-100/75 active:bg-violet-500/12",
        disabled && "pointer-events-none opacity-35"
      )}
    >
      {badge && (
        <span className="absolute right-0.5 top-0.5 rounded-full bg-fuchsia-500 px-1 py-[1px] text-[7px] font-black text-white">
          {badge}
        </span>
      )}
      <span className={clsx("flex items-center justify-center", compact && "h-[22px] w-[26px] rounded-lg", compact && active && "bg-violet-400/14 text-violet-100", active ? "text-white" : "text-violet-100/75")}>{icon}</span>
      <span className={compact ? "max-w-[38px] truncate" : "max-w-[42px] truncate"}>{label}</span>
    </button>
  );
}
