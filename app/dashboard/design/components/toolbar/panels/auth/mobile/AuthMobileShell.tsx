"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  children: ReactNode;
  onClose: () => void;
};

export default function AuthMobileShell({ children, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[9999] flex bg-[#03030a] text-white sm:hidden" role="dialog" aria-modal="true">
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.24),transparent_38%),#03030a]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08] text-white/80 ring-1 ring-white/10 transition active:scale-95"
        >
          <X size={19} />
        </button>

        <div className="flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-[calc(env(safe-area-inset-top)+28px)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
