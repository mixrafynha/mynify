"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  children: ReactNode;
  onClose: () => void;
};

export default function AuthDesktopShell({ children, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[9999] hidden items-center justify-center bg-black/70 p-6 text-white backdrop-blur-sm sm:flex" role="dialog" aria-modal="true">
      <div className="relative max-h-[calc(100vh-48px)] w-full max-w-[460px] overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.22),transparent_36%),#080811] shadow-2xl ring-1 ring-white/10">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-white/80 ring-1 ring-white/10 transition hover:bg-white/[0.12] active:scale-95"
        >
          <X size={18} />
        </button>

        <div className="max-h-[calc(100vh-48px)] overflow-y-auto px-7 pb-7 pt-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
