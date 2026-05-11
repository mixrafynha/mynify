"use client";

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import {
  CheckCircle2,
  Lock,
  Mail,
  Save,
  Settings,
  User,
} from "lucide-react";

type Profile = {
  name: string;
  username: string;
};

type SettingsResponse = {
  email: string;
  profile: Profile;
};

const inputClass =
  "h-12 w-full rounded-2xl border border-white bg-white/90 px-4 text-sm font-semibold text-slate-700 shadow-[0_12px_35px_rgba(101,85,143,0.10)] outline-none placeholder:text-slate-400 transition focus:ring-4 focus:ring-purple-500/15";

const buttonClass =
  "flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-500 text-sm font-black text-white shadow-[0_18px_35px_rgba(124,58,237,0.24)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

export default function SettingsPage() {
  const { data, isLoading, mutate } = useSWR<SettingsResponse>(
    "/api/settings",
    fetcher
  );

  const [form, setForm] = useState<Profile>({ name: "", username: "" });
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [loading, setLoading] = useState({
    profile: false,
    password: false,
    email: false,
  });

  const [saved, setSaved] = useState({
    profile: false,
    password: false,
    email: false,
  });

  useEffect(() => {
    if (!data) return;

    setForm({
      name: data.profile?.name ?? "",
      username: data.profile?.username ?? "",
    });

    setNewEmail(data.email ?? "");
  }, [data]);

  const safeFetch = useCallback(async (url: string, options: RequestInit) => {
    try {
      const res = await fetch(url, options);
      const json = await res.json().catch(() => null);

      if (!res.ok) return null;
      return json;
    } catch {
      return null;
    }
  }, []);

  const flashSaved = useCallback((key: keyof typeof saved) => {
    setSaved((p) => ({ ...p, [key]: true }));

    setTimeout(() => {
      setSaved((p) => ({ ...p, [key]: false }));
    }, 2000);
  }, []);

  const updateProfile = useCallback(async () => {
    setLoading((p) => ({ ...p, profile: true }));
    setSaved((p) => ({ ...p, profile: false }));

    const result = await safeFetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading((p) => ({ ...p, profile: false }));

    if (result) {
      mutate();
      flashSaved("profile");

      window.dispatchEvent(new CustomEvent("profile-updated", { detail: form }));
    }
  }, [form, mutate, safeFetch, flashSaved]);

  const changePassword = useCallback(async () => {
    if (!newPassword.trim()) return;

    setLoading((p) => ({ ...p, password: true }));

    const result = await safeFetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "password",
        newPassword,
      }),
    });

    setLoading((p) => ({ ...p, password: false }));

    if (result) {
      setNewPassword("");
      flashSaved("password");
    }
  }, [newPassword, safeFetch, flashSaved]);

  const changeEmail = useCallback(async () => {
    if (!newEmail.trim()) return;

    setLoading((p) => ({ ...p, email: true }));

    const payload = { type: "email", newEmail };

    const result = await safeFetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading((p) => ({ ...p, email: false }));

    if (result) {
      mutate();
      flashSaved("email");

      window.dispatchEvent(new CustomEvent("email-updated", { detail: payload }));
    }
  }, [newEmail, mutate, safeFetch, flashSaved]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f8f6ff] text-sm font-bold text-slate-500">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f6ff] text-[#060817]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(168,85,247,0.16),transparent_28%),radial-gradient(circle_at_85%_8%,rgba(14,165,233,0.09),transparent_26%),linear-gradient(180deg,#ffffff_0%,#f8f6ff_48%,#f2efff_100%)]" />

      <main className="relative z-10 min-h-screen">
        <div className="px-3 py-5 sm:px-5 md:px-8 md:py-7">
          <div className="mx-auto max-w-[1500px] space-y-5">
            <header className="sticky top-0 z-30 -mx-3 bg-[#f8f6ff]/90 px-3 pb-4 pt-0 backdrop-blur-2xl sm:-mx-5 sm:px-5 md:-mx-8 md:px-8">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-purple-600 via-violet-600 to-fuchsia-500 text-white shadow-[0_18px_35px_rgba(124,58,237,0.24)]">
                  <Settings size={22} />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-600">
                    Settings
                  </p>

                  <h1 className="truncate text-3xl font-black tracking-[-0.06em] text-[#060817] sm:text-4xl">
                    Account Settings
                  </h1>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Manage your profile, security and email preferences.
                  </p>
                </div>
              </div>
            </header>

            <section className="grid gap-4 lg:grid-cols-3">
              {/* PROFILE */}
              <article className="rounded-[28px] bg-white/90 p-4 shadow-[0_12px_35px_rgba(101,85,143,0.12)] backdrop-blur-xl sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-500/10 text-purple-600">
                      <User size={20} />
                    </div>

                    <div>
                      <h2 className="text-lg font-black tracking-[-0.04em]">
                        Profile
                      </h2>
                      <p className="text-xs font-semibold text-slate-400">
                        Public account info
                      </p>
                    </div>
                  </div>

                  {saved.profile && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black text-emerald-600">
                      <CheckCircle2 size={13} />
                      Saved
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <input
                    className={inputClass}
                    value={form.name}
                    placeholder="Full name"
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />

                  <input
                    className={inputClass}
                    value={form.username}
                    placeholder="Username"
                    onChange={(e) =>
                      setForm((p) => ({ ...p, username: e.target.value }))
                    }
                  />

                  <button
                    type="button"
                    disabled={loading.profile}
                    onClick={updateProfile}
                    className={buttonClass}
                  >
                    <Save size={16} />
                    {loading.profile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </article>

              {/* PASSWORD */}
              <article className="rounded-[28px] bg-white/90 p-4 shadow-[0_12px_35px_rgba(101,85,143,0.12)] backdrop-blur-xl sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-500/10 text-purple-600">
                      <Lock size={20} />
                    </div>

                    <div>
                      <h2 className="text-lg font-black tracking-[-0.04em]">
                        Password
                      </h2>
                      <p className="text-xs font-semibold text-slate-400">
                        Update security access
                      </p>
                    </div>
                  </div>

                  {saved.password && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black text-emerald-600">
                      <CheckCircle2 size={13} />
                      Updated
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <input
                    type="password"
                    className={inputClass}
                    value={newPassword}
                    placeholder="New password"
                    onChange={(e) => setNewPassword(e.target.value)}
                  />

                  <button
                    type="button"
                    disabled={loading.password || !newPassword.trim()}
                    onClick={changePassword}
                    className={buttonClass}
                  >
                    <Lock size={16} />
                    {loading.password ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </article>

              {/* EMAIL */}
              <article className="rounded-[28px] bg-white/90 p-4 shadow-[0_12px_35px_rgba(101,85,143,0.12)] backdrop-blur-xl sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-500/10 text-purple-600">
                      <Mail size={20} />
                    </div>

                    <div>
                      <h2 className="text-lg font-black tracking-[-0.04em]">
                        Email
                      </h2>
                      <p className="text-xs font-semibold text-slate-400">
                        Change login email
                      </p>
                    </div>
                  </div>

                  {saved.email && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black text-emerald-600">
                      <CheckCircle2 size={13} />
                      Sent
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <input
                    className={inputClass}
                    value={newEmail}
                    placeholder="Email address"
                    onChange={(e) => setNewEmail(e.target.value)}
                  />

                  <button
                    type="button"
                    disabled={loading.email || !newEmail.trim()}
                    onClick={changeEmail}
                    className={buttonClass}
                  >
                    <Mail size={16} />
                    {loading.email ? "Sending..." : "Change Email"}
                  </button>
                </div>
              </article>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
