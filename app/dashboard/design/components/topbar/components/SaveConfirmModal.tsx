"use client";

import { memo } from "react";
import { Check, RotateCcw, X } from "lucide-react";

interface SaveConfirmModalProps {
  open: boolean;
  saving?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function SaveConfirmModal({ open, saving, onCancel, onConfirm }: SaveConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/72 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-[360px] overflow-hidden rounded-[28px] border border-white/10 bg-[#090914]/95 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.62)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-fuchsia-500/18 blur-3xl" />

        <h2 className="relative text-xl font-black tracking-[-0.04em] text-white">Save design?</h2>
        <p className="relative mt-2 text-sm leading-relaxed text-white/58">
          Do you want to save this design and update the product preview?
        </p>

        <div className="relative mt-5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/72 transition hover:bg-white/[0.08] active:scale-[0.98] disabled:opacity-40"
          >
            <X size={15} />
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-4 py-3 text-sm font-black text-white shadow-[0_14px_34px_rgba(168,85,247,0.28)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
          >
            {saving ? <RotateCcw size={15} className="animate-spin" /> : <Check size={15} />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(SaveConfirmModal);
