"use client";

import { usePathname } from "next/navigation";

const routeLabels: Record<string, string> = {
  "/dashboard": "Loading dashboard",
  "/dashboard/profile": "Loading profile",
  "/dashboard/products": "Loading products",
  "/dashboard/orders": "Loading orders",
  "/dashboard/settings": "Loading settings",
  "/dashboard/Contact": "Loading articles",
  "/design": "Loading editor",
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

export default function Loading() {
  const pathname = usePathname();
  const text = getLoadingText(pathname || "");

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#03030a]/95 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.22),transparent_34%),radial-gradient(circle_at_85%_12%,rgba(217,70,239,0.16),transparent_30%),linear-gradient(180deg,#03030a_0%,#080812_55%,#03030a_100%)]" />

      <div className="relative flex flex-col items-center gap-8">
        <div className="relative text-center">
          <div className="text-4xl font-black tracking-[-0.07em] text-white sm:text-5xl">
            MY<span className="text-purple-300">NIFY</span>
          </div>

          <div className="mx-auto mt-3 h-[2px] w-20 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-purple-500 shadow-[0_0_24px_rgba(168,85,247,0.65)]" />
        </div>

        <div className="relative grid h-24 w-24 place-items-center">
          <div className="absolute inset-0 rounded-full border border-white/10" />

          <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-t-purple-300 border-r-fuchsia-400 will-change-transform" />

          <div className="absolute inset-7 rounded-full bg-white/5 shadow-[0_0_55px_rgba(168,85,247,0.22)]" />

          <div className="relative h-4 w-4 animate-pulse rounded-full bg-fuchsia-300 shadow-[0_0_28px_rgba(217,70,239,0.85)]" />
        </div>

        <div className="flex w-64 flex-col items-center gap-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-[loading-bar_1.15s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-purple-300/70 to-transparent will-change-transform" />
          </div>

          <div className="h-2 w-40 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-[loading-bar_1.35s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-fuchsia-300/70 to-transparent will-change-transform" />
          </div>
        </div>

        <p className="text-sm font-black uppercase tracking-[0.28em] text-white/45 sm:text-base">
          {text}
        </p>
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
