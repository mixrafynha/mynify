"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Script from "next/script";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [scriptReady, setScriptReady] = useState(false);

  const captchaRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!scriptReady) return;
    if (!captchaRef.current) return;
    if (widgetIdRef.current) return;

    const turnstile = (window as any).turnstile;
    if (!turnstile) return;

    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    if (!sitekey) {
      setError("Missing captcha site key");
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
        setError("Captcha error");
      },
    });
  }, [scriptReady]);

  const resetCaptcha = useCallback(() => {
    const turnstile = (window as any).turnstile;

    if (turnstile && widgetIdRef.current) {
      turnstile.reset(widgetIdRef.current);
    }

    setToken("");
  }, []);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isStrongPassword = (password: string) =>
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password);

  const handleEmailSignup = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (loading) return;

      setError("");
      setMessage("");

      if (!isValidEmail(email)) {
        setError("Invalid email");
        return;
      }

      if (!isStrongPassword(password)) {
        setError("Weak password");
        return;
      }

      if (!token) {
        setError("Verify captcha");
        return;
      }

      setLoading(true);

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch("/api/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password, token }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.message || "Signup failed");
        }

        setMessage("Account created");
        setEmail("");
        setPassword("");
        resetCaptcha();
      } catch (err: any) {
        setError(
          err?.name === "AbortError"
            ? "Timeout. Try again."
            : err?.message || "Server error"
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
      <Script
        id="turnstile-script"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />

      <form onSubmit={handleEmailSignup} className="space-y-4">
        <input
          type="email"
          autoComplete="email"
          placeholder="Email"
          className="w-full border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20"
          value={email}
          onChange={(e) => setEmail(e.target.value.trim())}
          required
        />

        <input
          type="password"
          autoComplete="new-password"
          placeholder="Password"
          className="w-full border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex justify-center min-h-[65px]">
          <div ref={captchaRef} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#8BE04E] py-3 rounded-xl font-semibold disabled:opacity-50"
        >
          {loading ? "Creating..." : "Sign up"}
        </button>
      </form>

      {error && <p className="text-red-500 mt-3 text-sm">{error}</p>}
      {message && <p className="text-green-600 mt-3 text-sm">{message}</p>}
    </div>
  );
}
