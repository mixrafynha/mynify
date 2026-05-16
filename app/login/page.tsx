"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Script from "next/script";
import { Eye, EyeOff, Gamepad2, Sparkles, X, Zap } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const safeRoute = (path: string) => {
  if (typeof path !== "string") return "/";
  if (path.startsWith("javascript:")) return "/";
  if (path.startsWith("data:")) return "/";
  return path;
};

const sanitize = (value: string) =>
  value
    .replace(/[^\w@.\-+]/gi, "")
    .trim()
    .slice(0, 254);

const sendLoginLog = async (data: {
  userId?: string;
  email?: string | null;
  provider: "password" | "google" | "apple";
}) => {
  try {
    await fetch("/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      body: JSON.stringify({
        event: "login",
        level: "info",
        data,
      }),
    });
  } catch {
    // Não bloqueia o login se o log falhar
  }
};

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  const captchaRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const manualLoginRef = useRef(false);

  useEffect(() => {
    let ignore = false;
    let redirected = false;

    const safeRedirect = () => {
      if (redirected) return;
      redirected = true;
      router.replace("/dashboard");
    };

    supabase.auth.getSession().then(({ data }) => {
      if (ignore) return;

      if (data?.session?.user) {
        safeRedirect();
      } else {
        setChecking(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (ignore) return;

      if (manualLoginRef.current) return;

      if (session?.user) {
        safeRedirect();
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (checking) return;

    const interval = setInterval(() => {
      const turnstile = (window as any).turnstile;

      if (!turnstile) return;
      if (!captchaRef.current) return;
      if (widgetIdRef.current) return;

      const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

      if (!sitekey) {
        setError("Missing captcha site key");
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
          setError("Captcha error");
        },
      });

      clearInterval(interval);
    }, 200);

    return () => clearInterval(interval);
  }, [checking]);

  const resetCaptcha = useCallback(() => {
    const turnstile = (window as any).turnstile;

    if (turnstile && widgetIdRef.current) {
      turnstile.reset(widgetIdRef.current);
    }

    setToken("");
  }, []);

  const handleLogin = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    setError("");
    manualLoginRef.current = true;

    try {
      const safeEmail = sanitize(email.toLowerCase());

      if (!safeEmail || !password) {
        throw new Error("invalid");
      }

      if (safeEmail.length < 5) {
        throw new Error("invalid");
      }

      if (!token) {
        setError("Verify captcha");
        setLoading(false);
        manualLoginRef.current = false;
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: safeEmail,
        password,
        options: {
          captchaToken: token,
        },
      });

      if (error) throw error;

      if (!data.session) {
        throw new Error("No session created");
      }

      await sendLoginLog({
        userId: data.session.user.id,
        email: data.session.user.email,
        provider: "password",
      });

      router.replace("/dashboard");
    } catch {
      manualLoginRef.current = false;
      setError("Invalid email or password");
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  }, [email, password, token, loading, router, resetCaptcha]);

  const handleGoogle = useCallback(async () => {
    if (loading) return;

    setLoading(true);

    try {
      if (typeof window === "undefined") return;

      await sendLoginLog({
        provider: "google",
      });

      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch {
      setLoading(false);
    }
  }, [loading]);

  const handleApple = useCallback(async () => {
    if (loading) return;

    setLoading(true);

    try {
      if (typeof window === "undefined") return;

      await sendLoginLog({
        provider: "apple",
      });

      await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch {
      setLoading(false);
    }
  }, [loading]);

  if (checking) return null;

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#03030a] text-white">
      <Script
        id="turnstile-script-login"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />

      <div className="grid min-h-[100dvh] md:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-[#03030a] text-white md:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_32%,rgba(168,85,247,0.35),transparent_28%),radial-gradient(circle_at_58%_52%,rgba(14,165,233,0.25),transparent_24%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />

          <img
            src="https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1600&auto=format&fit=crop"
            className="absolute inset-0 h-full w-full object-cover opacity-35"
            alt="background"
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,#03030a_0%,rgba(3,3,10,0.85)_45%,rgba(3,3,10,0.45)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.25),transparent_45%)]" />

          <div className="relative z-10 flex w-full flex-col justify-center p-12">
            <div className="max-w-md">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 font-black text-white shadow-[0_0_30px_rgba(168,85,247,0.55)]">
                  M
                </div>

                <span className="text-xl font-black tracking-tight">
                  MYNIFY
                </span>
              </div>

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-500/60 bg-purple-500/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-white/85 shadow-[0_0_22px_rgba(168,85,247,0.35)]">
                <Gamepad2 size={15} className="text-purple-400" />
                Welcome back creator
              </div>

              <h1 className="mb-5 text-5xl font-black uppercase leading-[0.9] tracking-tight lg:text-7xl">
                Welcome{" "}
                <span className="block bg-gradient-to-r from-violet-300 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                  back.
                </span>
              </h1>

              <p className="text-lg leading-relaxed text-white/65">
                Log in to manage your store, orders, and grow your brand
                worldwide.
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#03030a] px-4 py-6 sm:px-6 md:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(168,85,247,0.22),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(14,165,233,0.16),transparent_28%)]" />

          <div className="relative w-full max-w-md rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-5 shadow-[0_0_50px_rgba(168,85,247,0.12)] backdrop-blur-xl sm:rounded-3xl sm:p-8">
            <button
              onClick={() => router.push(safeRoute("/"))}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-white sm:right-4 sm:top-4"
            >
              <X size={18} />
            </button>

            <div className="mb-6 flex items-center gap-3 pr-12">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 font-black text-white shadow-[0_0_30px_rgba(168,85,247,0.45)] sm:h-11 sm:w-11">
                M
              </div>

              <span className="text-lg font-black tracking-tight sm:text-xl">
                MYNIFY
              </span>
            </div>

            <h2 className="mb-2 text-2xl font-black uppercase sm:text-3xl">
              Welcome back
            </h2>

            <p className="mb-5 text-sm leading-relaxed text-white/50 sm:mb-6">
              Sign in to continue building your custom product brand.
            </p>

            <div className="mb-5 space-y-3 sm:mb-6">
              <button
                disabled={loading}
                onClick={handleGoogle}
                className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-semibold text-white/85 transition hover:border-purple-500/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
              >
                <FcGoogle size={20} />
                Continue with Google
              </button>

              <button
                disabled={loading}
                onClick={handleApple}
                className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-semibold text-white/85 transition hover:border-purple-500/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
              >
                <FaApple size={20} />
                Continue with Apple
              </button>
            </div>

            <div className="my-5 flex items-center gap-3 sm:my-6">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-bold text-white/35">OR</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="space-y-4 sm:space-y-5">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                inputMode="email"
                autoComplete="email"
                className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-base text-white outline-none transition placeholder:text-white/35 focus:border-purple-500/60 focus:bg-white/10 focus:ring-2 focus:ring-purple-500/20 sm:py-4"
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-base text-white outline-none transition placeholder:text-white/35 focus:border-purple-500/60 focus:bg-white/10 focus:ring-2 focus:ring-purple-500/20 sm:py-4"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-white/45 transition hover:bg-white/5 hover:text-purple-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex justify-end">
                <span
                  onClick={() => router.push("/login/forgot-password")}
                  className="cursor-pointer text-sm font-semibold text-fuchsia-400 transition hover:text-purple-300"
                >
                  Forgot password?
                </span>
              </div>

              <div className="flex min-h-[70px] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2">
                <div
                  ref={captchaRef}
                  className="max-w-full scale-[0.92] sm:scale-100"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="flex min-h-13 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-4 font-bold text-white shadow-[0_0_35px_rgba(168,85,247,0.45)] transition active:scale-[0.98] hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? "Signing in..." : "Sign in"}
                <Zap size={18} />
              </button>

              <p className="text-center text-sm text-white/50">
                Don’t have an account?{" "}
                <span
                  onClick={() => router.push("/signup")}
                  className="cursor-pointer font-bold text-fuchsia-400 transition hover:text-purple-300"
                >
                  Sign up
                </span>
              </p>
            </div>

            <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-purple-600/20 blur-[60px]" />
            <div className="pointer-events-none absolute -left-10 top-20 h-24 w-24 rounded-full bg-sky-500/10 blur-[50px]" />
          </div>
        </div>
      </div>
    </main>
  );
}
