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
};

export default function ToolButton({ icon, label, active = false, disabled = false, badge, onClick }: ToolButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "relative flex h-[46px] min-w-[52px] shrink-0 select-none flex-col items-center justify-center gap-1 rounded-xl px-1.5 text-[9px] font-bold leading-none touch-manipulation transition-colors duration-100 active:scale-[0.98]",
        active
          ? "bg-violet-500 text-white"
          : "bg-transparent text-slate-300 active:bg-white/[0.08]",
        disabled && "pointer-events-none opacity-35"
      )}
    >
      {badge && (
        <span className="absolute right-1 top-1 rounded-full bg-fuchsia-500 px-1.5 py-[1px] text-[8px] font-black text-white">
          {badge}
        </span>
      )}
      <span className={clsx("flex items-center justify-center", active ? "text-white" : "text-slate-300")}>{icon}</span>
      <span className="max-w-[48px] truncate">{label}</span>
    </button>
  );
}
