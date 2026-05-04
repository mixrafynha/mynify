"use client";

import Sidebar from "@/app/components/sidebar";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

import AdminHeader from "@/app/components/admin/AdminHeader";
import AdminStats from "@/app/components/admin/AdminStats";
import ProductGrid from "@/app/components/admin/ProductGrid";
import AdminGuard from "@/app/components/admin/AdminGuard";
import Section from "@/app/components/ui/Section";

export default function AdminDashboard() {
  const {
    user,
    loadingUser,
    products,
    isLoading,
    deleteProduct,
  } = useAdminDashboard();

  const role = user?.profile?.role ?? null;

  const users = 0;
  const revenue = 0;
  const notifications: any[] = [];

  if (loadingUser || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f17]">
        <p className="text-white/40 animate-pulse text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <AdminGuard user={user} role={role}>
      <div className="min-h-screen flex bg-gradient-to-b from-[#0b0f17] to-[#0e1422] text-white">
        <Sidebar />

        <div className="flex-1 flex flex-col w-full">
          <AdminHeader notifications={notifications} />

          <main className="flex-1 p-4 space-y-6">
            <AdminStats
              users={users}
              products={products ?? []}
              revenue={revenue}
            />

            <Section title="Products">
              <ProductGrid
                products={products ?? []}
                deleteProduct={deleteProduct}
              />
            </Section>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
