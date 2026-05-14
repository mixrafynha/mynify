"use client";

import clsx from "clsx";

export default function ToolButton({
  icon,
  label,
  active,
  disabled,
  badge,
  onClick,
}: any) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "relative flex h-[58px] w-[72px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl transition",
        active && "bg-slate-100",
        !active && "active:bg-slate-100",
        disabled && "opacity-35"
      )}
    >
      {badge && (
        <span className="absolute right-3 top-1 rounded-full bg-violet-600 px-1.5 py-[1px] text-[9px] font-black text-white">
          {badge}
        </span>
      )}

      <div
        className={clsx(
          "flex items-center justify-center",
          active ? "text-violet-600" : "text-slate-800"
        )}
      >
        {icon}
      </div>

      <span
        className={clsx(
          "max-w-[66px] truncate text-[11px] font-semibold",
          active ? "text-violet-600" : "text-slate-700"
        )}
      >
        {label}
      </span>
    </button>
  );
}