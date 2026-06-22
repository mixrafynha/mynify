"use client";

import { memo } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import type { PreviewValidationResult } from "./types/preview";

function statusClass(status: PreviewValidationResult["status"]) {
  if (status === "ready") {
    return "border-emerald-300/25 bg-emerald-400/12 text-emerald-100";
  }

  if (status === "needs_attention") {
    return "border-amber-300/25 bg-amber-400/12 text-amber-100";
  }

  return "border-rose-300/25 bg-rose-500/15 text-rose-100";
}

function PreviewHeader({
  status,
  onClose,
}: {
  status: PreviewValidationResult;
  onClose: () => void;
}) {
  const Icon = status.status === "ready" ? CheckCircle2 : ShieldAlert;

  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#070711]/84 px-4 py-3 backdrop-blur-xl sm:px-5">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 shadow-[0_14px_34px_rgba(168,85,247,.32)]">
            <Sparkles size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-black tracking-[-.04em] text-white sm:text-xl">
              Production Preview
            </h2>
            <p className="hidden text-[11px] font-semibold text-white/45 sm:block">
              On-model clean mockup, print data and production validation.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-black sm:px-3 sm:text-xs ${statusClass(
            status.status,
          )}`}
        >
          <Icon size={14} />
          <span className="hidden sm:inline">{status.statusLabel}</span>
          <span className="sm:hidden">
            {status.status === "ready" ? "Ready" : "Check"}
          </span>
        </span>

        <button
          type="button"
          onClick={onClose}
          className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[.045] text-white/70 transition hover:bg-white/[.08] sm:flex"
          aria-label="Close preview"
        >
          <X size={17} />
        </button>

        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[.045] text-white/70 sm:hidden"
          aria-label="Close preview"
        >
          <ChevronDown size={20} />
        </button>
      </div>
    </header>
  );
}

export default memo(PreviewHeader);
