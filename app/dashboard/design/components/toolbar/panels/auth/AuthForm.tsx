"use client";

import Script from "next/script";
import { Eye, EyeOff, Zap } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import type { ReactNode } from "react";
import type { AuthFormMode, AuthPopupVariant } from "./auth.types";
import { getAuthCopy } from "./auth.copy";
import { TURNSTILE_SRC } from "./auth.utils";
import { useAuthForm } from "./useAuthForm";

type AuthFormProps = {
  mode?: AuthFormMode;
  popup?: boolean;
  variant?: AuthPopupVariant;
  onSuccess?: () => void;
};

export default function AuthForm({
  mode = "signup",
  popup = false,
  variant = "ai_credits",
  onSuccess,
}: AuthFormProps) {
  const copy = getAuthCopy(variant);
  const auth = useAuthForm({ mode, popup, onSuccess });
  const sitekey = auth.turnstile.sitekey;

  return (
    <div className="text-white">
      {sitekey && (
        <Script
          id="turnstile-script-auth-form"
          src={TURNSTILE_SRC}
          strategy="lazyOnload"
          onLoad={auth.turnstile.renderCaptcha}
          onReady={auth.turnstile.renderCaptcha}
        />
      )}

      {auth.authMode === "signup" && (
        <p className="mb-4 rounded-2xl bg-violet-500/10 px-3 py-2 text-xs font-black leading-relaxed text-violet-100 ring-1 ring-violet-400/15">
          ✨ {copy.formSignupHint}
        </p>
      )}

      <div className="mb-4 grid gap-2">
        <ProviderButton disabled={!!auth.loading} onClick={() => auth.handleOAuth("google")} icon={<FcGoogle size={20} />}>
          {auth.loading === "google" ? "Continuing..." : "Continue with Google"}
        </ProviderButton>

        <ProviderButton disabled={!!auth.loading} onClick={() => auth.handleOAuth("apple")} icon={<FaApple size={20} />}>
          {auth.loading === "apple" ? "Continuing..." : "Continue with Apple"}
        </ProviderButton>
      </div>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] font-black text-white/35">OR</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="space-y-3">
        <input
          value={auth.email}
          onChange={(event) => auth.setEmail(event.target.value)}
          placeholder="Email"
          inputMode="email"
          autoComplete="email"
          maxLength={254}
          className="min-h-12 w-full rounded-2xl bg-white/[0.055] px-4 py-3 text-base text-white outline-none ring-1 ring-white/10 transition placeholder:text-white/35 focus:bg-white/[0.08] focus:ring-violet-400/50"
        />

        <div className="relative">
          <input
            type={auth.showPassword ? "text" : "password"}
            value={auth.password}
            onChange={(event) => auth.setPassword(event.target.value)}
            placeholder="Password"
            autoComplete={auth.authMode === "login" ? "current-password" : "new-password"}
            maxLength={128}
            className="min-h-12 w-full rounded-2xl bg-white/[0.055] px-4 py-3 pr-12 text-base text-white outline-none ring-1 ring-white/10 transition placeholder:text-white/35 focus:bg-white/[0.08] focus:ring-violet-400/50"
          />

          <button
            type="button"
            onClick={() => auth.setShowPassword((prev) => !prev)}
            aria-label={auth.showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-white/50 transition hover:bg-white/5 hover:text-violet-300"
          >
            {auth.showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="flex min-h-[74px] w-full items-center justify-center overflow-hidden rounded-2xl bg-white/[0.035] p-2 ring-1 ring-white/10">
          {sitekey ? (
            <div ref={auth.turnstile.captchaRef} className="max-w-full origin-center scale-[0.86] sm:scale-100" />
          ) : (
            <span className="text-xs font-bold text-red-300">Missing captcha site key</span>
          )}
        </div>

        {auth.error && <p className="text-sm font-medium leading-relaxed text-red-300">{auth.error}</p>}
        {auth.message && <p className="rounded-2xl bg-emerald-500/10 px-3 py-2 text-sm font-bold leading-relaxed text-emerald-200 ring-1 ring-emerald-400/20">{auth.message}</p>}

        <button
          type="button"
          onClick={auth.handlePasswordAuth}
          disabled={!!auth.loading || !auth.turnstile.captchaReady || !sitekey}
          className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl bg-violet-500 px-4 py-3 text-sm font-black text-white transition hover:bg-violet-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {auth.loading === "password"
            ? auth.authMode === "login"
              ? "Signing in..."
              : "Creating account..."
            : auth.authMode === "login"
              ? copy.submitLogin
              : copy.submitSignup}
          <Zap size={17} />
        </button>

        <p className="text-center text-sm text-white/50">
          {auth.authMode === "login" ? "Don’t have an account?" : "Already have an account?"}{" "}
          <button type="button" onClick={auth.toggleMode} className="font-bold text-violet-300 transition hover:text-fuchsia-300">
            {auth.authMode === "login" ? "Sign up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

function ProviderButton({
  children,
  icon,
  disabled,
  onClick,
}: {
  children: ReactNode;
  icon: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl bg-white/[0.055] px-4 py-3 text-sm font-semibold text-white/90 ring-1 ring-white/10 transition hover:bg-white/[0.085] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {icon}
      {children}
    </button>
  );
}
