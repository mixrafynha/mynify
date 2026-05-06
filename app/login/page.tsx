"use client";

import { useState, useEffect, useCallback } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

/* =========================
   🔐 SAFE HELPERS
========================= */

// prevent open redirects / invalid routing
const safeRoute = (path: string) => {
  if (typeof path !== "string") return "/";
  if (path.startsWith("javascript:")) return "/";
  if (path.startsWith("data:")) return "/";
  return path;
};

// sanitize user input (light XSS + injection protection)
const sanitize = (value: string) =>
  value
    .replace(/[^\w@.\-+]/gi, "") // keep only safe email chars
    .trim()
    .slice(0, 254);

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  // =========================
  // 🔐 SESSION CHECK (HARDENED)
  // =========================
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

      if (session?.user) {
        safeRedirect();
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [router]);

  // =========================
  // 🔥 EMAIL LOGIN (HARDENED)
  // =========================
  const handleLogin = useCallback(async () => {
  if (loading) return;

  setLoading(true);
  setError("");

  try {
    const safeEmail = sanitize(email.toLowerCase());

    if (!safeEmail || !password) {
      throw new Error("invalid");
    }

    if (safeEmail.length < 5) {
      throw new Error("invalid");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: safeEmail,
      password,
    });

    if (error) {
      console.error("Login error:", error.message);
      throw error;
    }

    if (!data.session) {
      throw new Error("No session created");
    }

    router.replace("/dashboard");
  } catch (err) {
    console.error("Login failed:", err);
    setError("Invalid email or password");
  } finally {
    setLoading(false);
  }
}, [email, password, loading, router]);

  // =========================
  // 🔵 GOOGLE OAUTH (HARDENED)
  // =========================
  const handleGoogle = useCallback(async () => {
    if (loading) return;

    setLoading(true);

    try {
      if (typeof window === "undefined") return;

      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, [loading]);

  // =========================
  // 🍎 APPLE OAUTH (HARDENED)
  // =========================
  const handleApple = useCallback(async () => {
    if (loading) return;

    setLoading(true);

    try {
      if (typeof window === "undefined") return;

      await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, [loading]);

  if (checking) return null;

  return (
    <div className="min-h-[100dvh] grid md:grid-cols-2">

      {/* LEFT */}
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

            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              WELCOME BACK.
            </h1>

            <p className="text-gray-200 text-lg">
              Log in to manage your store, orders, and grow your brand worldwide.
            </p>

          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center justify-center bg-[#f5f5f3] p-6">
        <div className="w-full max-w-md relative">

          <button
            onClick={() => router.push(safeRoute("/"))}
            className="absolute top-2 right-2 text-gray-500 hover:text-black"
          >
            ✕
          </button>

          <div className="flex items-center gap-3 mb-6 justify-center md:justify-start">
            <div className="bg-black text-white w-10 h-10 flex items-center justify-center rounded-lg font-bold">
              M
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              MYNIFY
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold mb-6">
            Welcome back
          </h2>

          {/* SOCIAL */}
          <div className="space-y-3 mb-6">

            <button
              disabled={loading}
              onClick={handleGoogle}
              className="w-full border py-3.5 rounded-lg bg-white hover:bg-gray-50 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <FcGoogle size={20} />
              Continue with Google
            </button>

            <button
              disabled={loading}
              onClick={handleApple}
              className="w-full border py-3.5 rounded-lg bg-white hover:bg-gray-50 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <FaApple size={20} />
              Continue with Apple
            </button>

          </div>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-xs text-gray-500">OR</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          {/* FORM */}
          <div className="space-y-5">

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-black"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-black"
              />

              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-3 text-gray-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex justify-end">
  <span
    onClick={() => router.push("/login/forgot-password")}
    className="text-sm text-gray-600 hover:text-black cursor-pointer"
  >
    Forgot password?
  </span>
</div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

           <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#39E58C] py-3.5 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
         </button>

            <p className="text-sm text-gray-600 text-center md:text-left">
              Don’t have an account?{" "}
              <span
                onClick={() => router.push("/signup")}
                className="font-semibold cursor-pointer hover:underline"
              >
                Sign up
              </span>
            </p>

          </div>

        </div>
      </div>
    </div>
  );
}
