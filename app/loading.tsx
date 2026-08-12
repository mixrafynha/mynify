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

function getLoadingText(pathname: string) {
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

function getLoadingSubtitle(pathname: string) {
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#03030a]/88 backdrop-blur-[14px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.08),transparent_34%),radial-gradient(circle_at_85%_12%,rgba(217,70,239,0.12),transparent_30%),linear-gradient(180deg,#03030a_0%,#070711_50%,#03030a_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="relative flex max-w-[320px] flex-col items-center gap-6 px-6 text-center">
        <div className="relative text-center">
          <div
            className="select-none text-[32px] font-black uppercase leading-none tracking-[-0.03em] text-white sm:text-[40px]"
            style={{
              fontFamily: "var(--font-logo)",
              textShadow: "0 0 18px rgba(102, 67, 136, 0.28)",
            }}
          >
            <span className="inline-block animate-[brand-letter_680ms_ease-out_both]">R</span>
            <span className="inline-block animate-[brand-letter_680ms_ease-out_90ms_both]">Y</span>
            <span className="inline-block bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent animate-[brand-letter_680ms_ease-out_180ms_both]">
              F
            </span>
            <span className="inline-block bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent animate-[brand-letter_680ms_ease-out_270ms_both]">
              I
            </span>
            <span className="inline-block bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent animate-[brand-letter_680ms_ease-out_360ms_both]">
              O
            </span>
          </div>

          <div className="mx-auto mt-3 h-px w-24 rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-70" />
        </div>

        <div className="relative grid h-18 w-18 place-items-center sm:h-20 sm:w-20">
          <div className="absolute inset-0 rounded-full border border-white/8 bg-white/[0.02]" />
          <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-t-cyan-300/90 border-r-fuchsia-400/90 will-change-transform [animation-duration:1.15s]" />
          <div className="absolute inset-7 rounded-full bg-white/[0.04]" />
          <div className="relative h-3.5 w-3.5 animate-pulse rounded-full bg-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.55)]" />
        </div>

        <div className="flex w-64 flex-col items-center gap-2 sm:w-72">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
            <div className="h-full w-1/2 animate-[loading-bar_1.6s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent will-change-transform" />
          </div>

          <div className="h-1.5 w-2/3 overflow-hidden rounded-full bg-white/8">
            <div className="h-full w-1/2 animate-[loading-bar_1.9s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-fuchsia-300/65 to-transparent will-change-transform" />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-black uppercase tracking-[0.34em] text-white/45 sm:text-xs">
            {subtitleText}
          </p>
          <p className="text-xs font-semibold text-white/30 sm:text-[13px]">
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
      `}</style>
    </div>
  );
}
