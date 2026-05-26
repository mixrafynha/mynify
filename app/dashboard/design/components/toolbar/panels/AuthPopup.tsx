"use client";

import { useState } from "react";
import { X, Lock, Sparkles, Gift } from "lucide-react";
import AuthForm from "./AuthForm";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function AuthPopup({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<"offer" | "auth">("offer");
  const [mode, setMode] = useState<"signup" | "login">("signup");

  if (!open) return null;

  function closePopup() {
    setStep("offer");
    setMode("signup");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 px-3 pb-3 backdrop-blur-md sm:items-center sm:px-4 sm:pb-0">
      <div className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-[28px] border border-white/10 bg-[#07111f] p-4 shadow-2xl sm:rounded-[34px] sm:p-6">
        <button
          type="button"
          onClick={closePopup}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/70"
        >
          <X size={17} />
        </button>

        {step === "offer" ? (
          <>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 via-violet-500 to-fuchsia-500">
              <Gift size={25} />
            </div>

            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">
              <Sparkles size={12} />
              Free AI Credits
            </div>

            <h3 className="text-2xl font-black leading-tight text-white sm:text-3xl">
              Create your account and get{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                3 AI credits
              </span>
            </h3>

            <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-300">
              Unlock AI generation and create premium transparent designs inside
              this editor.
            </p>

            <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 px-4 py-3 text-xs font-black text-cyan-100">
              ✨ Includes 3 free AI generations
            </div>

            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setStep("auth");
              }}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 font-black text-white active:scale-[0.98]"
            >
              Claim 3 free AI credits
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("login");
                setStep("auth");
              }}
              className="mt-3 w-full text-center text-sm font-bold text-white/60"
            >
              Already have an account? Login
            </button>
          </>
        ) : (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-violet-500 to-fuchsia-500">
              <Lock size={22} />
            </div>

            <h3 className="text-xl font-black text-white sm:text-2xl">
              {mode === "signup" ? "Create free account" : "Login"}
            </h3>

            <p className="mt-2 text-sm font-semibold text-slate-300">
              {mode === "signup"
                ? "Get 3 free AI credits and continue generating premium designs."
                : "Login to continue generating designs."}
            </p>

            <div className="mt-4">
              <AuthForm
                mode={mode}
                popup
                onSuccess={() => {
                  onSuccess?.();
                  closePopup();
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => setStep("offer")}
              className="mt-3 w-full text-center text-xs font-bold text-white/40"
            >
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
