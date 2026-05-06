"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const safeRoute = (path: string) => {
  if (typeof path !== "string") return "/";
  if (path.startsWith("javascript:")) return "/";
  if (path.startsWith("data:")) return "/";
  return path;
};

export default function UpdatePassword() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const captchaRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
      }
    });
  }, [router]);

  useEffect(() => {
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
  }, []);

  const resetCaptcha = useCallback(() => {
    const turnstile = (window as any).turnstile;

    if (turnstile && widgetIdRef.current) {
      turnstile.reset(widgetIdRef.current);
    }

    setToken("");
  }, []);

  const handleUpdate = async () => {
    if (loading) return;

    setError("");

    if (!password) {
      setError("Enter a password");
      return;
    }

    if (!token) {
      setError("Verify captcha");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser(
        {
          password,
        },
        {
          captchaToken: token,
        }
      );

      if (error) throw error;

      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Update failed");
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] grid md:grid-cols-2">
      <Script
        id="turnstile-script-update-password"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />

      <div className="hidden md:flex relative bg-black text-white overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1600&auto=format&fit=crop"
          className="absolute inset-0 w-full h-full object-cover"
          alt="background"
        />

        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 flex flex-col justify-center items-start p-12 w-full">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white text-black w-10 h-10 flex items-center justify-center rounded-lg font-bold">
                M
              </div>
              <span className="text-xl font-extrabold tracking-tight">
                MYNIFY
              </span>
            </div>

            <h1 className="text-4xl font-extrabold mb-4">
              NEW PASSWORD
            </h1>

            <p className="text-gray-200">
              Choose a strong password for your account.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-[#f5f5f3] p-6">
        <div className="w-full max-w-md relative">
          <button
            onClick={() => router.push(safeRoute("/login"))}
            className="absolute top-2 right-2 text-gray-500 hover:text-black"
          >
            ✕
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="bg-black text-white w-10 h-10 flex items-center justify-center rounded-lg font-bold">
              M
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              MYNIFY
            </span>
          </div>

          <h2 className="text-2xl font-extrabold mb-6">
            Update password
          </h2>

          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-black"
            />

            <div className="flex justify-center min-h-[65px]">
              <div ref={captchaRef} />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              type="button"
              onClick={handleUpdate}
              disabled={loading}
              className="w-full bg-[#39E58C] py-3.5 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
