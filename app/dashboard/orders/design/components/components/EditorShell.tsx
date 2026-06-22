"use client";

import type { ReactNode } from "react";

type EditorShellProps = {
  sidebar?: ReactNode;
  topbar?: ReactNode;
  canvas?: ReactNode;
  toolbar?: ReactNode;
};

export default function EditorShell({
  sidebar,
  topbar,
  canvas,
  toolbar,
}: EditorShellProps) {
  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-[#070711] text-white">
      {/* Desktop */}
      <div className="hidden h-full w-full flex-col overflow-hidden md:flex">
        <div className="h-[52px] shrink-0">
          {topbar}
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          {toolbar}

          <main className="relative min-w-0 flex-1 overflow-hidden bg-[#070711]">
            {canvas}
          </main>

          {sidebar}
        </div>
      </div>

      {/* Mobile */}
      <div className="relative flex h-full flex-col overflow-hidden md:hidden">
        <div className="relative z-40 shrink-0">
          {topbar}
        </div>

        <section
          className="
            relative min-h-0 min-w-0
            flex-1 overflow-hidden
            bg-[#070711]
            pb-[74px]
          "
        >
          {canvas}
        </section>

        <div
          className="
            fixed inset-x-0 bottom-0
            z-[60]
            pointer-events-none
            will-change-transform
          "
        >
          <div className="pointer-events-auto">
            {toolbar}
          </div>
        </div>
      </div>
    </div>
  );
}