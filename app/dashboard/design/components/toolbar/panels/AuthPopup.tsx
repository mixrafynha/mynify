"use client";

import { useState } from "react";
import {
  X,
  Lock,
  Loader2,
  Sparkles,
  Gift,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function AuthPopup({
  open,
  onClose,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<"offer" | "auth">("offer");
  const [mode, setMode] = useState<"signup" | "login">("signup");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  function closePopup() {
    setStep("offer");
    setMode("signup");
    setError("");
    onClose();
  }

  async function handleSubmit() {
    try {
      setLoading(true);
      setError("");

      if (!email.trim() || !password.trim()) {
        setError("Please fill all fields.");
        return;
      }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }

      onSuccess?.();
      closePopup();
    } catch (err: any) {
      setError(err?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 px-4 backdrop-blur-xl">
      <div className="relative w-full max-w-md overflow-hidden rounded-[34px] border border-white/10 bg-[#07111f] p-6 shadow-[0_0_90px_rgba(34,211,238,0.18)]">
        <button
          type="button"
          onClick={closePopup}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
        >
          <X size={18} />
        </button>

        {step === "offer" ? (
          <>
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 via-violet-500 to-fuchsia-500 shadow-[0_0_40px_rgba(34,211,238,0.25)]">
              <Gift size={28} className="text-white" />
            </div>

            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">
              <Sparkles size={13} />
              Free AI Credits
            </div>

            <h3 className="text-3xl font-black leading-tight text-white">
              Create your account and get{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                3 AI credits
              </span>
            </h3>

            <p className="mt-4 text-sm font-semibold leading-relaxed text-slate-300">
              Sign up for free to unlock AI generation and create premium
              transparent designs directly inside this editor.
            </p>

            <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 px-4 py-4 text-sm font-black text-cyan-100">
              ✨ Includes 3 free AI generations
            </div>

            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setStep("auth");
              }}
              className="mt-6 flex h-13 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 px-5 py-4 font-black text-white transition active:scale-[0.98]"
            >
              Claim 3 free AI credits
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("login");
                setStep("auth");
              }}
              className="mt-4 w-full text-center text-sm font-bold text-white/60 transition hover:text-cyan-300"
            >
              Already have an account? Login
            </button>
          </>
        ) : (
          <>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-violet-500 to-fuchsia-500">
              <Lock size={24} />
            </div>

            <h3 className="text-2xl font-black text-white">
              {mode === "signup" ? "Create free account" : "Login"}
            </h3>

            <p className="mt-3 text-sm font-semibold text-slate-300">
              {mode === "signup"
                ? "Get 3 free AI credits and continue generating premium designs."
                : "Login to continue generating designs."}
            </p>

            <div className="mt-5 space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#11192d] px-4 py-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-400/40"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#11192d] px-4 py-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-400/40"
              />
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 font-black text-white transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Loading...
                </>
              ) : mode === "signup" ? (
                "Create account"
              ) : (
                "Login"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode((prev) =>
                  prev === "signup" ? "login" : "signup"
                );
                setError("");
              }}
              className="mt-4 w-full text-center text-sm font-bold text-cyan-300"
            >
              {mode === "signup"
                ? "Already have account? Login"
                : "Create free account"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("offer");
                setError("");
              }}
              className="mt-3 w-full text-center text-xs font-bold text-white/40 hover:text-white/70"
            >
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
