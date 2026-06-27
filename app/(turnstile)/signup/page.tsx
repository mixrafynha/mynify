"use client";

import Image from "next/image";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import SignupForm from "./SignupForm";
import { startOAuthSignup } from "./SignupActions";
import { logSignupEvent } from "./SignupLogger";
import { safeRoute } from "./SignupValidation";
import type { SignupLoadingState } from "./types";

export default function SignupPage() {
  const router = useRouter();
  const [loadingProvider, setLoadingProvider] = useState<SignupLoadingState>(false);

  const goHome = useCallback(() => router.replace(safeRoute("/")), [router]);
  const goLogin = useCallback(() => router.replace(safeRoute("/login")), [router]);

  const handleOAuth = useCallback(
    async (provider: "google" | "apple") => {
      if (loadingProvider) return;

      setLoadingProvider(provider);

      const startedAt = Date.now();
      void logSignupEvent({ event: "signup_oauth_started", provider });

      const result = await startOAuthSignup(provider);

      if (!result.ok) {
        const errorName = result.error instanceof Error ? result.error.name : undefined;
        void logSignupEvent({
          event: "signup_oauth_failed",
          level: "error",
          provider,
          durationMs: Date.now() - startedAt,
          errorName,
        });
        setLoadingProvider(false);
      }
    },
    [loadingProvider]
  );

  return (
    <main className="min-h-[100dvh] bg-[#03030a] text-white">
      <div className="grid min-h-[100dvh] md:grid-cols-2">
        <aside className="relative hidden overflow-hidden bg-[#050511] md:block">
          <Image
            src="https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&w=1000&q=62"
            alt=""
            fill
            sizes="(min-width: 768px) 50vw, 0vw"
            className="object-cover opacity-25"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[#03030a]/70" />
          <div className="relative z-10 flex h-full flex-col justify-center p-12">
            <div className="mb-8 flex items-center gap-3">
              <Image src="/favicon.ico" alt="Ryfio" width={44} height={44} className="rounded-xl" />
              <span className="text-xl font-black tracking-tight">RYFIO</span>
            </div>
            <h1 className="max-w-md text-5xl font-black uppercase leading-[0.95] tracking-tight">
              Start your brand.
            </h1>
            <p className="mt-5 max-w-sm text-white/60">
              Create custom products and sell worldwide from one clean dashboard.
            </p>
          </div>
        </aside>

        <section className="relative flex min-h-[100dvh] items-center justify-center px-4 py-6 sm:px-6">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-xl sm:p-7">
            <button
              type="button"
              onClick={goHome}
              aria-label="Go back to home"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/45 transition hover:text-white"
            >
              <X size={18} />
            </button>
            <button
              type="button"
              onClick={goLogin}
              className="mb-6 inline-flex max-w-[calc(100%-56px)] items-center gap-2 text-sm font-semibold text-white/55 transition hover:text-white md:hidden"
            >
              <ArrowLeft size={16} /> Back to login
            </button>

            <div className="mb-6 flex items-center gap-3">
              <Image src="/favicon.ico" alt="Ryfio" width={44} height={44} priority className="rounded-xl" />
              <span className="text-xl font-black tracking-tight">RYFIO</span>
            </div>

            <h2 className="text-2xl font-black uppercase">Create account</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/50">
              Start building custom products today.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={Boolean(loadingProvider)}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 font-semibold text-white/85 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FcGoogle size={20} />
                <span className="hidden sm:inline">Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuth("apple")}
                disabled={Boolean(loadingProvider)}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 font-semibold text-white/85 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaApple size={20} />
                <span className="hidden sm:inline">Apple</span>
              </button>
            </div>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-bold text-white/35">OR</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <SignupForm />

            <p className="mt-5 text-center text-sm text-white/50">
              Already have an account?{" "}
              <button type="button" onClick={goLogin} className="font-bold text-fuchsia-300 transition hover:text-fuchsia-200">
                Log in
              </button>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
