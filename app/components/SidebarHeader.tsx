import Image from "next/image";

export default function SidebarHeader({ expanded }: any) {
  return (
    <div className="relative flex items-center justify-center px-4 pb-7 pt-6">
      
      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.18),transparent_70%)]" />

      {expanded ? (
        <div className="relative flex items-center gap-3">

          {/* LOGO */}
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] shadow-[0_0_25px_rgba(168,85,247,0.25)] backdrop-blur-xl">
            <Image
              src="/favicon.ico"
              alt="Mynify"
              width={32}
              height={32}
              className="rounded-xl"
            />
          </div>

          {/* TEXT */}
          <div className="leading-tight">
            <h1 className="text-xl font-black tracking-tight text-white">
              MY
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
                NIFY
              </span>
            </h1>

            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/35">
              AI Creator Platform
            </p>
          </div>
        </div>
      ) : (
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] shadow-[0_0_25px_rgba(168,85,247,0.25)] backdrop-blur-xl">
          <Image
            src="/favicon.ico"
            alt="Mynify"
            width={28}
            height={28}
            className="rounded-xl"
          />
        </div>
      )}
    </div>
  );
}
