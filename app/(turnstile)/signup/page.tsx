"use client";

import SignupForm from "../../components/SignupForm";
import Image from "next/image";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { PackageCheck, X } from "lucide-react";
import { supabase } from "../../../lib/supabase";

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
  return `${url}?auto=format&fit=crop&w=${w}&q=64`;
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
      } catch {
        setLoadingProvider(null);
      }
    },
    [loadingProvider]
  );

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#03030a] text-white">
      <div className="grid min-h-[100dvh] grid-cols-1 md:grid-cols-2">
        {/* LEFT */}
        <div className="relative hidden min-h-[100dvh] overflow-hidden bg-[#03030a] text-white md:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_32%,rgba(168,85,247,0.35),transparent_28%),radial-gradient(circle_at_58%_52%,rgba(14,165,233,0.25),transparent_24%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />

          <Image
            src={img(bgImage)}
            alt="Business background"
            fill
            sizes="(min-width: 768px) 50vw, 0vw"
            className="object-cover opacity-35"
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,#03030a_0%,rgba(3,3,10,0.85)_45%,rgba(3,3,10,0.45)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.25),transparent_45%)]" />

          <div className="relative z-10 flex h-full w-full flex-col justify-center px-8 py-10 lg:px-12 lg:py-12">
            <div className="max-w-md">
              <div className="mb-8 flex items-center gap-3">
                <Image
                  src="/favicon.ico"
                  alt="Ryfio"
                  width={49}
                  height={49}
                  priority
                  className="h-[49px] w-[49px] shrink-0 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.45)] ring-1 ring-white/10"
                />

                <span className="text-xl font-black tracking-tight">
                  RYFIO
                </span>
              </div>

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-500/60 bg-purple-500/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-white/85 shadow-[0_0_22px_rgba(168,85,247,0.35)]">
                <PackageCheck size={15} className="text-purple-400" />
                Start your product brand
              </div>

              <h1 className="mb-5 text-5xl font-black uppercase leading-[0.9] tracking-tight lg:text-7xl">
                Create{" "}
                <span className="block bg-gradient-to-r from-violet-300 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                  custom products.
                </span>
              </h1>

              <p className="max-w-md text-lg leading-relaxed text-white/65">
                Create custom products, launch your brand, and sell
                worldwide — all in one place.
              </p>
            </div>

            <div className="absolute bottom-10 left-12 text-sm tracking-wide text-white/45">
              Trusted by thousands of creators worldwide
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="relative flex min-h-[100dvh] w-full overflow-hidden bg-[#03030a]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(168,85,247,0.22),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(14,165,233,0.16),transparent_28%)]" />

          <div className="relative flex min-h-[100dvh] w-full flex-col px-4 py-5 sm:px-8 md:px-10">
            <button
              type="button"
              onClick={goHome}
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex flex-1 items-center justify-center py-8 sm:py-10">
              <div className="relative w-full max-w-md rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-5 text-center shadow-[0_0_35px_rgba(168,85,247,0.10)] backdrop-blur-xl md:text-left sm:rounded-3xl sm:p-8">
                {/* LOGO */}
                <div className="mb-5 flex items-center justify-center gap-3 md:justify-start sm:mb-6">
                  <Image
                    src="/favicon.ico"
                    alt="Ryfio"
                    width={49}
                    height={49}
                    priority
                    className="h-[49px] w-[49px] shrink-0 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.40)] ring-1 ring-white/10"
                  />

                  <span className="text-xl font-black tracking-tight sm:text-2xl">
                    RYFIO
                  </span>
                </div>

                <h2 className="mb-2 text-2xl font-black uppercase sm:text-3xl">
                  Create your account
                </h2>

                <p className="mb-5 text-sm leading-relaxed text-white/50 sm:mb-6">
                  Sign up and start building your custom product brand today.
                </p>

                {/* SOCIAL */}
                <div className="mb-5 space-y-3 sm:mb-6">
                  <button
                    type="button"
                    onClick={() => handleOAuth("google")}
                    disabled={loadingProvider !== null}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 font-semibold text-white/85 transition hover:border-purple-500/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 font-semibold text-white/85 transition hover:border-purple-500/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FaApple size={20} />
                    {loadingProvider === "apple"
                      ? "Connecting..."
                      : "Continue with Apple"}
                  </button>
                </div>

                <div className="my-5 flex items-center gap-3 sm:my-6">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs font-bold text-white/35">OR</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <SignupForm />

                <p className="mt-5 text-center text-sm text-white/50 md:text-left sm:mt-6">
                  Already have an account?{" "}
                  <span
                    onClick={goLogin}
                    className="cursor-pointer font-bold text-fuchsia-400 transition hover:text-purple-300"
                  >
                    Log in
                  </span>
                </p>

                <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-purple-600/20 blur-[60px]" />
                <div className="pointer-events-none absolute -left-10 top-20 h-24 w-24 rounded-full bg-sky-500/10 blur-[50px]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
