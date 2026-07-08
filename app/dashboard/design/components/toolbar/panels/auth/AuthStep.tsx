"use client";

import { Lock } from "lucide-react";
import AuthForm from "./AuthForm";
import type { AuthFormMode, AuthPopupVariant } from "./auth.types";
import { getAuthCopy } from "./auth.copy";

type Props = {
  mode: AuthFormMode;
  variant: AuthPopupVariant;
  onBack: () => void;
  onSuccess: () => void;
};

export default function AuthStep({ mode, variant, onBack, onSuccess }: Props) {
  const copy = getAuthCopy(variant);

  return (
    <div className="py-3">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500 text-white shadow-lg shadow-violet-500/20">
        <Lock size={21} />
      </div>

      <h3 className="pr-12 text-2xl font-black leading-tight tracking-[-0.035em] text-white">
        {mode === "signup" ? copy.authSignupTitle : copy.authLoginTitle}
      </h3>

      <p className="mt-2 text-sm font-medium leading-relaxed text-slate-300">
        {mode === "signup" ? copy.authSignupDescription : copy.authLoginDescription}
      </p>

      <div className="mt-5">
        <AuthForm mode={mode} popup variant={variant} onSuccess={onSuccess} />
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-3 w-full rounded-2xl py-3 text-xs font-bold text-white/45 transition hover:bg-white/[0.04] hover:text-white/75 active:scale-[0.98]"
      >
        Back
      </button>
    </div>
  );
}
