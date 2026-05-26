"use client";

import { memo, useCallback, useState } from "react";
import { X, Lock, Sparkles, Gift } from "lucide-react";
import AuthForm from "./AuthForm";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

function AuthPopup({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<"offer" | "auth">("offer");
  const [mode, setMode] = useState<"signup" | "login">("signup");

  const closePopup = useCallback(() => {
    setStep("offer");
    setMode("signup");
    onClose();
  }, [onClose]);

  const goSignup = useCallback(() => {
    setMode("signup");
    setStep("auth");
  }, []);

  const goLogin = useCallback(() => {
    setMode("login");
    setStep("auth");
  }, []);

  const handleSuccess = useCallback(() => {
    onSuccess?.();
    closePopup();
  }, [onSuccess, closePopup]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="
        fixed inset-0 z-[9999]
        flex items-end justify-center
        bg-black/70 px-3 pb-3
        backdrop-blur-md
        sm:items-center sm:px-4 sm:pb-0
      "
      onClick={closePopup}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          relative w-full max-w-md overflow-hidden
          rounded-[28px] border border-white/10
          bg-[#07111f] p-5
          shadow-2xl
          sm:rounded-[34px] sm:p-6
          max-h-[92svh] overflow-y-auto
          will-change-transform
        "
      >
        <button
          type="button"
          onClick={closePopup}
          aria-label="Close popup"
          className="
            absolute right-3 top-3 z-10
            flex h-11 w-11 items-center justify-center
            rounded-full border border-white/10
            bg-white/[0.05] text-white/70
            transition-colors
            hover:bg-white/[0.1] hover:text-white
            active:scale-95
          "
        >
          <X size={18} />
        </button>

        {step === "offer" ? (
          <>
            <div
              className="
                mb-4 flex h-14 w-14 items-center justify-center
                rounded-2xl bg-gradient-to-br
                from-cyan-500 via-violet-500 to-fuchsia-500
                sm:h-16 sm:w-16 sm:rounded-3xl
              "
            >
              <Gift size={26} className="text-white" />
            </div>

            <div
              className="
                mb-3 inline-flex items-center gap-2
                rounded-full border border-cyan-400/20
                bg-cyan-400/10 px-3 py-1.5
                text-[10px] font-black uppercase
                tracking-[0.16em] text-cyan-200
                sm:text-[11px]
              "
            >
              <Sparkles size={13} />
              Free AI Credits
            </div>

            <h3
              className="
                pr-10 text-[26px] font-black leading-[1.05]
                text-white sm:text-3xl
              "
            >
              Create your account and get{" "}
              <span
                className="
                  bg-gradient-to-r from-cyan-300
                  via-violet-300 to-fuchsia-300
                  bg-clip-text text-transparent
                "
              >
                3 AI credits
              </span>
            </h3>

            <p
              className="
                mt-4 text-sm font-semibold leading-relaxed
                text-slate-300
              "
            >
              Sign up for free to unlock AI generation and create premium
              transparent designs directly inside this editor.
            </p>

            <div
              className="
                mt-5 rounded-2xl border border-cyan-400/20
                bg-white/[0.04] px-4 py-4
                text-sm font-black text-cyan-100
              "
            >
              ✨ Includes 3 free AI generations
            </div>

            <button
              type="button"
              onClick={goSignup}
              className="
                mt-6 flex min-h-12 w-full items-center justify-center
                rounded-2xl bg-gradient-to-r
                from-cyan-500 via-violet-500 to-fuchsia-500
                px-5 py-3.5 font-black text-white
                transition-transform active:scale-[0.98]
              "
            >
              Claim 3 free AI credits
            </button>

            <button
              type="button"
              onClick={goLogin}
              className="
                mt-4 min-h-11 w-full text-center
                text-sm font-bold text-white/60
                transition-colors hover:text-cyan-300
              "
            >
              Already have an account? Login
            </button>
          </>
        ) : (
          <>
            <div
              className="
                mb-5 flex h-13 w-13 items-center justify-center
                rounded-2xl bg-gradient-to-br
                from-cyan-500 via-violet-500 to-fuchsia-500
              "
            >
              <Lock size={23} className="text-white" />
            </div>

            <h3 className="pr-10 text-2xl font-black text-white">
              {mode === "signup" ? "Create free account" : "Login"}
            </h3>

            <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-300">
              {mode === "signup"
                ? "Get 3 free AI credits and continue generating premium designs."
                : "Login to continue generating designs."}
            </p>

            <div className="mt-6">
              <AuthForm mode={mode} popup onSuccess={handleSuccess} />
            </div>

            <button
              type="button"
              onClick={() => setStep("offer")}
              className="
                mt-4 min-h-10 w-full text-center
                text-xs font-bold text-white/40
                transition-colors hover:text-white/70
              "
            >
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default memo(AuthPopup);
