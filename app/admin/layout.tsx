import AdminSidebar from "@/app/components/AdminSidebar";
import type { ReactNode } from "react";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0b0f17] flex">

      {/* SIDEBAR */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      {/* MOBILE SIDEBAR OVERLAY (se tiveres botão de abrir) */}
      <div className="md:hidden">
        <AdminSidebar />
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full md:pl-[280px] relative z-10">
        {children}
      </main>

    </div>
  );
}