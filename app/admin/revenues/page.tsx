"use client";

import Sidebar from "@/app/components/sidebar";
import AdminHeader from "@/app/components/admin/AdminHeader";
import AdminGuard from "@/app/components/admin/AdminGuard";
import Section from "@/app/components/ui/Section";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

export default function AdminRevenuesPage() {
  const { user, loadingUser, revenue, notifications } = useAdminDashboard();

  const role = user?.profile?.role ?? null;

  if (loadingUser) {
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
            <Section title="Revenues">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-white/40 text-sm">Total Revenue</p>
                  <h2 className="text-3xl font-bold mt-2">
                    ${Number(revenue ?? 0).toFixed(2)}
                  </h2>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-white/40 text-sm">Monthly Revenue</p>
                  <h2 className="text-3xl font-bold mt-2">$0.00</h2>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-white/40 text-sm">Pending Payouts</p>
                  <h2 className="text-3xl font-bold mt-2">$0.00</h2>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-white/40">
                Revenue history will appear here.
              </div>
            </Section>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}