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

  const [mounted, setMounted] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const captchaRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  /* -------------------------
     ✅ CLIENT READY
  ------------------------- */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* -------------------------
     🔐 TURNSTILE (ROBUST)
  ------------------------- */
  useEffect(() => {
    if (!mounted || !scriptReady) return;
    if (!captchaRef.current) return;
    if (widgetIdRef.current) return;

    const w = window as any;

    if (!w.turnstile) return;

    widgetIdRef.current = w.turnstile.render(captchaRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!,
      callback: (token: string) => setToken(token),
      "expired-callback": () => setToken(""),
      "error-callback": () => {
        setToken("");
        setError("Captcha error. Refresh the page.");
      },
      appearance: "always",
      execution: "render",
    });
  }, [mounted, scriptReady]);

  /* -------------------------
     📧 VALIDATION
  ------------------------- */
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isStrongPassword = (password: string) =>
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password);

  /* -------------------------
     🚀 SUBMIT
  ------------------------- */
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

        const timeout = setTimeout(() => {
          controller.abort();
        }, 10000);

        const res = await fetch("/api/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password, token }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Signup failed");
        }

        setMessage("Account created 🚀");
        setEmail("");
        setPassword("");
        setToken("");

        if ((window as any).turnstile && widgetIdRef.current) {
          (window as any).turnstile.reset(widgetIdRef.current);
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          setError("Timeout. Try again.");
        } else {
          setError(err.message || "Server error");
        }

        if ((window as any).turnstile && widgetIdRef.current) {
          (window as any).turnstile.reset(widgetIdRef.current);
        }

        setToken("");
      } finally {
        setLoading(false);
      }
    },
    [email, password, token, loading]
  );

  return (
    <div className="w-full">
      <Script
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

        {/* CAPTCHA */}
        <div className="flex justify-center min-h-[65px]">
          {mounted && <div ref={captchaRef} />}
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
