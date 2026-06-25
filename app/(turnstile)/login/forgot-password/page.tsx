"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";



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

const safeRoute = (path: string) => {
  if (typeof path !== "string") return "/";
  if (path.startsWith("javascript:")) return "/";
  if (path.startsWith("data:")) return "/";
  return path;
};

export default function ForgotPassword() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const captchaRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const turnstile = getTurnstile();

      if (!turnstile) return;
      if (!captchaRef.current) return;
      if (widgetIdRef.current) return;

      const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

      if (!sitekey) {
        setError("Captcha is not configured.");
        clearInterval(interval);
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

      clearInterval(interval);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const resetCaptcha = useCallback(() => {
    const turnstile = getTurnstile();

    if (turnstile && widgetIdRef.current) {
      turnstile.reset(widgetIdRef.current);
    }

    setToken("");
  }, []);

  const handleReset = async () => {
    if (loading) return;

    setError("");
    setSuccess("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Enter your email");
      return;
    }

    if (!token) {
      setError("Verify captcha");
      return;
    }

    setLoading(true);

    try {
      const resetOptions = {
        redirectTo: `${window.location.origin}/login/update-password`,
        captchaToken: token,
      };

      const { error } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        resetOptions
      );

      if (error) throw error;

      setSuccess("Check your email");
      setEmail("");
      resetCaptcha();
    } catch {
      setError("Reset failed. Try again.");
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-[100dvh] bg-[#03030a] text-white md:grid-cols-2">

      <div className="relative hidden overflow-hidden bg-[#03030a] text-white md:flex">
        <Image
          src="https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=72"
          alt=""
          fill
          sizes="(min-width: 768px) 50vw, 0vw"
          className="object-cover opacity-45"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 flex flex-col justify-center items-start p-12 w-full">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white text-black w-10 h-10 flex items-center justify-center rounded-lg font-bold">
                R
              </div>
              <span className="text-xl font-black tracking-tight">
                RYFIO
              </span>
            </div>

            <h1 className="text-4xl font-extrabold mb-4">
              RECOVER PASSWORD
            </h1>

            <p className="text-gray-200">
              Enter your email and we’ll send you a reset link.
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-center overflow-hidden bg-[#03030a] px-4 py-5 sm:p-6">
        <div className="relative w-full max-w-md rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-5 shadow-[0_0_35px_rgba(168,85,247,0.10)] backdrop-blur-xl sm:rounded-3xl sm:p-8">
          <button
            onClick={() => router.push(safeRoute("/login"))}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-white"
          >
            ✕
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 font-black text-white shadow-[0_0_30px_rgba(168,85,247,0.45)]">
              R
            </div>
            <span className="text-xl font-black tracking-tight">
              RYFIO
            </span>
          </div>

          <h2 className="mb-5 text-2xl font-black uppercase sm:mb-6">
            Forgot password
          </h2>

          <div className="space-y-4">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              placeholder="Email"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-[16px] text-white outline-none transition placeholder:text-white/35 focus:border-purple-500/60 focus:bg-white/10 focus:ring-2 focus:ring-purple-500/20"
            />

            <div className="flex justify-center min-h-[65px]">
              <div ref={captchaRef} />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}

            <button
              type="button"
              onClick={handleReset}
              disabled={loading || !token}
              className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 py-3.5 font-bold text-white shadow-[0_0_35px_rgba(168,85,247,0.35)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
