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

export default function ToolButton({
  icon,
  label,
  active = false,
  disabled = false,
  badge,
  onClick,
}: ToolButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "relative flex h-[41px] min-w-[47px] shrink-0 select-none flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[8px] font-bold leading-none touch-manipulation transition-colors duration-75 active:scale-[0.99]",
        active
          ? "bg-gradient-to-b from-violet-500 to-fuchsia-600 text-white shadow-[0_0_14px_rgba(168,85,247,0.35)]"
          : "bg-transparent text-violet-100/75 active:bg-violet-500/12",
        disabled && "pointer-events-none opacity-35",
      )}
    >
      {badge && (
        <span className="absolute right-0.5 top-0.5 rounded-full bg-fuchsia-500 px-1 py-[1px] text-[7px] font-black text-white">
          {badge}
        </span>
      )}
      <span
        className={clsx(
          "flex items-center justify-center",
          active ? "text-white" : "text-violet-100/75",
        )}
      >
        {icon}
      </span>
      <span className="max-w-[45px] truncate">{label}</span>
    </button>
  );
}
