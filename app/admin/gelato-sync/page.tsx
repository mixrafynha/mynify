"use client";

import GelatoSyncPage from "./ui";
import AdminGuard from "@/app/components/admin/AdminGuard";
import AdminHeader from "@/app/components/admin/AdminHeader";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

export default function GelatoSyncAdminPage() {
  return <GelatoSyncAdminShell />;
}

function GelatoSyncAdminShell() {
  const { user, loadingUser, isLoading } = useAdminDashboard();
  const role = user?.profile?.role ?? null;
  const notifications: [] = [];

  if (loadingUser || isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f7fb] px-4 py-10 text-[#111]">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
          <p className="animate-pulse text-sm font-black text-black/45">
            Loading Gelato sync...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminGuard user={user} role={role}>
      <div className="min-h-screen bg-[#f7f7fb] text-[#111]">
        <AdminHeader notifications={notifications} />
        <main className="px-3 py-4 sm:px-5 sm:py-5 lg:px-8">
          <div className="mx-auto w-full max-w-4xl">
            <GelatoSyncPage />
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
