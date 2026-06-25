"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Turnstile from "../shared/Turnstile";
import { createAccount, resendSignupVerification } from "./SignupActions";
import { normalizeSignupError } from "./SignupErrors";
import { logSignupEvent } from "./SignupLogger";
import { isStrongPassword, isValidEmail, sanitizeEmail } from "./SignupValidation";
import type { SignupLoadingState } from "./types";

const CAPTCHA_UI_ERRORS = new Set([
  "Complete the captcha.",
  "Captcha is not configured.",
  "Captcha failed. Try again.",
  "Captcha failed to load. Refresh and try again.",
  "Captcha failed to load. Check your connection.",
]);

function clearOnlyCaptchaError(value: string) {
  return CAPTCHA_UI_ERRORS.has(value) ? "" : value;
}

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState<SignupLoadingState>(false);
  const [resetKey, setResetKey] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [canResend, setCanResend] = useState(false);
  const lastLoggedEmailRef = useRef("");

  useEffect(() => {
    void logSignupEvent({ event: "signup_form_view" });
  }, []);

  const logEmailChangeOnce = useCallback((value: string) => {
    const normalizedEmail = sanitizeEmail(value);

    if (!isValidEmail(normalizedEmail)) return;
    if (lastLoggedEmailRef.current === normalizedEmail) return;

    lastLoggedEmailRef.current = normalizedEmail;
    void logSignupEvent({
      event: "signup_email_changed",
      email: normalizedEmail,
      metadata: { hasValidFormat: true },
    });
  }, []);

  const handleEmailSignup = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (loading) return;

      const normalizedEmail = sanitizeEmail(email);

      setError("");
      setMessage("");
      setCanResend(false);

      if (!isValidEmail(normalizedEmail)) {
        void logSignupEvent({
          event: "signup_validation_failed",
          level: "warn",
          reason: "invalid_email",
          metadata: { hasEmail: normalizedEmail.length > 0 },
        });
        setError("Enter a valid email.");
        return;
      }

      if (!isStrongPassword(password)) {
        void logSignupEvent({
          event: "signup_validation_failed",
          level: "warn",
          email: normalizedEmail,
          reason: "weak_password",
          metadata: { passwordLength: password.length },
        });
        setError("Password must have 10+ characters, uppercase, lowercase, number and symbol.");
        return;
      }

      if (!token) {
        void logSignupEvent({
          event: "signup_validation_failed",
          level: "warn",
          email: normalizedEmail,
          reason: "missing_turnstile_token",
          turnstileState: "missing",
        });
        setError("Complete the captcha.");
        return;
      }

      setLoading("email");

      const startedAt = Date.now();
      void logSignupEvent({
        event: "signup_submit_started",
        email: normalizedEmail,
        turnstileState: "ready",
        metadata: { passwordLength: password.length },
      });

      const result = await createAccount({
        email: normalizedEmail,
        password,
        token,
      });

      if (!result.ok) {
        if (result.code === "account_exists") {
          void logSignupEvent({
            event: "signup_existing_account_detected",
            level: "warn",
            email: normalizedEmail,
            status: result.status,
            durationMs: Date.now() - startedAt,
            message: result.message,
            reason: "account_exists",
          });
          setError(result.message || "This email is already registered. Log in instead.");
          setCanResend(false);
          setToken("");
          setResetKey((value) => value + 1);
          setLoading(false);
          return;
        }

        const normalized = normalizeSignupError(result.status, result.message, result.error);
        const errorName = result.error instanceof Error ? result.error.name : undefined;
        void logSignupEvent({
          event: "signup_submit_failed",
          level: result.status && result.status < 500 ? "warn" : "error",
          email: normalizedEmail,
          status: result.status,
          durationMs: Date.now() - startedAt,
          message: result.message,
          errorName,
          reason: normalized.message,
          metadata: { code: result.code },
        });
        setError(normalized.message);
        setCanResend(Boolean(normalized.canResendVerification));
        setToken("");
        setResetKey((value) => value + 1);
        setLoading(false);
        return;
      }

      void logSignupEvent({
        event: "signup_submit_succeeded",
        email: normalizedEmail,
        durationMs: Date.now() - startedAt,
        message: result.message,
        metadata: { code: result.code },
      });

      setEmail("");
      setPassword("");
      setToken("");
      setResetKey((value) => value + 1);
      setMessage(result.message);
      setLoading(false);
    },
    [email, loading, password, token]
  );

  const handleResendVerification = useCallback(async () => {
    if (loading) return;

    const normalizedEmail = sanitizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      void logSignupEvent({
        event: "signup_validation_failed",
        level: "warn",
        reason: "resend_invalid_email",
        metadata: { hasEmail: normalizedEmail.length > 0 },
      });
      setError("Enter a valid email first.");
      return;
    }

    setLoading("resend");
    setError("");
    setMessage("");

    const startedAt = Date.now();
    void logSignupEvent({ event: "signup_resend_started", email: normalizedEmail });

    const result = await resendSignupVerification(normalizedEmail);

    if (!result.ok) {
      const normalized = normalizeSignupError(null, "Resend failed.", result.error);
      const errorName = result.error instanceof Error ? result.error.name : undefined;
      void logSignupEvent({
        event: "signup_resend_failed",
        level: "error",
        email: normalizedEmail,
        durationMs: Date.now() - startedAt,
        errorName,
        reason: normalized.message,
      });
      setError(normalized.message);
      setLoading(false);
      return;
    }

    void logSignupEvent({
      event: "signup_resend_succeeded",
      email: normalizedEmail,
      durationMs: Date.now() - startedAt,
    });

    setMessage("Verification email sent. Check your inbox.");
    setLoading(false);
  }, [email, loading]);

  return (
    <div className="w-full">
      <form onSubmit={handleEmailSignup} className="space-y-4">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Email"
          className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-[16px] text-white outline-none placeholder:text-white/30 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/15"
          value={email}
          onChange={(e) => {
            const value = e.target.value.trim().toLowerCase();
            setEmail(value);
            logEmailChangeOnce(value);
          }}
          required
        />

        <input
          type="password"
          autoComplete="new-password"
          placeholder="Password"
          className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-[16px] text-white outline-none placeholder:text-white/30 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/15"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Turnstile
          resetKey={resetKey}
          className="flex min-h-[65px] justify-center rounded-xl border border-white/10 bg-white/[0.04] p-2"
          onTokenChange={(value) => {
            setToken(value);
            void logSignupEvent({
              event: value ? "signup_turnstile_token_received" : "signup_turnstile_token_cleared",
              email: sanitizeEmail(email),
              turnstileState: value ? "ready" : "expired",
            });
            if (value) setError(clearOnlyCaptchaError);
          }}
          onError={(value) => {
            void logSignupEvent({
              event: "signup_turnstile_error",
              level: "warn",
              email: sanitizeEmail(email),
              message: value,
              turnstileState: "error",
            });
            setError(value);
          }}
        />

        <button
          type="submit"
          disabled={Boolean(loading) || !token}
          className="flex w-full items-center justify-center rounded-xl bg-[#8BE04E] px-4 py-3.5 text-[16px] font-black text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "email" ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
          ) : (
            "Create account"
          )}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm font-medium text-red-400">
          {error}
          {canResend && (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={Boolean(loading)}
              className="mt-2 block font-bold text-fuchsia-300 transition hover:text-purple-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading === "resend" ? "Sending..." : "Resend verification email"}
            </button>
          )}
        </p>
      )}

      {message && (
        <p className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200">
          {message}
        </p>
      )}
    </div>
  );
}
