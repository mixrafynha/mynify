"use client";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden bg-[#03030a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(168,85,247,0.28),transparent_32%),radial-gradient(circle_at_65%_65%,rgba(14,165,233,0.16),transparent_28%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />

      <div className="relative flex flex-col items-center gap-6 rounded-[32px] border border-white/10 bg-white/[0.035] px-10 py-9 shadow-[0_0_70px_rgba(168,85,247,0.18)] backdrop-blur-2xl">
        <div className="text-2xl font-black uppercase tracking-tight text-white">
          MY
          <span className="bg-gradient-to-r from-purple-400 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
            NIFY
          </span>
        </div>

        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-2 border-white/10" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 border-r-fuchsia-500 animate-spin shadow-[0_0_30px_rgba(168,85,247,0.35)]" />
          <div className="absolute inset-3 rounded-full bg-purple-500/10 blur-md" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="h-2 w-40 animate-pulse rounded-full bg-white/10" />
          <div className="h-2 w-28 animate-pulse rounded-full bg-white/10" />
        </div>

        <p className="text-xs font-semibold tracking-[0.18em] text-white/35">
          Loading your dashboard...
        </p>
      </div>
    </div>
  );
}
