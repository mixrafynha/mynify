"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (value: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    }
  ) => string;
  reset: (widgetId: string) => void;
};

function getTurnstile(): TurnstileApi | null {
  if (typeof window === "undefined") return null;

  const maybeWindow = window as Window & {
    turnstile?: TurnstileApi;
  };

  return maybeWindow.turnstile ?? null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isStrongPassword(value: string) {
  return (
    value.length >= 10 &&
    value.length <= 128 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

type SignupResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  userId?: string | null;
};

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const captchaRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const renderCaptcha = () => {
      if (!mounted) return;
      if (!captchaRef.current) return;
      if (widgetIdRef.current) return;

      const turnstile = getTurnstile();
      if (!turnstile) return;

      const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

      if (!sitekey) {
        setError("Captcha is not configured.");
        return;
      }

      widgetIdRef.current = turnstile.render(captchaRef.current, {
        sitekey,
        callback: (value: string) => {
          setToken(value);
          setError("");
        },
        "expired-callback": () => {
          setToken("");
          setError("Captcha expired. Complete it again.");
        },
        "error-callback": () => {
          setToken("");
          setError("Captcha failed. Try again.");
        },
      });
    };

    renderCaptcha();

    const interval = window.setInterval(renderCaptcha, 300);
    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
    }, 5000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, []);

  const resetCaptcha = useCallback(() => {
    const turnstile = getTurnstile();

    if (turnstile && widgetIdRef.current) {
      turnstile.reset(widgetIdRef.current);
    }

    setToken("");
  }, []);

  const handleEmailSignup = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (loading) return;

      const normalizedEmail = email.trim().toLowerCase();

      setError("");
      setMessage("");

      if (!isValidEmail(normalizedEmail)) {
        setError("Enter a valid email.");
        return;
      }

      if (!isStrongPassword(password)) {
        setError(
          "Password must have 10+ characters, uppercase, lowercase, number and symbol."
        );
        return;
      }

      if (!token) {
        setError("Complete the captcha.");
        return;
      }

      setLoading(true);

      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 10000);

        const res = await fetch("/api/signup", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
            password,
            token,
          }),
          signal: controller.signal,
        });

        window.clearTimeout(timeout);

        let data: SignupResponse | null = null;

        try {
          data = (await res.json()) as SignupResponse;
        } catch {
          data = null;
        }

        if (!res.ok) {
          if (data?.error === "email_exists") {
            setError("User already exists. Try logging in.");
            resetCaptcha();
            return;
          }

          if (data?.error === "invalid_request") {
            setError(
              "Password must have 10+ characters, uppercase, lowercase, number and symbol."
            );
            resetCaptcha();
            return;
          }

          if (data?.error === "captcha_failed") {
            setError("Captcha failed. Please try again.");
            resetCaptcha();
            return;
          }

          if (data?.error === "server_config") {
            setError("Signup is not configured correctly.");
            resetCaptcha();
            return;
          }

          setError(data?.message || "Signup failed. Try again.");
          resetCaptcha();
          return;
        }

        setEmail("");
        setPassword("");
        resetCaptcha();

        setMessage("Account created. We sent you a verification email.");
      } catch (err) {
        const errorName = err instanceof Error ? err.name : "";

        setError(
          errorName === "AbortError"
            ? "Request timed out. Try again."
            : "Signup failed. Try again."
        );

        resetCaptcha();
      } finally {
        setLoading(false);
      }
    },
    [email, password, token, loading, resetCaptcha]
  );

  return (
    <div className="w-full">
      <form onSubmit={handleEmailSignup} className="space-y-4">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Email"
          className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-[16px] text-white outline-none transition placeholder:text-white/35 focus:border-purple-500/45 focus:ring-2 focus:ring-purple-500/20"
          value={email}
          onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
          required
        />

        <input
          type="password"
          autoComplete="new-password"
          placeholder="Password"
          className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-[16px] text-white outline-none transition placeholder:text-white/35 focus:border-purple-500/45 focus:ring-2 focus:ring-purple-500/20"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex min-h-[65px] justify-center">
          <div ref={captchaRef} />
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="flex w-full items-center justify-center rounded-xl bg-[#8BE04E] px-4 py-3.5 text-[16px] font-black text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
          ) : (
            "Create account"
          )}
        </button>
      </form>

      {error && <p className="mt-3 text-sm font-medium text-red-400">{error}</p>}

      {message && (
        <p className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200">
          {message}
        </p>
      )}
    </div>
  );
}