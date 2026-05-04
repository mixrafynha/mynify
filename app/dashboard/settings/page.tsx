"use client";

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import Sidebar from "@/app/components/sidebar";
import { fetcher } from "@/lib/fetcher";

type Profile = {
  name: string;
  username: string;
};

type SettingsResponse = {
  email: string;
  profile: Profile;
};

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

  /* ================= PROFILE ================= */
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
      setSaved((p) => ({ ...p, profile: true }));

      window.dispatchEvent(
        new CustomEvent("profile-updated", { detail: form })
      );

      setTimeout(() => {
        setSaved((p) => ({ ...p, profile: false }));
      }, 2000);
    }
  }, [form, mutate, safeFetch]);

  /* ================= PASSWORD ================= */
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
      setSaved((p) => ({ ...p, password: true }));

      setTimeout(() => {
        setSaved((p) => ({ ...p, password: false }));
      }, 2000);
    }
  }, [newPassword, safeFetch]);

  /* ================= EMAIL ================= */
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
      setSaved((p) => ({ ...p, email: true }));

      window.dispatchEvent(
        new CustomEvent("email-updated", { detail: payload })
      );

      setTimeout(() => {
        setSaved((p) => ({ ...p, email: false }));
      }, 2000);
    }
  }, [newEmail, mutate, safeFetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f2] text-gray-500">
        Loading settings...
      </div>
    );
  }

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/10 transition";

  const buttonClass =
    "w-full py-3 rounded-xl font-medium transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md";

  return (
    <div className="min-h-screen flex bg-[#f4f4f2] text-gray-900">
      <Sidebar />

      <div className="flex-1 md:pl-[280px]">
        <main className="max-w-3xl mx-auto py-14 px-6 space-y-10">

          {/* HEADER */}
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Account Settings
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your profile, security and email preferences
            </p>
          </div>

          {/* CARD */}
          <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-2xl shadow-sm p-6 space-y-10">

            {/* PROFILE */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs uppercase tracking-wider text-gray-500">
                  Profile
                </h2>

                {saved.profile && (
                  <span className="text-xs text-green-600">Saved</span>
                )}
              </div>

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
                disabled={loading.profile}
                onClick={updateProfile}
                className={`${buttonClass} bg-black text-white hover:bg-gray-900`}
              >
                {loading.profile ? "Saving..." : "Save Profile"}
              </button>
            </section>

            <div className="border-t border-gray-100" />

            {/* PASSWORD */}
            <section className="space-y-3">
              <div className="flex justify-between">
                <h2 className="text-xs uppercase tracking-wider text-gray-500">
                  Password
                </h2>

                {saved.password && (
                  <span className="text-xs text-green-600">Updated</span>
                )}
              </div>

              <input
                type="password"
                className={inputClass}
                value={newPassword}
                placeholder="New password"
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <button
                disabled={loading.password}
                onClick={changePassword}
                className={`${buttonClass} bg-black text-white hover:bg-gray-900`}
              >
                {loading.password ? "Updating..." : "Update Password"}
              </button>
            </section>

            <div className="border-t border-gray-100" />

            {/* EMAIL */}
            <section className="space-y-3">
              <div className="flex justify-between">
                <h2 className="text-xs uppercase tracking-wider text-gray-500">
                  Email
                </h2>

                {saved.email && (
                  <span className="text-xs text-green-600">Sent</span>
                )}
              </div>

              <input
                className={inputClass}
                value={newEmail}
                placeholder="Email address"
                onChange={(e) => setNewEmail(e.target.value)}
              />

              <button
                disabled={loading.email}
                onClick={changeEmail}
                className={`${buttonClass} bg-black text-white hover:bg-gray-900`}
              >
                {loading.email ? "Sending..." : "Change Email"}
              </button>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}