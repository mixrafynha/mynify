"use client";

export default function ToolButton({
  icon,
  label,
  onClick,
  active,
  badge,
  disabled,
}: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex h-[62px] flex-col items-center justify-center gap-1.5
        rounded-2xl transition-all duration-200 active:scale-95

        ${
          active
            ? "bg-gradient-to-b from-violet-500/30 to-fuchsia-500/20 text-white shadow-[0_10px_30px_rgba(168,85,247,0.30)]"
            : "text-slate-300 hover:bg-white/[0.05]"
        }

        ${disabled ? "opacity-30" : ""}
      `}
    >
      {badge && (
        <span className="absolute right-2 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-violet-500 px-1 text-[9px] font-black text-white shadow">
          {badge}
        </span>
      )}

      <div
        className={`
          flex items-center justify-center transition-all
          ${active ? "scale-110 text-violet-300" : "text-slate-300"}
        `}
      >
        {icon}
      </div>

      <span
        className={`
          text-[10px] font-medium leading-none
          ${active ? "text-white" : "text-slate-400"}
        `}
      >
        {label}
      </span>
    </button>
  );
}