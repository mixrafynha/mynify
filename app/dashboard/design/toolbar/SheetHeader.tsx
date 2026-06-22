"use client";

import { X, ChevronUp, ChevronDown } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  expanded?: boolean;

  onToggle?: () => void;

  onHandlePointerDown?: (
    event: React.PointerEvent<HTMLDivElement>
  ) => void;

  onHandlePointerMove?: (
    event: React.PointerEvent<HTMLDivElement>
  ) => void;

  onHandlePointerUp?: (
    event: React.PointerEvent<HTMLDivElement>
  ) => void;
};

export default function SheetHeader({
  title,
  subtitle,
  onClose,
  expanded = false,
  onToggle,
  onHandlePointerDown,
  onHandlePointerMove,
  onHandlePointerUp,
}: Props) {
  return (
    <div className="border-b border-white/10 bg-[#101124]/92 px-4 pb-2 pt-2">
      {/* HANDLE DRAG */}
      <div
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={onHandlePointerUp}
        className="
          mx-auto mb-2
          flex h-8 w-full max-w-[220px]
          touch-none select-none
          items-center justify-center
        "
      >
        <div className="h-1.5 w-14 rounded-full bg-white/30" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-[18px] font-black text-white">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 truncate text-[11px] font-medium text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggle}
            className="
              flex h-9 w-9
              items-center justify-center
              rounded-full
              bg-white/[0.08]
              text-white/80
              active:scale-95
            "
          >
            {expanded ? (
              <ChevronDown size={18} />
            ) : (
              <ChevronUp size={18} />
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="
              flex h-9 w-9
              items-center justify-center
              rounded-full
              bg-white/[0.08]
              text-white
              active:scale-95
            "
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}