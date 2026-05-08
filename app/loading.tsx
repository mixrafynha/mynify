"use client";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden bg-[#03030a] text-white">
      {/* BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(168,85,247,0.24),transparent_30%),radial-gradient(circle_at_65%_65%,rgba(14,165,233,0.14),transparent_28%)]" />

      {/* CARD */}
      <div className="relative flex w-[calc(100%-32px)] max-w-sm flex-col items-center rounded-[32px] border border-white/10 bg-white/[0.035] px-8 py-9 shadow-[0_0_70px_rgba(168,85,247,0.16)] backdrop-blur-2xl">
        {/* BRAND */}
        <div className="mb-7 text-3xl font-black uppercase tracking-[-0.04em]">
          MY
          <span className="bg-gradient-to-r from-purple-400 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
            NIFY
          </span>
        </div>

        {/* SPINNER */}
        <div className="relative mb-7 h-16 w-16">
          <div className="absolute inset-0 rounded-full border border-white/10" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-purple-500 border-r-fuchsia-500" />
          <div className="absolute inset-3 rounded-full bg-purple-500/10 blur-md" />
        </div>

        {/* SKELETON */}
        <div className="mb-6 flex w-full flex-col items-center gap-2">
          <div className="h-2 w-3/4 animate-pulse rounded-full bg-white/10" />
          <div className="h-2 w-1/2 animate-pulse rounded-full bg-white/10" />
        </div>

        <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-white/35">
          Loading your dashboard
        </p>
      </div>
    </div>
  );
}
