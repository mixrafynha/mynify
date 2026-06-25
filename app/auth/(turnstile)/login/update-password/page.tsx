"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isStrongPassword, safeRoute } from "../../shared/AuthValidation";

export default function UpdatePassword() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    supabase.auth.getSession().then(({ data }) => {
      if (ignore) return;
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setChecking(false);
    });

    return () => {
      ignore = true;
    };
  }, [router]);

  const handleUpdate = useCallback(async () => {
    if (loading) return;

    setError("");

    if (!isStrongPassword(password)) {
      setError("Password must have 10+ characters, uppercase, lowercase, number and symbol.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      router.replace("/dashboard");
    } catch {
      setError("Update failed. Try again.");
    } finally {
      setLoading(false);
    }
  }, [loading, password, router]);

  if (checking) return null;

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
              Set new password.
            </h1>
            <p className="mt-5 max-w-sm text-white/60">
              Choose a strong password to protect your Ryfio account.
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

            <h2 className="text-2xl font-black uppercase">Update password</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/50">
              Use at least 10 characters with uppercase, lowercase, number and symbol.
            </p>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-white/35">New password</span>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18} />
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="New password"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-11 py-3.5 text-[16px] text-white outline-none placeholder:text-white/30 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/15"
                  />
                </div>
              </label>

              {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

              <button
                type="button"
                onClick={handleUpdate}
                disabled={loading || !password}
                className="flex w-full items-center justify-center rounded-xl bg-[#8BE04E] px-4 py-3.5 text-[16px] font-black text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update password"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
