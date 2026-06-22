"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!open) return;
    setStep("offer");
    setMode("signup");
  }, [open]);

  if (!open) return null;

  function closePopup() {
    setStep("offer");
    setMode("signup");
    onClose();
  }

  return (
    <div className="absolute inset-0 z-50 flex bg-[#07111f]/98 text-white" role="dialog" aria-modal="false">
      <div className="relative flex min-h-full w-full flex-col overflow-hidden bg-[#07111f]">
        <button
          type="button"
          onClick={closePopup}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.07] text-white/80 transition hover:bg-white/[0.11] active:scale-95"
        >
          <X size={18} />
        </button>

        <div className="flex-1 overflow-y-auto px-4 pb-5 pt-5 [scrollbar-width:none] sm:px-5 sm:pb-6 sm:pt-6 [&::-webkit-scrollbar]:hidden">
          {step === "offer" ? (
            <OfferStep
              onSignup={() => {
                setMode("signup");
                setStep("auth");
              }}
              onLogin={() => {
                setMode("login");
                setStep("auth");
              }}
            />
          ) : (
            <AuthStep
              mode={mode}
              onBack={() => setStep("offer")}
              onSuccess={() => {
                onSuccess?.();
                closePopup();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function OfferStep({ onSignup, onLogin }: { onSignup: () => void; onLogin: () => void }) {
  return (
    <>
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500 text-white">
        <Gift size={24} />
      </div>

      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-violet-200 ring-1 ring-violet-400/20">
        <Sparkles size={13} />
        Free AI Credits
      </div>

      <h3 className="pr-10 text-[27px] font-black leading-[1.04] tracking-[-0.04em] text-white sm:text-3xl">
        Create your account and get <span className="text-violet-300">3 AI credits</span>
      </h3>

      <p className="mt-4 text-sm font-medium leading-relaxed text-slate-300">
        Sign up for free to unlock AI generation and create premium transparent designs inside this editor.
      </p>

      <p className="mt-4 text-sm font-black text-violet-100">✨ Includes 3 free AI generations</p>

      <button
        type="button"
        onClick={onSignup}
        className="mt-5 flex min-h-12 w-full items-center justify-center rounded-2xl bg-violet-500 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-400 active:scale-[0.98]"
      >
        Claim 3 free AI credits
      </button>

      <button
        type="button"
        onClick={onLogin}
        className="mt-3 w-full rounded-2xl py-3 text-sm font-bold text-white/60 transition hover:bg-white/[0.04] hover:text-white active:scale-[0.98]"
      >
        Already have an account? Login
      </button>
    </>
  );
}

function AuthStep({ mode, onBack, onSuccess }: { mode: "signup" | "login"; onBack: () => void; onSuccess: () => void }) {
  return (
    <>
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500 text-white">
        <Lock size={21} />
      </div>

      <h3 className="pr-10 text-2xl font-black leading-tight text-white">{mode === "signup" ? "Create free account" : "Login"}</h3>

      <p className="mt-3 text-sm font-medium leading-relaxed text-slate-300">
        {mode === "signup"
          ? "Get 3 free AI credits and start generating print-ready designs."
          : "Login to continue generating print-ready designs."}
      </p>

      <div className="mt-5">
        <AuthForm mode={mode} popup onSuccess={onSuccess} />
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-3 w-full rounded-2xl py-3 text-xs font-bold text-white/45 transition hover:bg-white/[0.04] hover:text-white/75 active:scale-[0.98]"
      >
        Back
      </button>
    </>
  );
}
