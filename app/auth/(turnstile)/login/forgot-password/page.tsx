"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Turnstile from "../../shared/Turnstile";
import { isValidEmail, safeRoute, sanitizeEmail } from "../../shared/AuthValidation";

export default function ForgotPassword() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const resetCaptcha = useCallback(() => {
    setToken("");
    setResetKey((value) => value + 1);
  }, []);

  const handleReset = useCallback(async () => {
    if (loading) return;

    const normalizedEmail = sanitizeEmail(email);

    setError("");
    setSuccess("");

    if (!isValidEmail(normalizedEmail)) {
      setError("Enter a valid email.");
      return;
    }

    if (!token) {
      setError("Complete the captcha.");
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/login/update-password`,
        captchaToken: token,
      });

      if (resetError) throw resetError;

      setEmail("");
      setSuccess("Reset link sent. Check your email.");
      resetCaptcha();
    } catch {
      setError("Reset failed. Try again.");
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  }, [email, loading, resetCaptcha, token]);

  return (
    <main className="min-h-[100dvh] bg-[#03030a] text-white">
      <div className="grid min-h-[100dvh] md:grid-cols-2">
        <aside className="relative hidden overflow-hidden bg-[#050511] md:block">
          <Image
            src="https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=62"
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
              Recover access.
            </h1>
            <p className="mt-5 max-w-sm text-white/60">
              Enter your email and we will send a secure reset link.
            </p>
          </div>
        </aside>

        <section className="flex min-h-[100dvh] items-center justify-center px-4 py-6 sm:px-6">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-xl sm:p-7">
            <button
              type="button"
              onClick={() => router.push(safeRoute("/login"))}
              className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-white/55 transition hover:text-white"
            >
              <ArrowLeft size={16} /> Back to login
            </button>

            <div className="mb-6 flex items-center gap-3">
              <Image src="/favicon.ico" alt="Ryfio" width={44} height={44} priority className="rounded-xl" />
              <span className="text-xl font-black tracking-tight">RYFIO</span>
            </div>

            <h2 className="text-2xl font-black uppercase">Forgot password</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/50">
              We will send you a reset link if the email exists.
            </p>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-white/35">Email</span>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18} />
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value.trim().toLowerCase())}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-11 py-3.5 text-[16px] text-white outline-none placeholder:text-white/30 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/15"
                  />
                </div>
              </label>

              <Turnstile
                resetKey={resetKey}
                onTokenChange={(value) => {
                  setToken(value);
                  if (value) setError("");
                }}
                onError={setError}
              />

              {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
              {success && <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{success}</p>}

              <button
                type="button"
                onClick={handleReset}
                disabled={loading || !token}
                className="flex w-full items-center justify-center rounded-xl bg-[#8BE04E] px-4 py-3.5 text-[16px] font-black text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
