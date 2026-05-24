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
        `
          relative flex h-[60px] w-[74px]
          shrink-0 flex-col items-center
          justify-center gap-1 rounded-2xl
          border transition-all duration-200
          active:scale-[0.97]
        `,
        active
          ? `
            border-cyan-400/40
            bg-cyan-500/15
            text-cyan-200
            shadow-[0_0_22px_rgba(14,165,233,0.24)]
          `
          : `
            border-white/10
            bg-white/[0.05]
            text-slate-100
            hover:bg-white/[0.10]
            active:bg-white/[0.12]
          `,
        disabled &&
          "pointer-events-none opacity-35 saturate-0"
      )}
    >
      {badge && (
        <span
          className="
            absolute right-2 top-1
            rounded-full
            bg-gradient-to-r
            from-cyan-500 to-blue-500
            px-1.5 py-[2px]
            text-[9px] font-black
            text-white
            shadow-[0_0_14px_rgba(14,165,233,0.45)]
          "
        >
          {badge}
        </span>
      )}

      <div
        className={clsx(
          "flex items-center justify-center transition-colors",
          active
            ? "text-cyan-200"
            : "text-slate-100"
        )}
      >
        {icon}
      </div>

      <span
        className={clsx(
          "max-w-[68px] truncate text-[11px] font-bold transition-colors",
          active
            ? "text-cyan-100"
            : "text-slate-200"
        )}
      >
        {label}
      </span>
    </button>
  );
}