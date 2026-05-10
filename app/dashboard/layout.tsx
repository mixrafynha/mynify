import type { ReactNode } from "react";
import Sidebar from "@/app/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f7fb]">
      <Sidebar />

      <main className="relative z-10 min-h-screen transition-all duration-300 md:ml-[var(--user-sidebar-width,270px)]">
        {children}
      </main>
    </div>
  );
}
