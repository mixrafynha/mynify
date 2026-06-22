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
        "relative flex h-11 min-w-[48px] shrink-0 select-none flex-col items-center justify-center gap-0.5 rounded-lg px-1.5 text-[9px] font-extrabold leading-none touch-manipulation transition-colors duration-100 active:scale-[0.97]",
        active
          ? "bg-white text-slate-950 shadow-sm"
          : "bg-transparent text-slate-500 active:bg-slate-100",
        disabled && "pointer-events-none opacity-35"
      )}
    >
      {badge && (
        <span className="absolute right-0.5 top-0.5 rounded-full bg-slate-950 px-1 py-[1px] text-[7px] font-black text-white">
          {badge}
        </span>
      )}
      <span className={clsx("flex h-4 items-center justify-center", active ? "text-slate-950" : "text-slate-500")}>{icon}</span>
      <span className="max-w-[46px] truncate">{label}</span>
    </button>
  );
}
