"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Eye, EyeOff, Zap } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

const sanitizeEmail = (value: string) =>
  value.toLowerCase().replace(/[^\w@.\-+]/gi, "").trim().slice(0, 254);

const safeOrigin = () =>
  typeof window === "undefined" ? "" : window.location.origin;

type Props = {
  mode?: "login" | "signup";
  popup?: boolean;
  onSuccess?: () => void;
};

export default function AuthForm({
  mode = "signup",
  popup = false,
  onSuccess,
}: Props) {
  const router = useRouter();

  const [authMode, setAuthMode] = useState(mode);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState<false | "password" | "google" | "apple">(false);
  const [error, setError] = useState("");

  const captchaRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    setAuthMode(mode);
  }, [mode]);

  useEffect(() => {
    let tries = 0;

    const interval = window.setInterval(() => {
      tries++;

      const turnstile = (window as any).turnstile;
      const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

      if (!sitekey) {
        setError("Missing captcha site key");
        clearInterval(interval);
        return;
      }

      if (!turnstile || !captchaRef.current || widgetIdRef.current) {
        if (tries > 30) clearInterval(interval);
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
    }, 180);

    return () => clearInterval(interval);
  }, []);

  const resetCaptcha = useCallback(() => {
    const turnstile = (window as any).turnstile;

    if (turnstile && widgetIdRef.current) {
      turnstile.reset(widgetIdRef.current);
    }

    setToken("");
  }, []);

  const finish = useCallback(() => {
    if (popup) {
      onSuccess?.();
      return;
    }

    router.replace("/dashboard");
  }, [popup, onSuccess, router]);

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
          options: { captchaToken: token },
        });

        if (error || !data.session) throw error || new Error("No session");
      } else {
        const { error } = await supabase.auth.signUp({
          email: safeEmail,
          password,
          options: { captchaToken: token },
        });

        if (error) throw error;
      }

      finish();
    } catch {
      setError(authMode === "login" ? "Invalid email or password" : "Unable to create account");
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  }, [authMode, email, password, token, loading, finish, resetCaptcha]);

  const handleOAuth = useCallback(
    async (provider: "google" | "apple") => {
      if (loading) return;

      setLoading(provider);
      setError("");

      try {
        const redirectTo = popup
          ? `${safeOrigin()}/auth/callback?next=${encodeURIComponent(
              window.location.pathname + window.location.search
            )}`
          : `${safeOrigin()}/auth/callback`;

        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
            queryParams: { prompt: "select_account" },
          },
        });

        if (error) throw error;
      } catch {
        setError("Unable to continue with provider");
        setLoading(false);
      }
    },
    [loading, popup]
  );

  return (
    <div className="w-full">
      <Script
        id="turnstile-script-auth-form"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />

      {authMode === "signup" && (
        <div className="mb-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-xs font-black text-cyan-100">
          ✨ Create your account and get 3 free AI credits
        </div>
      )}

      <div className="space-y-2.5">
        <button
          type="button"
          disabled={!!loading}
          onClick={() => handleOAuth("google")}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white/85 disabled:opacity-50"
        >
          <FcGoogle size={20} />
          {loading === "google" ? "Continuing..." : "Continue with Google"}
        </button>

        <button
          type="button"
          disabled={!!loading}
          onClick={() => handleOAuth("apple")}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white/85 disabled:opacity-50"
        >
          <FaApple size={20} />
          {loading === "apple" ? "Continuing..." : "Continue with Apple"}
        </button>
      </div>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[10px] font-black text-white/35">OR</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="space-y-3">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          inputMode="email"
          autoComplete="email"
          maxLength={254}
          className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/35"
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={authMode === "login" ? "current-password" : "new-password"}
            maxLength={128}
            className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 pr-12 text-sm text-white outline-none placeholder:text-white/35"
          />

          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-white/45"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        <div className="flex min-h-[62px] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1.5">
          <div ref={captchaRef} className="max-w-full scale-[0.82] sm:scale-95" />
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-300">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handlePasswordAuth}
          disabled={!!loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 font-black text-white disabled:opacity-50"
        >
          {loading === "password"
            ? authMode === "login"
              ? "Signing in..."
              : "Creating..."
            : authMode === "login"
              ? "Sign in"
              : "Create account"}

          <Zap size={17} />
        </button>

        <button
          type="button"
          onClick={() => {
            setAuthMode((prev) => (prev === "login" ? "signup" : "login"));
            setError("");
            resetCaptcha();
          }}
          className="w-full text-center text-sm font-bold text-fuchsia-300"
        >
          {authMode === "login"
            ? "Don’t have an account? Sign up"
            : "Already have account? Login"}
        </button>
      </div>
    </div>
  );
}
