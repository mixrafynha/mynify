"use client";

import { Gift, Save, Sparkles } from "lucide-react";
import type { AuthPopupVariant } from "./auth.types";
import { getAuthCopy } from "./auth.copy";

type Props = {
  variant: AuthPopupVariant;
  onSignup: () => void;
  onLogin: () => void;
};

export default function AuthOfferStep({ variant, onSignup, onLogin }: Props) {
  const copy = getAuthCopy(variant);
  const Icon = variant === "save_design" ? Save : Gift;

  return (
    <div className="flex min-h-full flex-col justify-center py-3">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500 text-white shadow-lg shadow-violet-500/20">
        <Icon size={24} />
      </div>

      <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-violet-200 ring-1 ring-violet-400/20">
        <Sparkles size={13} />
        {copy.badge}
      </div>

      <h3 className="pr-12 text-[31px] font-black leading-[0.98] tracking-[-0.055em] text-white sm:text-[34px]">
        {copy.title}
      </h3>

      <p className="mt-4 text-[15px] font-medium leading-relaxed text-slate-300">
        {copy.subtitle}
      </p>

      <button
        type="button"
        onClick={onSignup}
        className="mt-5 flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 active:scale-[0.98]"
      >
        {copy.primaryCta}
      </button>

      <button
        type="button"
        onClick={onLogin}
        className="mt-3 w-full rounded-2xl py-3 text-sm font-bold text-white/60 transition hover:bg-white/[0.04] hover:text-white active:scale-[0.98]"
      >
        {copy.loginCta}
      </button>
    </div>
  );
}
