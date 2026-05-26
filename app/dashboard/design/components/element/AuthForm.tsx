"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Eye, EyeOff, Zap } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { supabase } from "@/lib/supabase";

const sanitizeEmail = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\w@.\-+]/gi, "")
    .trim()
    .slice(0, 254);

const safeOrigin = () => {
  if (typeof window === "undefined") return "";
  return window.location.origin;
};

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode?: AuthMode;
  popup?: boolean;
  onSuccess?: () => void;
};

export default function AuthForm({
  mode = "signup",
  popup = false,
  onSuccess,
}: AuthFormProps) {
  const [authMode, setAuthMode] = useState<AuthMode>(mode);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState<false | "password" | "google" | "apple">(false);
  const [error, setError] = useState("");

  const captchaRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let tries = 0;

    const interval = window.setInterval(() => {
      tries += 1;

      const turnstile = (window as any).turnstile;
      const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

      if (!sitekey) {
        setError("Missing captcha site key");
        clearInterval(interval);
        return;
      }

      if (!turnstile || !captchaRef.current || widgetIdRef.current) {
        if (tries > 50) clearInterval(interval);
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

      clearInterval(interval);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const resetCaptcha = useCallback(() => {
    const turnstile = (window as any).turnstile;

    if (turnstile && widgetIdRef.current) {
      turnstile.reset(widgetIdRef.current);
    }

    setToken("");
  }, []);

  const handlePasswordAuth = useCallback(async () => {
    if (loading) return;

    setLoading("password");
    setError("");

    try {
      const safeEmail = sanitizeEmail(email);

      if (!safeEmail || safeEmail.length < 5 || !password) {
        throw new Error("invalid");
      }

      if (!token) {
        setError("Verify captcha");
        setLoading(false);
        return;
      }

      if (authMode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: safeEmail,
          password,
          options: {
            captchaToken: token,
          },
        });

        if (error || !data.session) throw error || new Error("No session");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: safeEmail,
          password,
          options: {
            captchaToken: token,
          },
        });

        if (error) throw error;

        if (!data.user) {
          throw new Error("Unable to create account");
        }
      }

      onSuccess?.();
    } catch {
      setError(
        authMode === "login"
          ? "Invalid email or password"
          : "Unable to create account"
      );
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  }, [authMode, email, password, token, loading, onSuccess, resetCaptcha]);

  const handleOAuth = useCallback(
    async (provider: "google" | "apple") => {
      if (loading) return;

      setLoading(provider);
      setError("");

      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${safeOrigin()}/auth/callback`,
            queryParams: {
              prompt: "select_account",
            },
          },
        });

        if (error) throw error;
      } catch {
        setError("Unable to continue with provider");
        setLoading(false);
      }
    },
    [loading]
  );

  return (
    <div>
      <Script
        id={`turnstile-script-${popup ? "popup" : authMode}`}
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="lazyOnload"
      />

      {authMode === "signup" && (
        <div className="mb-5 rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 px-4 py-4 text-xs font-black text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,0.10)]">
          ✨ Create your account and get 3 free AI credits
        </div>
      )}

      <div className="mb-5 space-y-3">
        <button
          type="button"
          disabled={!!loading}
          onClick={() => handleOAuth("google")}
          className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-semibold text-white/85 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FcGoogle size={20} />
          {loading === "google" ? "Continuing..." : "Continue with Google"}
        </button>

        <button
          type="button"
          disabled={!!loading}
          onClick={() => handleOAuth("apple")}
          className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-semibold text-white/85 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaApple size={20} />
          {loading === "apple" ? "Continuing..." : "Continue with Apple"}
        </button>
      </div>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-bold text-white/35">OR</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="space-y-4">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          inputMode="email"
          autoComplete="email"
          maxLength={254}
          className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-base text-white outline-none transition placeholder:text-white/35 focus:border-purple-500/60 focus:bg-white/10 focus:ring-2 focus:ring-purple-500/20"
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={authMode === "login" ? "current-password" : "new-password"}
            maxLength={128}
            className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-base text-white outline-none transition placeholder:text-white/35 focus:border-purple-500/60 focus:bg-white/10 focus:ring-2 focus:ring-purple-500/20"
          />

          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-white/45 transition hover:bg-white/5 hover:text-purple-300"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="flex min-h-[70px] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2">
          <div ref={captchaRef} className="max-w-full scale-[0.92] sm:scale-100" />
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handlePasswordAuth}
          disabled={!!loading}
          className="flex min-h-13 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-4 font-bold text-white shadow-lg transition hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading === "password"
            ? authMode === "login"
              ? "Signing in..."
              : "Creating account..."
            : authMode === "login"
              ? "Sign in"
              : "Create account"}

          <Zap size={18} />
        </button>

        <p className="text-center text-sm text-white/50">
          {authMode === "login" ? "Don’t have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setAuthMode((prev) => (prev === "login" ? "signup" : "login"));
              setError("");
              resetCaptcha();
            }}
            className="font-bold text-fuchsia-400 transition hover:text-purple-300"
          >
            {authMode === "login" ? "Sign up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
