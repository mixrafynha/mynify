"use client";

import Sidebar from "@/app/components/sidebar";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

import AdminHeader from "@/app/components/admin/AdminHeader";
import AdminStats from "@/app/components/admin/AdminStats";
import AdminGuard from "@/app/components/admin/AdminGuard";

import {
  Megaphone,
  ShieldCheck,
  Crown,
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function AdminDashboard() {
  const { user, loadingUser, products, isLoading } = useAdminDashboard();

  const role = user?.profile?.role ?? null;

  const users = 0;
  const revenue = 0;
  const notifications: any[] = [];

  if (loadingUser || isLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#03030a] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(168,85,247,0.24),transparent_32%),radial-gradient(circle_at_65%_60%,rgba(14,165,233,0.14),transparent_28%)]" />

        <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-4 shadow-[0_0_45px_rgba(168,85,247,0.18)] backdrop-blur-xl">
          <p className="animate-pulse text-sm font-bold tracking-wide text-white/55">
            Loading admin panel...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminGuard user={user} role={role}>
      <div className="relative flex min-h-screen overflow-hidden bg-[#03030a] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(168,85,247,0.18),transparent_28%),radial-gradient(circle_at_90%_18%,rgba(14,165,233,0.12),transparent_26%),linear-gradient(180deg,#03030a_0%,#050511_48%,#03030a_100%)]" />

        <div className="relative z-10 flex min-h-screen w-full">
          <Sidebar />

          <div className="flex min-w-0 flex-1 flex-col transition-all duration-300 ease-out">
            <AdminHeader notifications={notifications} />

            <main className="flex-1 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
              <div className="mx-auto w-full max-w-[1500px] space-y-7">
                <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_0_70px_rgba(168,85,247,0.12)] backdrop-blur-2xl sm:p-8">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(168,85,247,0.22),transparent_35%),radial-gradient(circle_at_85%_15%,rgba(14,165,233,0.14),transparent_30%)]" />

                  <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-3xl">
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-purple-300">
                        <Sparkles size={14} />
                        Admin Control Center
                      </div>

                      <h1 className="text-4xl font-black tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl">
                        Welcome back,
                        <span className="block bg-gradient-to-r from-purple-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                          {user?.email?.split("@")[0] ?? "Admin"}
                        </span>
                      </h1>

                      <p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-white/50 sm:text-base">
                        Control the Mynify platform, manage users, monitor growth,
                        configure public pages, and prepare premium features from one
                        clean admin workspace.
                      </p>
                    </div>

                    <div className="grid w-full max-w-md grid-cols-2 gap-3">
                      <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                        <p className="text-3xl font-black text-white">
                          {products?.length ?? 0}
                        </p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-white/35">
                          Active items
                        </p>
                      </div>

                      <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                        <p className="text-3xl font-black text-white">
                          Pro
                        </p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-white/35">
                          Upgrade ready
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="rounded-[30px] border border-white/10 bg-white/[0.035] p-4 shadow-[0_0_55px_rgba(168,85,247,0.10)] backdrop-blur-2xl sm:p-5">
                  <AdminStats
                    users={users}
                    products={products ?? []}
                    revenue={revenue}
                  />
                </div>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      title: "Page Control",
                      desc: "Edit homepage sections, banners, featured blocks and public content visibility.",
                      icon: LayoutDashboard,
                      tag: "Website",
                    },
                    {
                      title: "Advertising",
                      desc: "Manage promotional banners, campaign slots and homepage announcements.",
                      icon: Megaphone,
                      tag: "Marketing",
                    },
                    {
                      title: "Mynify Pro",
                      desc: "Prepare premium tools, subscription perks and locked features for Pro users.",
                      icon: Crown,
                      tag: "Premium",
                    },
                    {
                      title: "Security",
                      desc: "Review admin access, roles, account permissions and platform protection.",
                      icon: ShieldCheck,
                      tag: "Safe",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="group rounded-[30px] border border-white/10 bg-[#070711]/80 p-5 shadow-[0_0_50px_rgba(168,85,247,0.08)] backdrop-blur-2xl transition hover:-translate-y-1 hover:border-purple-400/40 hover:bg-white/[0.055]"
                    >
                      <div className="mb-5 flex items-center justify-between">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/15 text-purple-300 ring-1 ring-purple-400/20">
                          <item.icon size={22} />
                        </div>

                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/35">
                          {item.tag}
                        </span>
                      </div>

                      <h3 className="text-lg font-black tracking-[-0.03em] text-white">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-sm font-medium leading-6 text-white/45">
                        {item.desc}
                      </p>

                      <div className="mt-5 flex items-center gap-2 text-sm font-bold text-purple-300 opacity-70 transition group-hover:opacity-100">
                        Configure
                        <ArrowRight size={15} />
                      </div>
                    </div>
                  ))}
                </section>

                <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-[30px] border border-white/10 bg-[#070711]/80 p-6 shadow-[0_0_60px_rgba(168,85,247,0.10)] backdrop-blur-2xl">
                    <div className="mb-6 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-fuchsia-400">
                          Quick Actions
                        </p>
                        <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-white">
                          Platform shortcuts
                        </h2>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          name: "Manage users",
                          icon: Users,
                          path: "/admin/users",
                        },
                        {
                          name: "View analytics",
                          icon: BarChart3,
                          path: "/admin/analytics",
                        },
                        {
                          name: "Configure platform",
                          icon: Settings,
                          path: "/admin/settings",
                        },
                        {
                          name: "Promotions & ads",
                          icon: Megaphone,
                          path: "/admin/advertising",
                        },
                      ].map((action) => (
                        <button
                          key={action.name}
                          type="button"
                          className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-4 text-left transition hover:border-purple-400/40 hover:bg-purple-500/10"
                        >
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.06] text-white/70">
                              <action.icon size={18} />
                            </div>

                            <span className="text-sm font-bold text-white/75">
                              {action.name}
                            </span>
                          </div>

                          <ArrowRight
                            size={16}
                            className="text-white/30 transition group-hover:translate-x-1 group-hover:text-purple-300"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[30px] border border-purple-400/20 bg-gradient-to-br from-purple-600/20 via-fuchsia-500/10 to-cyan-500/10 p-6 shadow-[0_0_70px_rgba(168,85,247,0.16)] backdrop-blur-2xl">
                    <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-purple-500/20 blur-3xl" />

                    <div className="relative">
                      <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 shadow-[0_0_35px_rgba(168,85,247,0.45)]">
                        <Crown size={25} />
                      </div>

                      <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-200">
                        Mynify Pro
                      </p>

                      <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-white">
                        Build your premium layer.
                      </h2>

                      <p className="mt-4 text-sm font-medium leading-7 text-white/55">
                        Add paid features, priority tools, custom branding,
                        advanced analytics and exclusive controls for Pro users.
                      </p>

                      <button
                        type="button"
                        className="mt-6 rounded-2xl bg-white px-5 py-3 text-sm font-black text-black transition hover:scale-[1.03] active:scale-95"
                      >
                        Plan Pro Features
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </main>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
