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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#03030a]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(168,85,247,0.22),transparent_32%),radial-gradient(circle_at_70%_60%,rgba(14,165,233,0.14),transparent_28%)]" />

        <p className="relative text-sm font-bold text-white/45 animate-pulse">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <AdminGuard user={user} role={role}>
      <div className="relative flex min-h-screen overflow-hidden bg-[#03030a] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.16),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(14,165,233,0.10),transparent_26%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />

        <div className="relative z-10 flex min-h-screen w-full">
          <Sidebar />

          <div className="flex min-w-0 flex-1 flex-col">
            <AdminHeader notifications={notifications} />

            <main className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
              <AdminStats
                users={users}
                products={products ?? []}
                revenue={revenue}
              />

              <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-4 shadow-[0_0_50px_rgba(168,85,247,0.10)] backdrop-blur-xl sm:p-6">
                <Section title="Products">
                  <ProductGrid
                    products={products ?? []}
                    deleteProduct={deleteProduct}
                  />
                </Section>
              </div>
            </main>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
