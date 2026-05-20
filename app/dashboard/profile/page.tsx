"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Globe,
  ImageIcon,
  Loader2,
  Save,
  User,
  UserCircle,
} from "lucide-react";

type Profile = {
  id?: string;
  name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  website: string | null;
  location: string | null;
  role?: string;
  is_verified?: boolean;
  account_type?: string;
  articles_count?: number;
  free_articles_limit?: number;
};

const LIMITS = {
  name: 50,
  username: 24,
  bio: 220,
  location: 60,
  url: 250,
};

function cleanText(value: string, max: number) {
  return value
    .replace(/[<>{}$"'`;\\]/g, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, max);
}

function cleanUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, LIMITS.username);
}

function cleanUrl(value: string) {
  return value
    .trim()
    .replace(/[<>{}$"'`;\\]/g, "")
    .slice(0, LIMITS.url);
}

function isValidUrl(value?: string | null) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profiles", { cache: "no-store" });
        const data = await res.json();

        if (res.ok) setProfile(data);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const articlesLeft = useMemo(() => {
    if (!profile) return 0;

    return Math.max(
      Number(profile.free_articles_limit ?? 10) -
        Number(profile.articles_count ?? 0),
      0
    );
  }, [profile]);

  const hasInvalidUrls = useMemo(() => {
    if (!profile) return false;

    return (
      !isValidUrl(profile.website) ||
      !isValidUrl(profile.avatar_url) ||
      !isValidUrl(profile.cover_url)
    );
  }, [profile]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();

    if (!profile || saving) return;

    if (hasInvalidUrls) {
      alert("Please enter valid URLs using http or https.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanText(profile.name || "", LIMITS.name),
          username: cleanUsername(profile.username || ""),
          bio: cleanText(profile.bio || "", LIMITS.bio),
          avatar_url: cleanUrl(profile.avatar_url || ""),
          cover_url: cleanUrl(profile.cover_url || ""),
          website: cleanUrl(profile.website || ""),
          location: cleanText(profile.location || "", LIMITS.location),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Could not save profile");
        return;
      }

      setProfile(data);
      alert("Profile updated!");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#03030a] text-white">
        <div className="grid min-h-screen place-items-center">
          <div className="flex items-center gap-3 text-white/55">
            <Loader2 className="animate-spin text-purple-300" size={20} />
            <span className="text-sm font-black uppercase tracking-[0.22em]">
              Loading profile
            </span>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#03030a] p-6 text-white">
        <p className="text-white/60">Profile not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#03030a] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(168,85,247,0.18),transparent_34%),radial-gradient(circle_at_90%_8%,rgba(217,70,239,0.12),transparent_28%),linear-gradient(180deg,#03030a_0%,#080812_48%,#03030a_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:70px_70px] opacity-20" />

      <form onSubmit={saveProfile} className="relative z-10">
        <section
          className="relative h-[280px] bg-[#070711] bg-cover bg-center sm:h-[360px] lg:h-[430px]"
          style={{
            backgroundImage: profile.cover_url
              ? `url(${profile.cover_url})`
              : "radial-gradient(circle at 18% 0%, rgba(168,85,247,0.42), transparent 34%), radial-gradient(circle at 88% 16%, rgba(217,70,239,0.24), transparent 32%)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#03030a] via-[#03030a]/55 to-[#03030a]/10" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#03030a] to-transparent" />

          <div className="absolute inset-x-0 bottom-8 px-4 sm:px-6 md:px-8">
            <div className="mx-auto flex max-w-[1440px] items-end justify-between gap-5">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-purple-300">
                  PROFILE
                </p>

                <h1 className="mt-3 max-w-5xl truncate text-4xl font-black tracking-[-0.075em] text-white sm:text-6xl lg:text-8xl">
                  {profile.name || "Edit your profile"}
                </h1>

                <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-white/45">
                  Customize your public profile with a premium clean look.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving || hasInvalidUrls}
                className="hidden shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 px-6 py-3 text-sm font-black text-white shadow-[0_0_35px_rgba(168,85,247,0.36)] transition hover:scale-[1.025] active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 sm:inline-flex"
              >
                {saving ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 md:px-8">
          <div className="mx-auto max-w-[1440px]">
            <div className="flex flex-col gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 items-end gap-5">
                <div className="-mt-20 grid h-32 w-32 shrink-0 place-items-center overflow-hidden rounded-[2rem] border border-white/15 bg-[#070711] shadow-[0_30px_90px_rgba(0,0,0,0.65),0_0_45px_rgba(168,85,247,0.18)] sm:h-40 sm:w-40">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserCircle size={78} className="text-white/25" />
                  )}
                </div>

                <div className="min-w-0 pb-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <h2 className="truncate text-3xl font-black tracking-[-0.055em] sm:text-5xl">
                      {profile.name || "No name"}
                    </h2>

                    {profile.is_verified && (
                      <BadgeCheck className="shrink-0 text-purple-300" />
                    )}
                  </div>

                  <p className="mt-2 truncate text-sm font-bold text-white/40">
                    @{profile.username || "username"}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || hasInvalidUrls}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 px-6 py-3 text-sm font-black text-white shadow-[0_0_35px_rgba(168,85,247,0.36)] transition hover:scale-[1.025] active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 sm:hidden"
              >
                {saving ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>

            <div className="grid gap-12 py-10 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_440px]">
              <div className="space-y-12">
                <section>
                  <SectionTitle
                    icon={<User size={18} />}
                    title="Public Information"
                  />

                  <div className="grid gap-7 md:grid-cols-2">
                    <Field
                      label="Name"
                      count={`${profile.name?.length || 0}/${LIMITS.name}`}
                    >
                      <input
                        className="profile-input"
                        placeholder="Your name"
                        maxLength={LIMITS.name}
                        value={profile.name || ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            name: cleanText(e.target.value, LIMITS.name),
                          })
                        }
                      />
                    </Field>

                    <Field
                      label="Username"
                      count={`${
                        profile.username?.length || 0
                      }/${LIMITS.username}`}
                    >
                      <input
                        className="profile-input"
                        placeholder="username"
                        maxLength={LIMITS.username}
                        value={profile.username || ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            username: cleanUsername(e.target.value),
                          })
                        }
                      />
                    </Field>
                  </div>

                  <div className="mt-8">
                    <Field
                      label="Bio"
                      count={`${profile.bio?.length || 0}/${LIMITS.bio}`}
                    >
                      <textarea
                        className="profile-input min-h-36 resize-none leading-7"
                        placeholder="Write a short bio..."
                        maxLength={LIMITS.bio}
                        value={profile.bio || ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            bio: cleanText(e.target.value, LIMITS.bio),
                          })
                        }
                      />
                    </Field>
                  </div>
                </section>

                <section className="border-t border-white/10 pt-10">
                  <SectionTitle
                    icon={<Globe size={18} />}
                    title="Links & Location"
                  />

                  <div className="grid gap-7 md:grid-cols-2">
                    <Field label="Website">
                      <input
                        className={`profile-input ${
                          !isValidUrl(profile.website)
                            ? "profile-input-error"
                            : ""
                        }`}
                        placeholder="https://yourwebsite.com"
                        maxLength={LIMITS.url}
                        value={profile.website || ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            website: cleanUrl(e.target.value),
                          })
                        }
                      />
                    </Field>

                    <Field
                      label="Location"
                      count={`${
                        profile.location?.length || 0
                      }/${LIMITS.location}`}
                    >
                      <input
                        className="profile-input"
                        placeholder="Location"
                        maxLength={LIMITS.location}
                        value={profile.location || ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            location: cleanText(
                              e.target.value,
                              LIMITS.location
                            ),
                          })
                        }
                      />
                    </Field>
                  </div>
                </section>

                <section className="border-t border-white/10 pt-10">
                  <SectionTitle icon={<ImageIcon size={18} />} title="Images" />

                  <div className="grid gap-7 md:grid-cols-2">
                    <Field label="Avatar URL">
                      <input
                        className={`profile-input ${
                          !isValidUrl(profile.avatar_url)
                            ? "profile-input-error"
                            : ""
                        }`}
                        placeholder="https://..."
                        maxLength={LIMITS.url}
                        value={profile.avatar_url || ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            avatar_url: cleanUrl(e.target.value),
                          })
                        }
                      />
                    </Field>

                    <Field label="Cover URL">
                      <input
                        className={`profile-input ${
                          !isValidUrl(profile.cover_url)
                            ? "profile-input-error"
                            : ""
                        }`}
                        placeholder="https://..."
                        maxLength={LIMITS.url}
                        value={profile.cover_url || ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            cover_url: cleanUrl(e.target.value),
                          })
                        }
                      />
                    </Field>
                  </div>
                </section>
              </div>

              <aside className="lg:sticky lg:top-8 lg:self-start">
                <section>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-purple-300">
                    ACCOUNT
                  </p>

                  <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
                    <InfoRow label="Role" value={profile.role || "user"} />

                    <InfoRow
                      label="Plan"
                      value={profile.account_type || "free"}
                    />

                    <InfoRow
                      label="Articles"
                      value={`${profile.articles_count ?? 0}/${
                        profile.free_articles_limit ?? 10
                      }`}
                    />

                    <InfoRow label="Available" value={`${articlesLeft}`} />
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </section>
      </form>

      <style jsx>{`
        .profile-input {
          width: 100%;
          border: 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.13);
          background: transparent;
          padding: 14px 0;
          color: white;
          outline: none;
          font-size: 15px;
          font-weight: 800;
          transition:
            border-color 180ms ease,
            opacity 180ms ease,
            transform 180ms ease;
        }

        .profile-input::placeholder {
          color: rgba(255, 255, 255, 0.26);
        }

        .profile-input:focus {
          border-bottom-color: rgba(216, 180, 254, 0.95);
          transform: translateY(-1px);
        }

        .profile-input-error {
          border-bottom-color: rgba(248, 113, 113, 0.85);
        }
      `}</style>
    </main>
  );
}

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="mb-6 flex items-center gap-2">
      <span className="text-purple-300">{icon}</span>
      <h3 className="text-lg font-black tracking-[-0.04em]">{title}</h3>
    </div>
  );
}

function Field({
  label,
  count,
  children,
}: {
  label: string;
  count?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between gap-3">
        <span className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">
          {label}
        </span>

        {count && (
          <span className="text-[10px] font-bold text-white/25">{count}</span>
        )}
      </span>

      {children}
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-4">
      <span className="text-sm font-bold text-white/38">{label}</span>
      <span className="text-sm font-black capitalize text-white">{value}</span>
    </div>
  );
}
