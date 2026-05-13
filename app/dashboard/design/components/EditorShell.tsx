"use client";

export default function EditorShell({
  sidebar,
  topbar,
  canvas,
  toolbar,
}: any) {
  return (
    <div className="h-screen w-full overflow-hidden bg-[#070711] text-white">
      <div className="hidden h-full w-full flex-col overflow-hidden md:flex">
        <div className="h-[52px] shrink-0">{topbar}</div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          {toolbar}

          <main className="relative min-w-0 flex-1 overflow-hidden bg-[#070711]">
            {canvas}
          </main>

          {sidebar}
        </div>
      </div>

      <div className="flex h-full flex-col overflow-hidden md:hidden">
        <div className="shrink-0">{topbar}</div>

        <section className="relative min-h-0 flex-1 overflow-hidden bg-[#070711]">
          {canvas}
        </section>

        {toolbar}
      </div>
    </div>
  );
}