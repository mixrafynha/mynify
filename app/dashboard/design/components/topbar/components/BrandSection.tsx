"use client";

import { memo } from "react";
import { LogOut } from "lucide-react";

function BrandSection() {
  function leaveEditor() {
    const ok = window.confirm("Leave editor? Unsaved changes may be lost.");
    if (!ok) return;

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <button
      type="button"
      onClick={leaveEditor}
      className="group flex min-w-0 shrink-0 touch-manipulation items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.035] px-1.5 py-1 transition hover:border-white/15 hover:bg-white/[0.07] active:scale-[0.97] sm:gap-2 sm:px-2"
      aria-label="Leave editor"
      title="Leave editor"
    >
      <span className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.10] bg-white text-black shadow-[0_8px_22px_rgba(0,0,0,.22)] sm:h-8 sm:w-8 sm:rounded-xl">
        <img
          src="/favicon.ico"
          alt="RYFIO"
          className="h-full w-full object-contain p-0.5"
          draggable={false}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      </span>

      <span className="hidden select-none text-[18px] font-black uppercase leading-none tracking-[-0.055em] text-white xl:inline-flex">
        <span>R</span>
        <span className="bg-gradient-to-r from-violet-200 via-fuchsia-300 to-cyan-200 bg-clip-text text-transparent">
          YFIO
        </span>
      </span>

      <LogOut size={13} className="hidden text-white/35 transition group-hover:text-white/70 sm:block" />
    </button>
  );
}

export default memo(BrandSection);
