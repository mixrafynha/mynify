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
    <div className="border-b border-white/10 bg-[#101124] px-2.5 py-1">
      {/* HANDLE DRAG */}
      <div
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={onHandlePointerUp}
        className="
          mx-auto mb-0.5
          flex h-5 w-full max-w-[160px]
          touch-none select-none
          items-center justify-center
        "
      >
        <div className="h-1 w-10 rounded-lg bg-white/30" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-[13px] font-black text-white">
            {title}
          </h2>

          {subtitle && (
            <p className="hidden text-[10px] font-medium text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggle}
            className="
              flex h-7 w-7
              items-center justify-center
              rounded-lg
              bg-white/[0.08]
              text-white/80
              active:scale-95
            "
          >
            {expanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronUp size={16} />
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="
              flex h-7 w-7
              items-center justify-center
              rounded-lg
              bg-white/[0.08]
              text-white
              active:scale-95
            "
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}