"use client";

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
  },
  {
    title: "Mynify Pro",
    desc: "Create premium features, subscriptions and exclusive admin controls.",
    icon: Crown,
    label: "Premium",
  },
  {
    title: "Security Center",
    desc: "Protect admin access, user data and sensitive platform actions.",
    icon: ShieldCheck,
    label: "Secure",
  },
  {
    title: "Platform Control",
    desc: "Monitor pages, visibility, roles and important system settings.",
    icon: MonitorCog,
    label: "Control",
  },
];

export default function AdminDashboard() {
  const { user, loadingUser, isLoading } = useAdminDashboard();

  const role = user?.profile?.role ?? null;

  if (loadingUser || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[#111]">
        <div className="rounded-[28px] border border-black/5 bg-white/80 px-7 py-5 shadow-[0_30px_100px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
          <p className="animate-pulse text-sm font-black tracking-wide text-black/45">
            Loading admin workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminGuard user={user} role={role}>
      <div className="min-h-screen text-[#111]">
        <div className="flex min-w-0 flex-1 flex-col transition-all duration-300 md:pl-[var(--admin-sidebar-width,280px)]">
          <AdminHeader />

          <main className="flex-1 overflow-x-hidden p-0">
            <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
              <section className="relative overflow-hidden rounded-[36px] border border-black/5 bg-white/75 p-6 shadow-[0_30px_120px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-8 lg:p-10">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_0%,rgba(168,85,247,0.16),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(14,165,233,0.12),transparent_28%)]" />

                <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
                  <div className="max-w-3xl">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-500/15 bg-purple-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-purple-700">
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

                  <div className="grid w-full max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-[26px] border border-black/5 bg-white/70 p-5 shadow-sm">
                      <p className="text-2xl font-black text-black">Admin</p>
                      <p className="mt-1 text-[11px] font-black uppercase tracking-widest text-black/35">
                        Access
                      </p>
                    </div>

                    <div className="rounded-[26px] border border-black/5 bg-white/70 p-5 shadow-sm">
                      <p className="text-2xl font-black text-black">Pro</p>
                      <p className="mt-1 text-[11px] font-black uppercase tracking-widest text-black/35">
                        Ready
                      </p>
                    </div>

                    <div className="col-span-2 rounded-[26px] border border-black/5 bg-white/70 p-5 shadow-sm sm:col-span-1">
                      <p className="text-2xl font-black text-black">Safe</p>
                      <p className="mt-1 text-[11px] font-black uppercase tracking-widest text-black/35">
                        Protected
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {CONTROL_CARDS.map((item) => (
                  <div
                    key={item.title}
                    className="group rounded-[30px] border border-black/5 bg-white/75 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.07)] backdrop-blur-2xl transition hover:-translate-y-1 hover:border-purple-500/20 hover:shadow-[0_30px_90px_rgba(168,85,247,0.14)]"
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
                  </div>
                ))}
              </section>

              <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[32px] border border-black/5 bg-white/75 p-6 shadow-[0_25px_90px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
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
                      <button
                        key={action.name}
                        type="button"
                        className="group flex items-center justify-between rounded-3xl border border-black/5 bg-black/[0.025] px-4 py-4 text-left transition hover:border-purple-500/20 hover:bg-purple-500/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-black/65 shadow-sm">
                            <action.icon size={18} />
                          </div>

                          <div>
                            <p className="text-sm font-black text-black/80">
                              {action.name}
                            </p>
                            <p className="mt-0.5 text-xs font-semibold text-black/38">
                              {action.desc}
                            </p>
                          </div>
                        </div>

                        <ArrowRight
                          size={16}
                          className="shrink-0 text-black/25 transition group-hover:translate-x-1 group-hover:text-purple-700"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[32px] border border-purple-500/10 bg-white/75 p-6 shadow-[0_25px_100px_rgba(168,85,247,0.13)] backdrop-blur-2xl">
                  <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-purple-500/15 blur-3xl" />

                  <div className="relative">
                    <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-500 text-white shadow-[0_20px_50px_rgba(168,85,247,0.28)]">
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

                    <button
                      type="button"
                      className="mt-6 rounded-2xl bg-black px-5 py-3 text-sm font-black text-white shadow-[0_18px_50px_rgba(0,0,0,0.18)] transition hover:scale-[1.03] active:scale-95"
                    >
                      Configure Pro
                    </button>
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
