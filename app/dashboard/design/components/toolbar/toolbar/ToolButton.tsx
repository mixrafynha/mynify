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
          relative
          flex shrink-0
          flex-col items-center
          justify-center gap-[2px]

          h-[56px]
          min-w-[62px]
          px-2

          rounded-[20px]

          select-none
          touch-manipulation

          transition-colors
          duration-150

          active:scale-[0.98]
          will-change-transform
        `,
        active
          ? `
            bg-cyan-300
            text-slate-950
            shadow-[0_12px_28px_rgba(34,211,238,0.22)]
          `
          : `
            bg-white/[0.055]
            text-slate-100
            ring-1 ring-white/10
            active:bg-white/[0.1]
          `,
        disabled &&
          "pointer-events-none opacity-35 saturate-0"
      )}
    >
      {badge && (
        <span
          className="
            absolute right-1.5 top-1
            rounded-full
            bg-gradient-to-r
            from-cyan-500 to-blue-500
            px-1.5 py-[2px]
            text-[8px]
            font-black
            text-white
          "
        >
          {badge}
        </span>
      )}

      <div
        className={clsx(
          `
            flex items-center justify-center
            transition-colors
            duration-150
          `,
          active
            ? "text-slate-950"
            : "text-slate-100"
        )}
      >
        {icon}
      </div>

      <span
        className={clsx(
          `
            max-w-[58px]
            truncate
            text-[10px]
            font-bold
            leading-none
            transition-colors
            duration-150
          `,
          active
            ? "text-slate-950"
            : "text-slate-200"
        )}
      >
        {label}
      </span>
    </button>
  );
}