"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Eye, EyeOff, Zap } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const sanitizeEmail = (value: string) =>
  value.toLowerCase().replace(/[^\w@.\-+]/gi, "").trim().slice(0, 254);

const safeOrigin = () =>
  typeof window === "undefined" ? "" : window.location.origin;

type Props = {
  mode?: "login" | "signup";
  popup?: boolean;
  onSuccess?: () => void;

  // produto do editor
  productType?: "tshirt" | "mug" | "bag" | "hoodie" | "cap";
};

export default function AuthForm({
  mode = "signup",
  popup = false,
  onSuccess,
  productType = "tshirt",
}: Props) {
  const router = useRouter();

  const [authMode, setAuthMode] = useState(mode);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState<
    false | "password" | "google" | "apple"
  >(false);

  const [error, setError] = useState("");

  const captchaRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    setAuthMode(mode);
  }, [mode]);

  // ---------------------------------
  // REDIRECT AUTOMÁTICO APÓS LOGIN
  // ---------------------------------
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) return;

      if (popup) {
        onSuccess?.();
        return;
      }

      router.replace(`/editor?type=${productType}`);
    });

    return () => subscription.unsubscribe();
  }, [popup, onSuccess, router, productType]);

  // ---------------------------------
  // CAPTCHA
  // ---------------------------------
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

        "expired-callback": () => {
          setToken("");
        },

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

  // ---------------------------------
  // LOGIN EMAIL + SENHA
  // ---------------------------------
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
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: safeEmail,
            password,
            options: {
              captchaToken: token,
            },
          });

        if (error || !data.session) {
          throw error || new Error("No session");
        }

        // redirect imediato
        router.replace(`/editor?type=${productType}`);
      } else {
        const { error } =
          await supabase.auth.signUp({
            email: safeEmail,
            password,
            options: {
              captchaToken: token,
            },
          });

        if (error) throw error;

        router.replace(`/editor?type=${productType}`);
      }
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
  }, [
    authMode,
    email,
    password,
    token,
    loading,
    router,
    productType,
    resetCaptcha,
  ]);

  // ---------------------------------
  // GOOGLE / APPLE
  // ---------------------------------
  const handleOAuth = useCallback(
    async (provider: "google" | "apple") => {
      if (loading) return;

      setLoading(provider);
      setError("");

      try {
        const redirectTo =
          `${safeOrigin()}/auth/callback?next=` +
          encodeURIComponent(
            `/editor?type=${productType}`
          );

        const { error } =
          await supabase.auth.signInWithOAuth({
            provider,

            options: {
              redirectTo,

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
    [loading, productType]
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
          ✨ Create account and get 3 free AI credits
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

          {loading === "google"
            ? "Continuing..."
            : "Continue with Google"}
        </button>

        <button
          type="button"
          disabled={!!loading}
          onClick={() => handleOAuth("apple")}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white/85 disabled:opacity-50"
        >
          <FaApple size={20} />

          {loading === "apple"
            ? "Continuing..."
            : "Continue with Apple"}
        </button>
      </div>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[10px] font-black text-white/35">
          OR
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="space-y-3">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white"
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Password"
            className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 pr-12 text-sm text-white"
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword((p) => !p)
            }
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showPassword ? (
              <EyeOff size={17} />
            ) : (
              <Eye size={17} />
            )}
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
          <div ref={captchaRef} />
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
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 font-black text-white"
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
      </div>
    </div>
  );
}
