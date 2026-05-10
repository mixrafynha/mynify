"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Crown,
  ShieldCheck,
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  Megaphone,
  Sparkles,
  ArrowRight,
  LockKeyhole,
  MonitorCog,
} from "lucide-react";

import AdminHeader from "@/app/components/admin/AdminHeader";
import AdminGuard from "@/app/components/admin/AdminGuard";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

const QUICK_ACTIONS = [
  {
    name: "Manage users",
    desc: "Control accounts, roles and permissions.",
    icon: Users,
    path: "/admin/users",
  },
  {
    name: "Analytics",
    desc: "Track platform growth and performance.",
    icon: BarChart3,
    path: "/admin/analytics",
  },
  {
    name: "Page control",
    desc: "Edit public sections, banners and visibility.",
    icon: LayoutDashboard,
    path: "/admin/pages",
  },
  {
    name: "Settings",
    desc: "Configure platform rules and admin tools.",
    icon: Settings,
    path: "/admin/settings",
  },
];

const CONTROL_CARDS = [
  {
    title: "Advertising Control",
    desc: "Manage public campaigns, promo banners and homepage announcements.",
    icon: Megaphone,
    label: "Marketing",
    path: "/admin/advertising",
  },
  {
    title: "Mynify Pro",
    desc: "Create premium features, subscriptions and exclusive admin controls.",
    icon: Crown,
    label: "Premium",
    path: "/admin/pro",
  },
  {
    title: "Security Center",
    desc: "Protect admin access, user data and sensitive platform actions.",
    icon: ShieldCheck,
    label: "Secure",
    path: "/admin/security",
  },
  {
    title: "Platform Control",
    desc: "Monitor pages, visibility, roles and important system settings.",
    icon: MonitorCog,
    label: "Control",
    path: "/admin/pages",
  },
];

