"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import {
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  Settings,
  ShieldCheck,
} from "lucide-react";

type SettingsResponse = {
  email: string;
};

const inputClass =
  "h-14 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-base font-semibold text-white outline-none placeholder:text-white/35 transition focus:border-purple-300 focus:bg-white/[0.08] disabled:cursor-not-allowed disabled:text-white/45";

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-6 py-3 text-base font-black text-white shadow-[0_0_25px_rgba(168,85,247,0.32)] transition hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100";

export default function SettingsPage() {
  const { data, isLoading } = useSWR<SettingsResponse>(
    "/api/settings",
    fetcher
  );

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [loading, setLoading] = useState({
    password: false,
    email: false,
  });

  const [saved, setSaved] = useState({
    password: false,
    email: false,
  });

  useEffect(() => {
    if (data?.email) setNewEmail(data.email);
  }, [data?.email]);

  const passwordScore = useMemo(() => {
    let score = 0;

    if (newPassword.length >= 12) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[a-z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    return score;
  }, [newPassword]);

  const passwordValid =
    currentPassword.length > 0 &&
    newPassword.length >= 12 &&
    passwordScore >= 4 &&
    newPassword === confirmPassword;

  const emailValid =
    newEmail.trim().length > 5 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim()) &&
    newEmail.trim().toLowerCase() !== data?.email?.toLowerCase();

  function flashSaved(key: keyof typeof saved) {
    setSaved((prev) => ({ ...prev, [key]: true }));

    setTimeout(() => {
      setSaved((prev) => ({ ...prev, [key]: false }));
    }, 2500);
  }

  async function changePassword() {
    if (!passwordValid) return;

    setLoading((p) => ({ ...p, password: true }));

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "password",
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    });

    const json = await res.json().catch(() => null);

    setLoading((p) => ({ ...p, password: false }));

    if (!res.ok) {
      alert(json?.error || "Erro ao alterar password");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    flashSaved("password");
  }

  async function changeEmail() {
    if (!emailValid) return;

    setLoading((p) => ({ ...p, email: true }));

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "email",
        newEmail,
      }),
    });

    const json = await res.json().catch(() => null);

    setLoading((p) => ({ ...p, email: false }));

    if (!res.ok) {
      alert(json?.error || "Erro ao enviar confirmação");
      return;
    }

    flashSaved("email");
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#03030a] text-white">
        <div className="flex items-center gap-3 text-white/60">
          <Loader2 className="animate-spin" size={22} />
          <span className="text-base font-semibold">Loading settings...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#03030a] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(168,85,247,0.14),transparent_30%),radial-gradient(circle_at_90%_5%,rgba(14,165,233,0.1),transparent_25%),linear-gradient(180deg,#03030a_0%,#080812_100%)]" />

      <div className="relative z-10 mx-auto max-w-[1050px] px-4 py-6 sm:px-6 md:py-10">
        <header className="mb-10">
          <div className="mb-4 grid h-13 w-13 place-items-center rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-500 shadow-[0_0_25px_rgba(168,85,247,0.35)]">
            <Settings size={24} />
          </div>

          <p className="text-sm font-black uppercase tracking-[0.2em] text-purple-300">
            Settings
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">
            Account security
          </h1>

          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-white/65">
            Atualiza a tua password e email com segurança. Para alterar o email,
            vais receber uma confirmação da Supabase antes da alteração.
          </p>
        </header>

        <div className="grid gap-8">
          <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:p-7">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <Lock className="text-purple-300" size={24} />
                  <h2 className="text-2xl font-black tracking-[-0.03em]">
                    Change password
                  </h2>
                </div>

                <p className="max-w-xl text-base font-medium leading-7 text-white/60">
                  Introduz a password atual, a nova password e confirma a nova
                  password para evitar erros.
                </p>
              </div>

              {saved.password && (
                <span className="hidden items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-black text-emerald-300 sm:inline-flex">
                  <CheckCircle2 size={15} />
                  Updated
                </span>
              )}
            </div>

            <div className="grid gap-5">
              <Field label="Current password">
                <input
                  type="password"
                  className={inputClass}
                  value={currentPassword}
                  maxLength={120}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </Field>

              <Field label="New password">
                <input
                  type="password"
                  className={inputClass}
                  value={newPassword}
                  maxLength={120}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </Field>

              <Field label="Confirm new password">
                <input
                  type="password"
                  className={inputClass}
                  value={confirmPassword}
                  maxLength={120}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-black text-white">
                  Password strength
                </span>
                <span className="text-sm font-bold text-white/50">
                  {passwordScore}/5
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-2.5 rounded-full ${
                      passwordScore >= i
                        ? "bg-gradient-to-r from-purple-500 to-fuchsia-400"
                        : "bg-white/10"
                    }`}
                  />
                ))}
              </div>

              <div className="mt-4 grid gap-2 text-sm font-medium text-white/60 sm:grid-cols-2">
                <p>✓ Minimum 12 characters</p>
                <p>✓ Uppercase letter</p>
                <p>✓ Lowercase letter</p>
                <p>✓ Number and symbol</p>
              </div>

              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-4 text-sm font-bold text-red-300">
                  Passwords do not match.
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={loading.password || !passwordValid}
              onClick={changePassword}
              className={`${buttonClass} mt-7 w-full sm:w-auto`}
            >
              {loading.password ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <ShieldCheck size={18} />
              )}
              {loading.password ? "Updating..." : "Update password"}
            </button>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:p-7">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <Mail className="text-purple-300" size={24} />
                  <h2 className="text-2xl font-black tracking-[-0.03em]">
                    Change email
                  </h2>
                </div>

                <p className="max-w-xl text-base font-medium leading-7 text-white/60">
                  Primeiro enviamos uma confirmação para o novo email. Só depois
                  da confirmação é que a Supabase altera o email da conta.
                </p>
              </div>

              {saved.email && (
                <span className="hidden items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-black text-emerald-300 sm:inline-flex">
                  <CheckCircle2 size={15} />
                  Sent
                </span>
              )}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Current email">
                <input className={inputClass} value={data?.email || ""} disabled />
              </Field>

              <Field label="New email">
                <input
                  className={inputClass}
                  value={newEmail}
                  maxLength={120}
                  placeholder="new@email.com"
                  autoComplete="email"
                  onChange={(e) => setNewEmail(e.target.value.trim())}
                />
              </Field>
            </div>

            <button
              type="button"
              disabled={loading.email || !emailValid}
              onClick={changeEmail}
              className={`${buttonClass} mt-7 w-full sm:w-auto`}
            >
              {loading.email ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Mail size={18} />
              )}
              {loading.email ? "Sending..." : "Send verification email"}
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-white/70">
        {label}
      </span>
      {children}
    </label>
  );
}
