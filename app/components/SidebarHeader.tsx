import Image from "next/image";

export default function SidebarHeader({ expanded }: any) {
  return (
    <div className="relative flex items-center justify-center px-4 pb-8 pt-7">

      {/* PREMIUM GLOW */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.18),transparent_72%)]" />

      {expanded ? (
        <div className="relative flex w-full items-center gap-4 overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.035] px-4 py-4 shadow-[0_0_45px_rgba(168,85,247,0.10)] backdrop-blur-2xl">

          {/* LOGO CONTAINER */}
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#101018] to-[#0a0a12] shadow-[0_0_30px_rgba(168,85,247,0.20)]">

            {/* INNER GLOW */}
            <div className="absolute inset-0 rounded-2xl bg-purple-500/10 blur-xl" />

            <Image
              src="/logo.png"
              alt="Mynify"
              width={38}
              height={38}
              priority
              className="relative z-10 object-contain drop-shadow-[0_0_18px_rgba(168,85,247,0.55)]"
            />
          </div>

          {/* TEXT */}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[22px] font-black uppercase tracking-[-0.04em] text-white">
              MY
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
                NIFY
              </span>
            </h1>

            <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">
              AI CREATOR PLATFORM
            </p>
          </div>

          {/* STATUS DOT */}
          <div className="relative">
            <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.95)]" />
            <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60" />
          </div>
        </div>
      ) : (
        <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_0_30px_rgba(168,85,247,0.18)] backdrop-blur-xl">

          {/* GLOW */}
          <div className="absolute inset-0 bg-purple-500/10 blur-xl" />

          <Image
            src="/logo.png"
            alt="Mynify"
            width={34}
            height={34}
            priority
            className="relative z-10 object-contain drop-shadow-[0_0_16px_rgba(168,85,247,0.55)]"
          />
        </div>
      )}
    </div>
  );
}
