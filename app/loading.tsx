"use client";

const routeLabels: Record<string, string> = {
  "/dashboard/design": "Loading editor",
  "/dashboard/product": "Loading products",
  "/dashboard/orders": "Loading orders",
  "/dashboard/profile": "Loading profile",
  "/dashboard/settings": "Loading settings",
  "/dashboard/contact": "Loading contact",
  "/dashboard": "Loading dashboard",
  "/design": "Loading editor",
  "/checkout": "Loading checkout",
  "/admin": "Loading admin",
};

export function getLoadingText(pathname: string) {
  const match = Object.entries(routeLabels)
    .sort(([a], [b]) => b.length - a.length)
    .find(([route]) => pathname.startsWith(route));

  if (match) return match[1];

  const lastSegment = pathname.split("/").filter(Boolean).at(-1);

  if (!lastSegment) return "Loading";

  const label = lastSegment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return `Loading ${label}`;
}

export function getLoadingSubtitle(pathname: string) {
  const normalized = pathname.toLowerCase();

  if (normalized.startsWith("/dashboard/design")) return "Opening the editor";
  if (normalized.startsWith("/dashboard/product")) return "Loading products";
  if (normalized.startsWith("/dashboard/orders")) return "Fetching orders";
  if (normalized.startsWith("/dashboard/profile")) return "Syncing profile";
  if (normalized.startsWith("/dashboard/settings")) return "Updating settings";
  if (normalized.startsWith("/dashboard/contact")) return "Loading support";
  if (normalized.startsWith("/checkout")) return "Preparing checkout";
  if (normalized.startsWith("/admin")) return "Loading admin tools";

  return "Please wait";
}

type LoadingProps = {
  pathname?: string;
  label?: string;
  subtitle?: string;
};

export default function Loading({ pathname = "", label, subtitle }: LoadingProps) {
  const text = getLoadingText(pathname || "");
  const subtitleText = subtitle || getLoadingSubtitle(pathname || "");
  const labelText = label || text;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#03030a]/90 backdrop-blur-[16px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.10),transparent_32%),radial-gradient(circle_at_80%_18%,rgba(217,70,239,0.14),transparent_30%),radial-gradient(circle_at_50%_85%,rgba(139,92,246,0.10),transparent_34%),linear-gradient(180deg,#03030a_0%,#070711_55%,#03030a_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/5 blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />

      <div className="relative flex max-w-[340px] flex-col items-center gap-7 px-6 text-center">
        <div className="relative text-center">
          <div
            className="select-none text-[33px] font-black uppercase leading-none tracking-[-0.03em] text-white sm:text-[42px]"
            style={{
              fontFamily: "var(--font-logo)",
              textShadow: "0 0 18px rgba(102, 67, 136, 0.32)",
            }}
          >
            <span className="inline-block animate-[brand-letter_720ms_ease-out_both,brand-float_3.8s_ease-in-out_infinite_720ms]">R</span>
            <span className="inline-block animate-[brand-letter_720ms_ease-out_90ms_both,brand-float_3.8s_ease-in-out_infinite_840ms]">Y</span>
            <span className="inline-block bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent animate-[brand-letter_720ms_ease-out_180ms_both,brand-float_3.8s_ease-in-out_infinite_960ms]">
              F
            </span>
            <span className="inline-block bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent animate-[brand-letter_720ms_ease-out_270ms_both,brand-float_3.8s_ease-in-out_infinite_1080ms]">
              I
            </span>
            <span className="inline-block bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent animate-[brand-letter_720ms_ease-out_360ms_both,brand-float_3.8s_ease-in-out_infinite_1200ms]">
              O
            </span>
          </div>

          <div className="mx-auto mt-3 h-px w-28 rounded-full bg-gradient-to-r from-transparent via-white/75 to-transparent opacity-80 shadow-[0_0_18px_rgba(255,255,255,0.18)]" />
        </div>

        <div className="relative grid h-20 w-20 place-items-center sm:h-24 sm:w-24">
          <div className="absolute inset-0 rounded-full border border-white/8 bg-white/[0.02]" />
          <div className="absolute inset-1 rounded-full border border-cyan-300/10" />
          <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-t-cyan-300/90 border-r-fuchsia-400/90 border-b-white/10 will-change-transform [animation-duration:1.05s]" />
          <div className="absolute inset-6 rounded-full bg-white/[0.04] shadow-[0_0_50px_rgba(34,211,238,0.12)]" />
          <div className="absolute h-16 w-16 rounded-full bg-[conic-gradient(from_180deg,rgba(34,211,238,.0),rgba(34,211,238,.22),rgba(217,70,239,.18),rgba(34,211,238,.0))] opacity-40 blur-md animate-[pulse_2.8s_ease-in-out_infinite]" />
          <div className="relative h-3.5 w-3.5 animate-pulse rounded-full bg-cyan-200 shadow-[0_0_22px_rgba(34,211,238,0.70)]" />
        </div>

        <div className="flex w-64 flex-col items-center gap-2 sm:w-72">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
            <div className="h-full w-1/2 animate-[loading-bar_1.45s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent will-change-transform" />
          </div>

          <div className="h-1.5 w-2/3 overflow-hidden rounded-full bg-white/8">
            <div className="h-full w-1/2 animate-[loading-bar_1.8s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-fuchsia-300/70 to-transparent will-change-transform" />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-black uppercase tracking-[0.34em] text-white/52 sm:text-xs">
            {subtitleText}
          </p>
          <p className="text-xs font-semibold text-white/34 sm:text-[13px]">
            {labelText}
          </p>
        </div>
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

        @keyframes brand-letter {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
            filter: blur(4px);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes brand-float {
          0%, 100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-2px);
          }
        }
      `}</style>
    </div>
  );
}
