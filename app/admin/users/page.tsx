"use client";

import Sidebar from "@/app/components/sidebar";
import AdminHeader from "@/app/components/admin/AdminHeader";
import AdminGuard from "@/app/components/admin/AdminGuard";
import Section from "@/app/components/ui/Section";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

export default function AdminUsersPage() {
  const { user, loadingUser, users, notifications } = useAdminDashboard();

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
            <Section title="Users">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-white/[0.05] text-white/50">
                    <tr>
                      <th className="text-left p-4">Name</th>
                      <th className="text-left p-4">Email</th>
                      <th className="text-left p-4">Role</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users?.length ? (
                      users.map((item: any) => (
                        <tr key={item.id} className="border-t border-white/10">
                          <td className="p-4">{item.name ?? "Unnamed"}</td>
                          <td className="p-4 text-white/60">
                            {item.email ?? "No email"}
                          </td>
                          <td className="p-4">
                            <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                              {item.role ?? item.profile?.role ?? "user"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-6 text-center text-white/40">
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}