import AdminSidebar from "@/app/components/AdminSidebar";
import type { ReactNode } from "react";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0b0f17]">
      {/* SIDEBAR */}
      <AdminSidebar />

      {/* MAIN CONTENT */}
      <main
        className="
          relative z-10 min-h-screen
          transition-all duration-300
          md:ml-[var(--admin-sidebar-width,280px)]
        "
      >
        {children}
      </main>
    </div>
  );
}
