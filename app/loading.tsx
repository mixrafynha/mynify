"use client";

type LoadingProps = {
  label?: string;
  subtitle?: string;
};

export default function Loading({
  label = "Loading",
  subtitle,
}: LoadingProps) {
  const actionText = subtitle || "Please wait";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#03030a]/92 backdrop-blur-[18px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.12),transparent_34%),radial-gradient(circle_at_85%_12%,rgba(217,70,239,0.18),transparent_30%),linear-gradient(180deg,#03030a_0%,#090913_50%,#03030a_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative flex max-w-[340px] flex-col items-center gap-7 px-6 text-center">
        <div className="relative flex flex-col items-center gap-3">
          <div
            className="select-none text-[34px] font-black uppercase leading-none tracking-[-0.045em] text-white sm:text-[42px]"
            style={{ fontFamily: "var(--font-logo)", textShadow: "0 0 18px rgba(102, 67, 136, 0.35)" }}
          >
            <span className="text-white">R</span>
            <span className="text-white">Y</span>
            <span className="bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">F</span>
            <span className="bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">I</span>
            <span className="bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">O</span>
          </div>

          <div className="h-[2px] w-24 rounded-full bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent shadow-[0_0_26px_rgba(34,211,238,0.28)]" />
          <p className="text-[10px] font-black uppercase tracking-[0.36em] text-white/35">{actionText}</p>
        </div>

        <div className="relative grid h-20 w-20 place-items-center">
          <div className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.03]" />
          <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-t-cyan-300 border-r-fuchsia-400 will-change-transform" />
          <div className="absolute inset-6 rounded-full bg-white/[0.05] shadow-[0_0_42px_rgba(34,211,238,0.18)]" />
          <div className="relative h-3.5 w-3.5 animate-pulse rounded-full bg-fuchsia-300 shadow-[0_0_28px_rgba(217,70,239,0.72)]" />
        </div>

        <div className="flex w-full flex-col items-center gap-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
            <div className="h-full w-1/2 animate-[loading-bar_1.15s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent will-change-transform" />
          </div>

          <div className="h-1.5 w-3/5 overflow-hidden rounded-full bg-white/8">
            <div className="h-full w-1/2 animate-[loading-bar_1.35s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-fuchsia-300/70 to-transparent will-change-transform" />
          </div>
        </div>

        <p className="text-sm font-black uppercase tracking-[0.26em] text-white/50">{label}</p>
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          0% {
            transform: translateX(-120%);
          }

          100% {
            transform: translateX(240%);
          }
        }
      `}</style>
    </div>
  );
}
