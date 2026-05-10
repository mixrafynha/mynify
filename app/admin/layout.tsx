import AdminSidebar from "@/app/components/admin/AdminSidebar";
import type { ReactNode } from "react";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0b0f17] flex">

      {/* SIDEBAR */}
      <AdminSidebar />

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full md:pl-[280px] relative z-10">
        {children}
      </main>

    </div>
  );
}
