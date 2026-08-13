"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Crown,
  LayoutDashboard,
  LockKeyhole,
  Megaphone,
  MonitorCog,
  Package,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import AdminHeader from "@/app/components/admin/AdminHeader";
import AdminGuard from "@/app/components/admin/AdminGuard";
import AdminStats from "@/app/components/admin/AdminStats";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

const QUICK_ACTIONS = [
  {
    name: "Manage users",
    desc: "Control accounts, roles and permissions.",
    icon: Users,
    path: "/admin/users",
  },
  {
    name: "Products",
    desc: "Review product catalog and updates.",
    icon: Package,
    path: "/admin/products",
  },
  {
    name: "Analytics",
    desc: "Track platform growth and performance.",
    icon: BarChart3,
    path: "/admin/analytics",
  },
  {
    name: "Settings",
    desc: "Configure platform rules and admin tools.",
    icon: Settings,
    path: "/admin/settings",
  },
] as const;

const CONTROL_CARDS = [
  {
    title: "Advertising Control",
    desc: "Manage campaigns, promo banners and public announcements.",
    icon: Megaphone,
    label: "Marketing",
    path: "/admin/advertising",
  },
  {
    title: "Mynify Pro",
    desc: "Prepare premium features, subscriptions and exclusive tools.",
    icon: Crown,
    label: "Premium",
    path: "/admin/pro",
  },
  {
    title: "Security Center",
    desc: "Protect admin access, user data and sensitive actions.",
    icon: ShieldCheck,
    label: "Secure",
    path: "/admin/security",
  },
  {
    title: "Page Control",
    desc: "Edit public sections, visibility and system modules.",
    icon: LayoutDashboard,
    label: "Control",
    path: "/admin/pages",
  },
] as const;

export default function AdminDashboard() {
  const { user, loadingUser, isLoading, products, users, revenue } =
    useAdminDashboard();
  const role = user?.profile?.role ?? null;
  const notifications: any[] = [];

  if (loadingUser || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f17] text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-white/70 shadow-[0_20px_80px_rgba(0,0,0,0.2)]">
          Loading admin dashboard...
        </div>
      </div>
    );
  }

  return (
    <AdminGuard user={user} role={role}>
      <div className="relative min-h-screen overflow-hidden bg-[#0b0f17] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(168,85,247,0.14),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(14,165,233,0.10),transparent_26%),linear-gradient(180deg,#0b0f17_0%,#0f1522_55%,#0b0f17_100%)]" />

        <div className="relative z-10 flex min-h-screen min-w-0 flex-1 flex-col">
          <AdminHeader notifications={notifications} title="Admin" />

          <main className="flex-1 overflow-x-hidden px-3 py-4 sm:px-5 sm:py-5 lg:px-8">
            <div className="mx-auto w-full max-w-[1500px] space-y-5 sm:space-y-6">
              <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-8">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.16),transparent_32%),radial-gradient(circle_at_85%_18%,rgba(14,165,233,0.12),transparent_28%)]" />

                  <div className="relative flex flex-col gap-6">
                    <div className="max-w-3xl">
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/70">
                        <LockKeyhole size={13} />
                        Admin only
                      </div>

                      <h1 className="text-3xl font-black tracking-[-0.065em] sm:text-5xl lg:text-6xl">
                        Welcome back,
                        <span className="block bg-gradient-to-r from-purple-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                          {user?.email?.split("@")[0] ?? "Admin"}
                        </span>
                      </h1>

                      <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/60 sm:text-base">
                        Fast access to users, products, analytics, security and
                        admin tools. Everything stays lightweight and focused.
                      </p>
                    </div>

                    <AdminStats users={users} products={products} revenue={revenue} />
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">
                    Admin status
                  </p>

                  <div className="mt-4 grid gap-3">
                    {[
                      { label: "Role", value: role ?? "unknown" },
                      { label: "Products", value: String(products?.length ?? 0) },
                      { label: "Users", value: String(users?.length ?? 0) },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                          {item.label}
                        </p>
                        <p className="mt-1 text-lg font-black text-white">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/admin/security"
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#0b0f17] transition active:scale-95"
                  >
                    Open security center
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {CONTROL_CARDS.map((item) => (
                  <Link
                    key={item.title}
                    href={item.path}
                    className="group rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.12)] transition active:scale-[0.99] hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/8 text-white">
                        <item.icon size={21} />
                      </div>

                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/45">
                        {item.label}
                      </span>
                    </div>

                    <h3 className="text-lg font-black tracking-[-0.035em] text-white">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm font-semibold leading-6 text-white/55">
                      {item.desc}
                    </p>
                  </Link>
                ))}
              </section>

              <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.14)] sm:p-6">
                  <div className="mb-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-white/45">
                        Quick actions
                      </p>
                      <h2 className="mt-2 text-2xl font-black tracking-[-0.045em] text-white">
                        Admin shortcuts
                      </h2>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {QUICK_ACTIONS.map((action) => (
                      <Link
                        key={action.name}
                        href={action.path}
                        className="group flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-left transition active:scale-[0.99] hover:border-white/20 hover:bg-white/[0.06]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/8 text-white">
                            <action.icon size={18} />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-white">
                              {action.name}
                            </p>
                            <p className="line-clamp-2 text-xs font-semibold text-white/45">
                              {action.desc}
                            </p>
                          </div>
                        </div>

                        <ArrowRight
                          size={16}
                          className="shrink-0 text-white/25 transition group-hover:translate-x-1 group-hover:text-white"
                        />
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.14)] sm:p-6">
                  <div className="mb-5">
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-white/45">
                      Control panel
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.045em] text-white">
                      Manage the platform
                    </h2>
                  </div>

                  <div className="space-y-3">
                    <Link
                      href="/admin/users"
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/[0.06]"
                    >
                      Users
                      <ArrowRight size={16} />
                    </Link>
                    <Link
                      href="/admin/products"
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/[0.06]"
                    >
                      Products
                      <ArrowRight size={16} />
                    </Link>
                    <Link
                      href="/admin/analytics"
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/[0.06]"
                    >
                      Analytics
                      <ArrowRight size={16} />
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/[0.06]"
                    >
                      Settings
                      <ArrowRight size={16} />
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
