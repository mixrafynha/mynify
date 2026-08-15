"use client";

import { createContext, useContext, useState } from "react";

type LoadingContextType = {
  loading: boolean;
  label: string;
  subtitle: string;
  setLoading: (
    next:
      | boolean
      | {
          active: boolean;
          label?: string;
          subtitle?: string;
        },
  ) => void;
};

const LoadingContext = createContext<LoadingContextType | null>(null);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState("Loading");
  const [subtitle, setSubtitle] = useState("Please wait");

  const updateLoading: LoadingContextType["setLoading"] = (next) => {
    if (typeof next === "boolean") {
      setLoading(next);
      if (!next) {
        setLabel("Loading");
        setSubtitle("Please wait");
      }
      return;
    }

    setLoading(next.active);
    if (typeof next.label === "string") setLabel(next.label);
    if (typeof next.subtitle === "string") setSubtitle(next.subtitle);

    if (!next.active) {
      setLabel("Loading");
      setSubtitle("Please wait");
    }
  };

  return (
    <LoadingContext.Provider value={{ loading, label, subtitle, setLoading: updateLoading }}>
      {children}

      {/* GLOBAL LOADING UI */}
      {loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#03030a]/92 backdrop-blur-[16px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.10),transparent_32%),radial-gradient(circle_at_80%_18%,rgba(217,70,239,0.14),transparent_30%),radial-gradient(circle_at_50%_85%,rgba(139,92,246,0.10),transparent_34%),linear-gradient(180deg,#03030a_0%,#070711_55%,#03030a_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/5 blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />

          <div className="relative flex max-w-[360px] flex-col items-center gap-7 px-6 text-center text-white">
            <div className="relative">
              <div
                className="select-none text-[38px] font-black uppercase leading-none tracking-[-0.045em] text-white sm:text-[48px]"
                style={{
                  fontFamily: "var(--font-logo)",
                  textShadow: "0 0 26px rgba(102, 67, 136, 0.45), 0 0 40px rgba(34, 211, 238, 0.16)",
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

              <div className="mx-auto mt-3 h-px w-32 rounded-full bg-gradient-to-r from-transparent via-white/90 to-transparent opacity-95 shadow-[0_0_20px_rgba(255,255,255,0.28)]" />
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
                {subtitle}
              </p>
              <p className="text-xs font-semibold text-white/34 sm:text-[13px]">
                {label}
              </p>
            </div>
          </div>
        </div>
      )}
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
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-2px);
          }
        }
      `}</style>
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading must be used inside provider");
  return ctx;
}
