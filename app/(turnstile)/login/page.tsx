"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Eye, EyeOff, PackageCheck, X, Zap } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128; // prevent bcrypt DoS

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safeRoute = (path: string): string => {
  if (typeof path !== "string") return "/";
  if (path.startsWith("javascript:")) return "/";
  if (path.startsWith("data:")) return "/";
  return path;
};

/**
 * Sanitise e-mail: allow only characters valid per RFC 5321/5322 local part
 * plus the @ and domain characters. Does NOT strip characters silently without
 * feedback — caller should validate after sanitising.
 */
const sanitizeEmail = (value: string): string =>
  value
    .replace(/[^\w@.!\#$%&'*+/=?^`{|}~\-]/gi, "")
    .trim()
    .slice(0, 254);

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isValidPassword = (value: string): boolean =>
  value.length >= PASSWORD_MIN_LENGTH && value.length <= PASSWORD_MAX_LENGTH;

// ─── Component ────────────────────────────────────────────────────────────────

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

  // ── Session check & auth listener ──────────────────────────────────────────

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
      if (session?.user) safeRedirect();
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [router]);

  // ── Turnstile CAPTCHA init ──────────────────────────────────────────────────

  useEffect(() => {
    if (checking) return;

    const interval = setInterval(() => {
      const turnstile = getTurnstile();

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
          setError("Captcha error — please try again");
        },
      });

      clearInterval(interval);
    }, 200);

    return () => clearInterval(interval);
  }, [checking]);

  // ── Reset CAPTCHA ───────────────────────────────────────────────────────────

  const resetCaptcha = useCallback(() => {
    const turnstile = getTurnstile();
    if (turnstile && widgetIdRef.current) {
      turnstile.reset(widgetIdRef.current);
    }
    setToken("");
  }, []);

  // ── Login ───────────────────────────────────────────────────────────────────

  const handleLogin = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const safeEmail = sanitizeEmail(email.toLowerCase());

      // Validate email
      if (!safeEmail || !isValidEmail(safeEmail)) {
        setError("Please enter a valid email address");
        return;
      }

      // Validate password length (prevent bcrypt DoS & catch empty input)
      if (!isValidPassword(password)) {
        setError(
          password.length === 0
            ? "Password is required"
            : password.length < PASSWORD_MIN_LENGTH
            ? `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
            : "Password is too long"
        );
        return;
      }

      // Require CAPTCHA token
      if (!token) {
        setError("Please complete the captcha");
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: safeEmail,
          password,
          options: { captchaToken: token },
        }
      );

      if (authError) throw authError;

      if (!data.session) {
        throw new Error("No session created");
      }

      router.replace("/dashboard");
    } catch (err: unknown) {
      setError("Invalid email or password");
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  }, [email, password, token, loading, router, resetCaptcha]);

  // ── OAuth ───────────────────────────────────────────────────────────────────

  const handleGoogle = useCallback(async () => {
    if (loading || typeof window === "undefined") return;
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    } catch {
      setError("Could not sign in with Google. Please try again.");
      setLoading(false);
    }
  }, [loading]);

  const handleApple = useCallback(async () => {
    if (loading || typeof window === "undefined") return;
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    } catch {
      setError("Could not sign in with Apple. Please try again.");
      setLoading(false);
    }
  }, [loading]);

  // ── Render guard ────────────────────────────────────────────────────────────

  if (checking) return null;

  // ── JSX ─────────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#03030a] text-white">

      <div className="grid min-h-[100dvh] md:grid-cols-2">
        {/* ── Left panel ── */}
        <div className="relative hidden overflow-hidden bg-[#03030a] text-white md:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_32%,rgba(168,85,247,0.35),transparent_28%),radial-gradient(circle_at_58%_52%,rgba(14,165,233,0.25),transparent_24%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />

          <Image
            src="https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=72"
            alt=""
            fill
            sizes="(min-width: 768px) 50vw, 0vw"
            className="object-cover opacity-35"
            aria-hidden="true"
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,#03030a_0%,rgba(3,3,10,0.85)_45%,rgba(3,3,10,0.45)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.25),transparent_45%)]" />

          <div className="relative z-10 flex w-full flex-col justify-center p-12">
            <div className="max-w-md">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 font-black text-white shadow-[0_0_30px_rgba(168,85,247,0.55)]">
                  R
                </div>
                <span className="text-xl font-black tracking-tight">RYFIO</span>
              </div>

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-500/60 bg-purple-500/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-white/85 shadow-[0_0_22px_rgba(168,85,247,0.35)]">
                <PackageCheck size={15} className="text-purple-400" />
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

        {/* ── Right panel (form) ── */}
        <div className="relative flex items-center justify-center overflow-hidden bg-[#03030a] px-4 py-5 sm:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(168,85,247,0.22),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(14,165,233,0.16),transparent_28%)]" />

          <div className="relative w-full max-w-md rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-5 shadow-[0_0_35px_rgba(168,85,247,0.10)] backdrop-blur-xl sm:rounded-3xl sm:p-8">
            <button
              onClick={() => router.push(safeRoute("/"))}
              aria-label="Go back to home"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="mb-5 flex items-center gap-3 sm:mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 font-black text-white shadow-[0_0_30px_rgba(168,85,247,0.45)]">
                R
              </div>
              <span className="text-xl font-black tracking-tight">RYFIO</span>
            </div>

            <h2 className="mb-2 text-2xl font-black uppercase sm:text-3xl">Welcome back</h2>

            <p className="mb-5 text-sm leading-relaxed text-white/50 sm:mb-6">
              Sign in to continue building your custom product brand.
            </p>

            {/* OAuth buttons */}
            <div className="mb-5 space-y-3 sm:mb-6">
              <button
                disabled={loading}
                onClick={handleGoogle}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-3.5 font-semibold text-white/85 transition hover:border-purple-500/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FcGoogle size={20} />
                Continue with Google
              </button>

              <button
                disabled={loading}
                onClick={handleApple}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-3.5 font-semibold text-white/85 transition hover:border-purple-500/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
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

            {/* Credentials form */}
            <div className="space-y-4 sm:space-y-5">
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
                placeholder="Email"
                aria-label="Email address"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-[16px] text-white outline-none transition placeholder:text-white/35 focus:border-purple-500/60 focus:bg-white/10 focus:ring-2 focus:ring-purple-500/20"
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  aria-label="Password"
                  maxLength={PASSWORD_MAX_LENGTH}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-[16px] text-white outline-none transition placeholder:text-white/35 focus:border-purple-500/60 focus:bg-white/10 focus:ring-2 focus:ring-purple-500/20"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/45 transition hover:text-purple-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex justify-end">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push("/login/forgot-password")}
                  onKeyDown={(e) =>
                    e.key === "Enter" && router.push("/login/forgot-password")
                  }
                  className="cursor-pointer text-sm font-semibold text-fuchsia-400 transition hover:text-purple-300"
                >
                  Forgot password?
                </span>
              </div>

              {/* CAPTCHA */}
              <div className="flex min-h-[65px] justify-center rounded-2xl border border-white/10 bg-white/5 p-2">
                <div ref={captchaRef} />
              </div>

              {/* Error message */}
              {error && (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300"
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="button"
                onClick={handleLogin}
                disabled={loading || !token}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 py-3.5 font-bold sm:py-4 text-white shadow-[0_0_35px_rgba(168,85,247,0.45)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? "Signing in…" : "Sign in"}
                <Zap size={18} />
              </button>

              <p className="text-center text-sm text-white/50 md:text-left">
                Don&apos;t have an account?{" "}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push("/signup")}
                  onKeyDown={(e) =>
                    e.key === "Enter" && router.push("/signup")
                  }
                  className="cursor-pointer font-bold text-fuchsia-400 transition hover:text-purple-300"
                >
                  Sign up
                </span>
              </p>
            </div>

            {/* Decorative glows */}
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-purple-600/20 blur-[60px]" />
            <div className="pointer-events-none absolute -left-10 top-20 h-24 w-24 rounded-full bg-sky-500/10 blur-[50px]" />
          </div>
        </div>
      </div>
    </main>
  );
}
