"use client";

import SignupForm from "../components/SignupForm";
import Image from "next/image";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { supabase } from "../../lib/supabase";

/* =========================
   🔐 SECURITY HELPERS
========================= */

const safeUrl = (url: string) => {
  if (typeof url !== "string") return "/";
  const clean = url.trim().toLowerCase();
  if (clean.startsWith("javascript:")) return "/";
  if (clean.startsWith("data:")) return "/";
  return url;
};

const img = (url: string, w: number = 1600) => {
  if (typeof url !== "string") return "";
  if (!url.startsWith("http")) return "";
  return `${url}?auto=format&fit=crop&w=${w}&q=85`;
};

const bgImage =
  "https://images.unsplash.com/photo-1556745757-8d76bdb6984b";

export default function SignupPage() {
  const router = useRouter();

  const [loadingProvider, setLoadingProvider] = useState<
    "google" | "apple" | null
  >(null);

  const goHome = useCallback(() => {
    router.replace(safeUrl("/"));
  }, [router]);

  const goLogin = useCallback(() => {
    router.replace(safeUrl("/login"));
  }, [router]);

  const handleOAuth = useCallback(
    async (provider: "google" | "apple") => {
      if (!provider) return;
      if (loadingProvider !== null) return;

      setLoadingProvider(provider);

      try {
        if (typeof window === "undefined") return;

        const origin = window.location.origin;
        const redirectTo = `${origin}/auth/callback`;

        await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
          },
        });
      } catch (err) {
        console.error("OAuth error:", err);
        setLoadingProvider(null);
      }
    },
    [loadingProvider]
  );

  return (
    <div className="min-h-[100dvh] grid grid-cols-1 md:grid-cols-2 w-full m-0 p-0 overflow-x-hidden">
      {/* LEFT */}
      <div className="hidden md:flex relative bg-black text-white overflow-hidden min-h-[100dvh]">
        <Image
          src={img(bgImage)}
          alt="Business background"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

        <div className="relative z-10 flex flex-col justify-between w-full h-full px-8 lg:px-10 py-10 lg:py-12">
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-4 tracking-tight">
              BUILD YOUR <br /> ONLINE BUSINESS
            </h1>

            <p className="text-gray-200 max-w-md text-base lg:text-lg leading-relaxed tracking-wide">
              Launch your brand, customize premium products, and start selling worldwide — all in one place.
            </p>
          </div>

          <div className="text-sm text-gray-300 tracking-wide">
            Trusted by thousands of creators worldwide
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full min-h-[100dvh] bg-[#f5f5f3] flex">
        <div className="relative w-full min-h-[100dvh] flex flex-col px-5 sm:px-8 md:px-10 py-6">
          <button
            type="button"
            onClick={goHome}
            className="absolute top-4 right-4 text-gray-500 hover:text-black z-20"
          >
            ✕
          </button>

          <div className="flex-1 flex items-center justify-center py-10">
            <div className="w-full max-w-md text-center md:text-left">
              {/* LOGO */}
              <div className="flex items-center gap-3 mb-6 justify-center md:justify-start">
                <div className="bg-black text-white w-10 h-10 flex items-center justify-center rounded-lg font-bold shrink-0">
                  M
                </div>
                <span className="text-xl sm:text-2xl font-extrabold">
                  MYNIFY
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold mb-6">
                Create your account
              </h2>

              {/* SOCIAL */}
              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  onClick={() => handleOAuth("google")}
                  disabled={loadingProvider !== null}
                  className="w-full border py-3.5 px-4 rounded-lg bg-white flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <FcGoogle size={20} />
                  {loadingProvider === "google"
                    ? "Connecting..."
                    : "Continue with Google"}
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuth("apple")}
                  disabled={loadingProvider !== null}
                  className="w-full border py-3.5 px-4 rounded-lg bg-white flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <FaApple size={20} />
                  {loadingProvider === "apple"
                    ? "Connecting..."
                    : "Continue with Apple"}
                </button>
              </div>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-300" />
                <span className="text-xs text-gray-500">OR</span>
                <div className="flex-1 h-px bg-gray-300" />
              </div>

              <SignupForm />

              <p className="text-sm text-gray-600 mt-6 text-center md:text-left">
                Already have an account?{" "}
                <span
                  onClick={goLogin}
                  className="font-semibold cursor-pointer hover:underline"
                >
                  Log in
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
