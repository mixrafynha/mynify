"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, X } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import Turnstile from "../shared/Turnstile";
import { loginWithPassword, resendVerificationEmail, startOAuthLogin } from "./LoginActions";
import { normalizeLoginError } from "./LoginErrors";
import { logLoginEvent } from "./LoginLogger";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, isValidEmail, isValidPassword, safeRoute, sanitizeEmail } from "./LoginValidation";
import type { LoginLoadingState } from "./types";

export default function LoginForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [loading, setLoading] = useState<LoginLoadingState>(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [canResend, setCanResend] = useState(false);


  useEffect(() => {
    void logLoginEvent({ event: "login_form_view", level: "info" });
  }, []);

  const resetCaptcha = useCallback(() => {
    setToken("");
    setResetKey((value) => value + 1);
  }, []);

  const handleLogin = useCallback(async () => {
    if (loading) return;

    const safeEmail = sanitizeEmail(email);

    setError("");
    setSuccess("");
    setCanResend(false);

    if (!safeEmail || !isValidEmail(safeEmail)) {
      setError("Please enter a valid email address.");
      void logLoginEvent({
        event: "login_validation_failed",
        level: "warn",
        reason: "invalid_email",
      });
      return;
    }

    if (!isValidPassword(password)) {
      setError(
        password.length === 0
          ? "Password is required."
          : password.length < PASSWORD_MIN_LENGTH
          ? `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
          : "Password is too long."
      );
      void logLoginEvent({
        event: "login_validation_failed",
        level: "warn",
        email: safeEmail,
        reason: password.length === 0 ? "missing_password" : "invalid_password_format",
      });
      return;
    }

    if (!token) {
      setError("Complete the captcha.");
      void logLoginEvent({
        event: "login_validation_failed",
        level: "warn",
        email: safeEmail,
        reason: "missing_turnstile_token",
        turnstileState: "missing",
      });
      return;
    }

    setLoading("email");

    const startedAt = Date.now();
    void logLoginEvent({
      event: "login_submit_started",
      level: "info",
      email: safeEmail,
      turnstileState: "ready",
    });

    try {
      const result = await loginWithPassword({ email: safeEmail, password, token });

      if (!result.ok) {
        const normalized = normalizeLoginError(result.code ?? result.error);
        setError(normalized.message);
        setCanResend(Boolean(normalized.canResendVerification));
        void logLoginEvent({
          event:
            normalized.kind === "user_not_found"
              ? "login_user_not_found"
              : normalized.kind === "invalid_credentials"
              ? "login_invalid_credentials"
              : normalized.kind === "email_not_confirmed"
              ? "login_email_not_confirmed"
              : "login_submit_failed",
          level: normalized.kind === "user_not_found" || normalized.kind === "invalid_credentials" ? "warn" : "error",
          email: safeEmail,
          reason: normalized.kind,
          message: normalized.message,
          durationMs: Date.now() - startedAt,
        });
        resetCaptcha();
        return;
      }

      void logLoginEvent({
        event: "login_submit_succeeded",
        level: "info",
        email: result.email ?? safeEmail,
        durationMs: Date.now() - startedAt,
      });

      router.replace("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [email, loading, password, resetCaptcha, router, token]);

  const handleOAuth = useCallback(
    async (provider: "google" | "apple") => {
      if (loading || typeof window === "undefined") return;

      setLoading(provider);
      setError("");
      setSuccess("");
      setCanResend(false);

      void logLoginEvent({ event: "login_oauth_started", level: "info", provider });

      const result = await startOAuthLogin(provider);

      if (!result.ok) {
        const message = provider === "google" ? "Could not sign in with Google. Try again." : "Could not sign in with Apple. Try again.";
        setError(message);
        void logLoginEvent({
          event: "login_oauth_failed",
          level: "error",
          provider,
          message,
          errorName: result.error instanceof Error ? result.error.name : undefined,
        });
        setLoading(false);
      }
    },
    [loading]
  );

  const handleResendVerification = useCallback(async () => {
    if (loading) return;

    const safeEmail = sanitizeEmail(email);

    if (!safeEmail || !isValidEmail(safeEmail)) {
      setError("Please enter a valid email address first.");
      return;
    }

    setLoading("resend");
    setError("");
    setSuccess("");

    void logLoginEvent({ event: "login_resend_started", level: "info", email: safeEmail });

    const result = await resendVerificationEmail(safeEmail);

    if (!result.ok) {
      const normalized = normalizeLoginError(result.error);
      setError(normalized.message);
      void logLoginEvent({
        event: "login_resend_failed",
        level: "error",
        email: safeEmail,
        reason: normalized.kind,
        message: normalized.message,
      });
      setLoading(false);
      return;
    }

    setSuccess("Verification email sent. Check your inbox.");
    void logLoginEvent({ event: "login_resend_succeeded", level: "info", email: safeEmail });
    setLoading(false);
  }, [email, loading]);

  return (
    <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-xl sm:p-7">
      <button
        type="button"
        onClick={() => router.push(safeRoute("/"))}
        aria-label="Go back to home"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/45 transition hover:text-white"
      >
        <X size={18} />
      </button>

      <div className="mb-6 flex items-center gap-3">
        <Image src="/favicon.ico" alt="Ryfio" width={44} height={44} priority className="rounded-xl" />
        <span className="text-xl font-black tracking-tight">RYFIO</span>
      </div>

      <h2 className="text-2xl font-black uppercase">Welcome back</h2>
      <p className="mt-2 text-sm leading-relaxed text-white/50">
        Sign in to manage your custom products.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={Boolean(loading)}
          onClick={() => handleOAuth("google")}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 font-semibold text-white/85 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FcGoogle size={20} />
          <span className="hidden sm:inline">Google</span>
        </button>

        <button
          type="button"
          disabled={Boolean(loading)}
          onClick={() => handleOAuth("apple")}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 font-semibold text-white/85 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaApple size={20} />
          <span className="hidden sm:inline">Apple</span>
        </button>
      </div>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-bold text-white/35">OR</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-white/35">Email</span>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18} />
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value.trim().toLowerCase())}
              placeholder="you@example.com"
              aria-label="Email address"
              className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-11 py-3.5 text-[16px] text-white outline-none placeholder:text-white/30 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/15"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-white/35">Password</span>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              aria-label="Password"
              maxLength={PASSWORD_MAX_LENGTH}
              className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-11 py-3.5 pr-12 text-[16px] text-white outline-none placeholder:text-white/30 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/15"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/45 transition hover:text-white"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/login/forgot-password")}
            className="text-sm font-semibold text-fuchsia-300 transition hover:text-fuchsia-200"
          >
            Forgot password?
          </button>
        </div>

        <Turnstile
          resetKey={resetKey}
          onTokenChange={(value) => {
            setToken(value);
            if (value) {
              setError("");
              void logLoginEvent({
                event: "login_turnstile_token_received",
                level: "info",
                email: sanitizeEmail(email),
                turnstileState: "ready",
              });
            } else {
              void logLoginEvent({
                event: "login_turnstile_token_cleared",
                level: "info",
                email: sanitizeEmail(email),
                turnstileState: "expired",
              });
            }
          }}
          onError={(message) => {
            setError(message);
            void logLoginEvent({
              event: "login_turnstile_error",
              level: "warn",
              email: sanitizeEmail(email),
              message,
              turnstileState: "error",
            });
          }}
        />

        {error && (
          <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
            {canResend && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={Boolean(loading)}
                className="mt-3 block font-bold text-fuchsia-300 transition hover:text-purple-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading === "resend" ? "Sending..." : "Resend verification email"}
              </button>
            )}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </div>
        )}

        <button
          type="button"
          onClick={handleLogin}
          disabled={Boolean(loading) || !token}
          className="flex w-full items-center justify-center rounded-xl bg-[#8BE04E] px-4 py-3.5 text-[16px] font-black text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "email" ? "Signing in..." : "Sign in"}
        </button>

        <p className="text-center text-sm text-white/50">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="font-bold text-fuchsia-300 transition hover:text-fuchsia-200"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
