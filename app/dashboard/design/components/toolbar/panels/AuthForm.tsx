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
  typeof window === "undefined"
    ? ""
    : window.location.origin;

type Props = {
  mode?: "login" | "signup";
  popup?: boolean;
  onSuccess?: () => void;
  productType?:
    | "tshirt"
    | "mug"
    | "bag"
    | "hoodie"
    | "cap";
};

export default function AuthForm({
  mode = "signup",
  popup = false,
  onSuccess,
}: Props) {
  const router = useRouter();

  const [authMode, setAuthMode] =
    useState(mode);

  const [showPassword, setShowPassword] =
    useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [token, setToken] = useState("");

  const [loading, setLoading] = useState<
    false | "password" | "google" | "apple"
  >(false);

  const [error, setError] = useState("");

  const captchaRef =
    useRef<HTMLDivElement | null>(null);

  const widgetIdRef =
    useRef<string | null>(null);

  useEffect(() => {
    setAuthMode(mode);
  }, [mode]);

  // ---------------------------------
  // FINALIZA LOGIN
  // ---------------------------------
  const finish = useCallback(() => {
    // LOGIN DO POPUP
    if (popup) {
      onSuccess?.();
      return;
    }

    // LOGIN GLOBAL (/login)
    router.replace("/dashboard");
  }, [popup, onSuccess, router]);

  // ---------------------------------
  // CAPTCHA
  // ---------------------------------
  useEffect(() => {
    let tries = 0;

    const interval = window.setInterval(() => {
      tries++;

      const turnstile =
        (window as any).turnstile;

      const sitekey =
        process.env
          .NEXT_PUBLIC_TURNSTILE_SITE_KEY;

      if (!sitekey) {
        setError(
          "Missing captcha site key"
        );

        clearInterval(interval);
        return;
      }

      if (
        !turnstile ||
        !captchaRef.current ||
        widgetIdRef.current
      ) {
        if (tries > 30) {
          clearInterval(interval);
        }

        return;
      }

      widgetIdRef.current =
        turnstile.render(
          captchaRef.current,
          {
            sitekey,

            callback: (
              value: string
            ) => {
              setToken(value);
              setError("");
            },

            "expired-callback": () => {
              setToken("");
            },

            "error-callback": () => {
              setToken("");
              setError(
                "Captcha error"
              );
            },
          }
        );

      clearInterval(interval);
    }, 180);

    return () =>
      clearInterval(interval);
  }, []);

  const resetCaptcha =
    useCallback(() => {
      const turnstile =
        (window as any).turnstile;

      if (
        turnstile &&
        widgetIdRef.current
      ) {
        turnstile.reset(
          widgetIdRef.current
        );
      }

      setToken("");
    }, []);

  // ---------------------------------
  // EMAIL + PASSWORD
  // ---------------------------------
  const handlePasswordAuth =
    useCallback(async () => {
      if (loading) return;

      setLoading("password");
      setError("");

      try {
        const safeEmail =
          sanitizeEmail(email);

        if (
          !safeEmail ||
          safeEmail.length < 5 ||
          !password
        ) {
          throw new Error(
            "invalid"
          );
        }

        if (!token) {
          setError(
            "Verify captcha"
          );

          setLoading(false);
          return;
        }

        if (
          authMode === "login"
        ) {
          const {
            data,
            error,
          } =
            await supabase.auth.signInWithPassword(
              {
                email:
                  safeEmail,
                password,

                options: {
                  captchaToken:
                    token,
                },
              }
            );

          if (
            error ||
            !data.session
          ) {
            throw (
              error ||
              new Error(
                "No session"
              )
            );
          }

          finish();
        } else {
          const { error } =
            await supabase.auth.signUp(
              {
                email:
                  safeEmail,
                password,

                options: {
                  captchaToken:
                    token,
                },
              }
            );

          if (error)
            throw error;

          finish();
        }
      } catch {
        setError(
          authMode ===
            "login"
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
      finish,
      resetCaptcha,
    ]);

  // ---------------------------------
  // GOOGLE / APPLE
  // ---------------------------------
  const handleOAuth =
    useCallback(
      async (
        provider:
          | "google"
          | "apple"
      ) => {
        if (loading)
          return;

        setLoading(provider);
        setError("");

        try {
          const redirectTo =
            popup
              ? `${safeOrigin()}/auth/callback?next=${encodeURIComponent(
                  window.location.pathname +
                    window.location.search
                )}`
              : `${safeOrigin()}/auth/callback`;

          const {
            error,
          } =
            await supabase.auth.signInWithOAuth(
              {
                provider,

                options: {
                  redirectTo,

                  queryParams:
                    {
                      prompt:
                        "select_account",
                    },
                },
              }
            );

          if (error)
            throw error;
        } catch {
          setError(
            "Unable to continue with provider"
          );

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

      {authMode ===
        "signup" && (
        <div className="mb-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-xs font-black text-cyan-100">
          ✨ Create account
          and get 3 free AI
          credits
        </div>
      )}

      <div className="space-y-2.5">
        <button
          type="button"
          disabled={
            !!loading
          }
          onClick={() =>
            handleOAuth(
              "google"
            )
          }
          className="flex h-11 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white/85 disabled:opacity-50"
        >
          <FcGoogle
            size={20}
          />

          {loading ===
          "google"
            ? "Continuing..."
            : "Continue with Google"}
        </button>

        <button
          type="button"
          disabled={
            !!loading
          }
          onClick={() =>
            handleOAuth(
              "apple"
            )
          }
          className="flex h-11 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white/85 disabled:opacity-50"
        >
          <FaApple
            size={20}
          />

          {loading ===
          "apple"
            ? "Continuing..."
            : "Continue with Apple"}
        </button>
      </div>

      {/* resto do JSX permanece igual */}
    </div>
  );
}
