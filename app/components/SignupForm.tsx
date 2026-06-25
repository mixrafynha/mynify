"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function SignupForm() {
  const router = useRouter();

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
        "expired-callback": () => setToken(""),
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

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const isStrongPassword = (value: string) =>
    value.length >= 10 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value);

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

        if (!res.ok) {
          throw new Error("Signup failed.");
        }

        setMessage("Account created. Redirecting...");
        setEmail("");
        setPassword("");
        resetCaptcha();

        router.replace("/login?registered=true");
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
    [email, password, token, loading, resetCaptcha, router]
  );

  return (
    <div className="w-full">
      <form onSubmit={handleEmailSignup} className="space-y-4">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Email"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[16px] text-black outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/10"
          value={email}
          onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
          required
        />

        <input
          type="password"
          autoComplete="new-password"
          placeholder="Password"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[16px] text-black outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/10"
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
          className="flex w-full items-center justify-center rounded-xl bg-[#8BE04E] px-4 py-3.5 text-[16px] font-semibold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
          ) : (
            "Sign up"
          )}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      {message && <p className="mt-3 text-sm text-green-600">{message}</p>}
    </div>
  );
}