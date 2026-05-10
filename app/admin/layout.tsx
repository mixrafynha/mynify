import AdminSidebar from "@/app/components/AdminSidebar";
import type { ReactNode } from "react";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#0b0f17]">
      {/* SIDEBAR */}
      <AdminSidebar />

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
