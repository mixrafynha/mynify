"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Eye, EyeOff, Zap } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { supabase } from "@/lib/supabase";

const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

const sanitizeEmail = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\w@.\-+]/gi, "")
    .trim()
    .slice(0, 254);

const safeOrigin = () => (typeof window === "undefined" ? "" : window.location.origin);

const safeNextPath = () => {
  if (typeof window === "undefined") return "/dashboard";

  const path = window.location.pathname + window.location.search;
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) return "/dashboard";

  return path;
};

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode?: AuthMode;
  popup?: boolean;
  onSuccess?: () => void;
};

export default function AuthForm({ mode = "signup", popup = false, onSuccess }: AuthFormProps) {
  const [authMode, setAuthMode] = useState<AuthMode>(mode);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState<false | "password" | "google" | "apple">(false);
  const [error, setError] = useState("");
  const [captchaReady, setCaptchaReady] = useState(false);

  const captchaRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const renderingRef = useRef(false);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    setAuthMode(mode);
    setError("");
  }, [mode]);

  const renderCaptcha = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!sitekey || !captchaRef.current || widgetIdRef.current || renderingRef.current) return;

    const turnstile = (window as any).turnstile;
    if (!turnstile?.render) return;

    try {
      renderingRef.current = true;
      widgetIdRef.current = turnstile.render(captchaRef.current, {
        sitekey,
        callback: (value: string) => {
          setToken(value);
          setError("");
          setCaptchaReady(true);
        },
        "expired-callback": () => {
          setToken("");
          setCaptchaReady(false);
        },
        "error-callback": () => {
          setToken("");
          setCaptchaReady(false);
          setError("Captcha error. Try again.");
        },
      });
    } catch {
      setError("Captcha unavailable. Refresh and try again.");
    } finally {
      renderingRef.current = false;
    }
  }, [sitekey]);

  useEffect(() => {
    if (!sitekey) {
      setError("Missing captcha site key.");
      return;
    }

    renderCaptcha();
    const timer = window.setTimeout(renderCaptcha, 450);
    return () => window.clearTimeout(timer);
  }, [renderCaptcha, sitekey]);

  useEffect(() => {
    return () => {
      const turnstile = typeof window !== "undefined" ? (window as any).turnstile : null;
      if (turnstile?.remove && widgetIdRef.current) {
        try {
          turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore cleanup failure
        }
      }
      widgetIdRef.current = null;
    };
  }, []);

  const resetCaptcha = useCallback(() => {
    const turnstile = typeof window !== "undefined" ? (window as any).turnstile : null;

    if (turnstile?.reset && widgetIdRef.current) {
      turnstile.reset(widgetIdRef.current);
    }

    setToken("");
    setCaptchaReady(false);
  }, []);

  const finishPasswordLogin = useCallback(() => {
    if (popup) {
      onSuccess?.();
      return;
    }

    window.location.href = "/dashboard";
  }, [popup, onSuccess]);

  const handlePasswordAuth = useCallback(async () => {
    if (loading) return;

    const safeEmail = sanitizeEmail(email);

    if (!safeEmail || safeEmail.length < 5 || !password) {
      setError("Enter your email and password.");
      return;
    }

    if (!token) {
      setError("Verify captcha first.");
      return;
    }

    setLoading("password");
    setError("");

    try {
      if (authMode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: safeEmail,
          password,
          options: { captchaToken: token },
        });

        if (error || !data.session) throw error || new Error("No session");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: safeEmail,
          password,
          options: { captchaToken: token },
        });

        if (error || !data.user) throw error || new Error("Unable to create account");
      }

      finishPasswordLogin();
    } catch {
      setError(authMode === "login" ? "Invalid email or password." : "Unable to create account.");
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  }, [authMode, email, password, token, loading, finishPasswordLogin, resetCaptcha]);

  const handleOAuth = useCallback(
    async (provider: "google" | "apple") => {
      if (loading) return;

      setLoading(provider);
      setError("");

      try {
        const next = popup ? safeNextPath() : "/dashboard";
        const redirectTo = `${safeOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;

        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
            queryParams: { prompt: "select_account" },
          },
        });

        if (error) throw error;
      } catch {
        setError("Unable to continue with provider.");
        setLoading(false);
      }
    },
    [loading, popup]
  );

  const toggleMode = useCallback(() => {
    setAuthMode((prev) => (prev === "login" ? "signup" : "login"));
    setError("");
    resetCaptcha();
  }, [resetCaptcha]);

  return (
    <div className="text-white">
      {sitekey && <Script id="turnstile-script-auth-form" src={TURNSTILE_SRC} strategy="lazyOnload" onLoad={renderCaptcha} onReady={renderCaptcha} />}

      {authMode === "signup" && <p className="mb-4 text-xs font-black text-violet-100">✨ Create your account and get 3 free AI credits</p>}

      <div className="mb-4 grid gap-2">
        <ProviderButton disabled={!!loading} onClick={() => handleOAuth("google")} icon={<FcGoogle size={20} />}>
          {loading === "google" ? "Continuing..." : "Continue with Google"}
        </ProviderButton>

        <ProviderButton disabled={!!loading} onClick={() => handleOAuth("apple")} icon={<FaApple size={20} />}>
          {loading === "apple" ? "Continuing..." : "Continue with Apple"}
        </ProviderButton>
      </div>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] font-black text-white/35">OR</span>
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
          className="min-h-12 w-full rounded-2xl bg-white/[0.055] px-4 py-3 text-base text-white outline-none ring-1 ring-white/10 transition placeholder:text-white/35 focus:bg-white/[0.08] focus:ring-violet-400/50"
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={authMode === "login" ? "current-password" : "new-password"}
            maxLength={128}
            className="min-h-12 w-full rounded-2xl bg-white/[0.055] px-4 py-3 pr-12 text-base text-white outline-none ring-1 ring-white/10 transition placeholder:text-white/35 focus:bg-white/[0.08] focus:ring-violet-400/50"
          />

          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-white/50 transition hover:bg-white/5 hover:text-violet-300"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="flex min-h-[68px] w-full items-center justify-center overflow-hidden rounded-2xl bg-white/[0.035] p-2 ring-1 ring-white/10">
          {sitekey ? <div ref={captchaRef} className="max-w-full scale-[0.88] sm:scale-100" /> : <span className="text-xs font-bold text-red-300">Missing captcha site key</span>}
        </div>

        {error && <p className="text-sm font-medium leading-relaxed text-red-300">{error}</p>}

        <button
          type="button"
          onClick={handlePasswordAuth}
          disabled={!!loading || !captchaReady || !sitekey}
          className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl bg-violet-500 px-4 py-3 text-sm font-black text-white transition hover:bg-violet-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "password" ? (authMode === "login" ? "Signing in..." : "Creating account...") : authMode === "login" ? "Sign in" : "Create account"}
          <Zap size={17} />
        </button>

        <p className="text-center text-sm text-white/50">
          {authMode === "login" ? "Don’t have an account?" : "Already have an account?"} {" "}
          <button type="button" onClick={toggleMode} className="font-bold text-violet-300 transition hover:text-fuchsia-300">
            {authMode === "login" ? "Sign up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

function ProviderButton({ children, icon, disabled, onClick }: { children: React.ReactNode; icon: React.ReactNode; disabled?: boolean; onClick: () => void }) {
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
