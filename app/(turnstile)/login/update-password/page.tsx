"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const isStrongPassword = (value: string) =>
  value.length >= 10 &&
  value.length <= 128 &&
  /[A-Z]/.test(value) &&
  /[a-z]/.test(value) &&
  /[0-9]/.test(value) &&
  /[^A-Za-z0-9]/.test(value);

const safeRoute = (path: string) => {
  if (typeof path !== "string") return "/";
  if (path.startsWith("javascript:")) return "/";
  if (path.startsWith("data:")) return "/";
  return path;
};

export default function UpdatePassword() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
      }
    });
  }, [router]);

  const handleUpdate = async () => {
    if (loading) return;

    setError("");

    if (!isStrongPassword(password)) {
      setError("Password must have 10+ characters, uppercase, lowercase, number and symbol.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      router.replace("/dashboard");
    } catch {
      setError("Update failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-[100dvh] bg-[#03030a] text-white md:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#03030a] text-white md:flex">
        <Image
          src="https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=72"
          alt=""
          fill
          sizes="(min-width: 768px) 50vw, 0vw"
          className="object-cover opacity-45"
          aria-hidden="true"
        />

        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 flex flex-col justify-center items-start p-12 w-full">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white text-black w-10 h-10 flex items-center justify-center rounded-lg font-bold">
                R
              </div>
              <span className="text-xl font-black tracking-tight">
                RYFIO
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

      <div className="relative flex items-center justify-center overflow-hidden bg-[#03030a] px-4 py-5 sm:p-6">
        <div className="relative w-full max-w-md rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-5 shadow-[0_0_35px_rgba(168,85,247,0.10)] backdrop-blur-xl sm:rounded-3xl sm:p-8">
          <button
            onClick={() => router.push(safeRoute("/login"))}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-white"
          >
            ✕
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 font-black text-white shadow-[0_0_30px_rgba(168,85,247,0.45)]">
              R
            </div>
            <span className="text-xl font-black tracking-tight">
              RYFIO
            </span>
          </div>

          <h2 className="mb-5 text-2xl font-black uppercase sm:mb-6">
            Update password
          </h2>

          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-[16px] text-white outline-none transition placeholder:text-white/35 focus:border-purple-500/60 focus:bg-white/10 focus:ring-2 focus:ring-purple-500/20"
            />

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              type="button"
              onClick={handleUpdate}
              disabled={loading || !password}
              className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 py-3.5 font-bold text-white shadow-[0_0_35px_rgba(168,85,247,0.35)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
