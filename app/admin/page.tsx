"use client";

import Sidebar from "@/app/components/sidebar";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

import AdminHeader from "@/app/components/admin/AdminHeader";
import AdminStats from "@/app/components/admin/AdminStats";
import ProductGrid from "@/app/components/admin/ProductGrid";
import AdminGuard from "@/app/components/admin/AdminGuard";
import Section from "@/app/components/ui/Section";

export default function AdminDashboard() {
  const { user, loadingUser, products, isLoading, deleteProduct } =
    useAdminDashboard();

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
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminGuard user={user} role={role}>
      <div className="relative flex min-h-screen overflow-hidden bg-[#03030a] text-white">
        {/* BACKGROUND */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(168,85,247,0.18),transparent_28%),radial-gradient(circle_at_90%_18%,rgba(14,165,233,0.12),transparent_26%),linear-gradient(180deg,#03030a_0%,#050511_48%,#03030a_100%)]" />

        <div className="relative z-10 flex min-h-screen w-full">
          <Sidebar />

          {/* CONTENT AUTO-ADJUSTS WITH SIDEBAR */}
          <div className="flex min-w-0 flex-1 flex-col transition-all duration-300 ease-out">
            <AdminHeader notifications={notifications} />

            <main className="flex-1 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
              <div className="mx-auto w-full max-w-[1500px] space-y-7">
                {/* PAGE TITLE */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-400">
                    Admin Panel
                  </p>

                  <h1 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                    Dashboard
                  </h1>

                  <p className="max-w-2xl text-sm font-medium leading-relaxed text-white/45">
                    Manage products, monitor activity and control your Mynify platform.
                  </p>
                </div>

                {/* STATS */}
                <div className="rounded-[30px] border border-white/10 bg-white/[0.035] p-4 shadow-[0_0_55px_rgba(168,85,247,0.10)] backdrop-blur-2xl sm:p-5">
                  <AdminStats
                    users={users}
                    products={products ?? []}
                    revenue={revenue}
                  />
                </div>

                {/* PRODUCTS */}
                <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[#070711]/80 shadow-[0_0_60px_rgba(168,85,247,0.12)] backdrop-blur-2xl">
                  <div className="border-b border-white/10 bg-white/[0.025] px-5 py-5 sm:px-6">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-fuchsia-400">
                          Store Management
                        </p>

                        <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-white">
                          Products
                        </h2>
                      </div>

                      <p className="text-sm font-semibold text-white/40">
                        {products?.length ?? 0} items
                      </p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    <Section title="">
                      <ProductGrid
                        products={products ?? []}
                        deleteProduct={deleteProduct}
                      />
                    </Section>
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
