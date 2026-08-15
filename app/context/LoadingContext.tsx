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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-black/40 px-6 py-5 text-center text-white shadow-2xl backdrop-blur-md">
            <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            <div className="space-y-1">
              <p className="text-sm font-black uppercase tracking-[0.24em]">{subtitle}</p>
              <p className="text-xs text-white/70">{label}</p>
            </div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading must be used inside provider");
  return ctx;
}