export default function AdminDashboard() {
  const { user, loadingUser, isLoading } = useAdminDashboard();
  const role = user?.profile?.role ?? null;
  const notifications = useMemo(() => [], []);

  if (loadingUser || isLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f7fb] text-[#111]">
        <div className="absolute inset-0 hidden bg-[radial-gradient(circle_at_50%_30%,rgba(168,85,247,0.14),transparent_34%),radial-gradient(circle_at_70%_65%,rgba(14,165,233,0.10),transparent_30%)] md:block" />

        <div className="relative rounded-[28px] border border-black/5 bg-white px-7 py-5 shadow-sm md:bg-white/80 md:shadow-[0_30px_100px_rgba(15,23,42,0.10)] md:backdrop-blur-xl">
          <p className="animate-pulse text-sm font-black tracking-wide text-black/45">
            Loading admin workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminGuard user={user} role={role}>
      <div className="relative min-h-screen overflow-hidden bg-[#f7f7fb] text-[#111]">
        <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(circle_at_10%_0%,rgba(168,85,247,0.13),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(14,165,233,0.10),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f7f7fb_45%,#f4f2fb_100%)] md:block" />

        <div className="relative z-10 flex min-h-screen min-w-0 flex-1 flex-col">
          <AdminHeader notifications={notifications} />

          <main className="flex-1 overflow-x-hidden px-3 py-4 sm:px-5 sm:py-5 lg:px-8">
            <div className="mx-auto w-full max-w-[1500px] space-y-5 sm:space-y-6">
              <section className="relative overflow-hidden rounded-[28px] border border-black/5 bg-white p-5 shadow-sm md:bg-white/75 md:shadow-[0_30px_120px_rgba(15,23,42,0.10)] md:backdrop-blur-xl sm:rounded-[36px] sm:p-8 lg:p-10">
                <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(circle_at_22%_0%,rgba(168,85,247,0.16),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(14,165,233,0.12),transparent_28%)] md:block" />

                <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
                  <div className="max-w-3xl">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-500/15 bg-purple-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-purple-700 sm:text-xs">
                      <Sparkles size={14} />
                      Admin Only
                    </div>

                    <h1 className="text-4xl font-black tracking-[-0.065em] text-black sm:text-5xl lg:text-6xl">
                      Welcome back,
                      <span className="block bg-gradient-to-r from-purple-700 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent">
                        {user?.email?.split("@")[0] ?? "Admin"}
                      </span>
                    </h1>

                    <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-black/50 sm:text-base">
                      Your premium control center for managing Mynify pages,
                      advertising, users, security and Pro features.
                    </p>
                  </div>

                  <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                    {["Admin", "Pro", "Safe"].map((item) => (
                      <div
                        key={item}
                        className="rounded-[26px] border border-black/5 bg-white p-5 shadow-sm md:bg-white/70"
                      >
                        <p className="text-2xl font-black text-black">{item}</p>
                        <p className="mt-1 text-[11px] font-black uppercase tracking-widest text-black/35">
                          {item === "Admin"
                            ? "Access"
                            : item === "Pro"
                              ? "Ready"
                              : "Protected"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {CONTROL_CARDS.map((item) => (
                  <Link
                    key={item.title}
                    href={item.path}
                    className="group rounded-[28px] border border-black/5 bg-white p-5 shadow-sm transition active:scale-[0.99] md:rounded-[30px] md:bg-white/75 md:shadow-[0_20px_70px_rgba(15,23,42,0.07)] md:backdrop-blur-xl md:hover:-translate-y-1 md:hover:border-purple-500/20 md:hover:shadow-[0_30px_90px_rgba(168,85,247,0.14)]"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/10 text-purple-700 ring-1 ring-purple-500/10">
                        <item.icon size={22} />
                      </div>

                      <span className="rounded-full border border-black/5 bg-black/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black/35">
                        {item.label}
                      </span>
                    </div>

                    <h3 className="text-lg font-black tracking-[-0.035em] text-black">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm font-semibold leading-6 text-black/45">
                      {item.desc}
                    </p>
                  </Link>
                ))}
              </section>

              <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm md:rounded-[32px] md:bg-white/75 md:shadow-[0_25px_90px_rgba(15,23,42,0.08)] md:backdrop-blur-xl sm:p-6">
                  <div className="mb-6">
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-700">
                      Quick Actions
                    </p>

                    <h2 className="mt-2 text-2xl font-black tracking-[-0.045em] text-black">
                      Admin shortcuts
                    </h2>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {QUICK_ACTIONS.map((action) => (
                      <Link
                        key={action.name}
                        href={action.path}
                        className="group flex items-center justify-between rounded-3xl border border-black/5 bg-black/[0.025] px-4 py-4 text-left transition active:scale-[0.99] md:hover:border-purple-500/20 md:hover:bg-purple-500/10"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-black/65 shadow-sm">
                            <action.icon size={18} />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-black/80">
                              {action.name}
                            </p>
                            <p className="line-clamp-2 text-xs font-semibold text-black/38">
                              {action.desc}
                            </p>
                          </div>
                        </div>

                        <ArrowRight
                          size={16}
                          className="shrink-0 text-black/25 transition md:group-hover:translate-x-1 md:group-hover:text-purple-700"
                        />
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[28px] border border-purple-500/10 bg-white p-5 shadow-sm md:rounded-[32px] md:bg-white/75 md:shadow-[0_25px_100px_rgba(168,85,247,0.13)] md:backdrop-blur-xl sm:p-6">
                  <div className="absolute -right-16 -top-16 hidden h-44 w-44 rounded-full bg-purple-500/15 blur-3xl md:block" />

                  <div className="relative">
                    <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-500 text-white shadow-sm md:shadow-[0_20px_50px_rgba(168,85,247,0.28)]">
                      <LockKeyhole size={25} />
                    </div>

                    <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-700">
                      Premium Admin
                    </p>

                    <h2 className="mt-2 text-3xl font-black tracking-[-0.055em] text-black">
                      Build the Pro layer.
                    </h2>

                    <p className="mt-4 text-sm font-semibold leading-7 text-black/50">
                      Prepare advanced controls, premium visibility, paid
                      features, page modules and exclusive tools for future Pro
                      users.
                    </p>

                    <Link
                      href="/admin/pro"
                      className="mt-6 inline-flex rounded-2xl bg-black px-5 py-3 text-sm font-black text-white shadow-sm transition active:scale-95 md:shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:hover:scale-[1.03]"
                    >
                      Configure Pro
                    </Link>
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
