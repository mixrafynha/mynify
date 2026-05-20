"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/app/components/sidebar";
import ApiLoadingProvider from "@/app/components/api-loading-provider";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const hideSidebar =
    pathname.includes("/design") ||
    pathname.includes("/dashboard/product/");

  return (
    <div className="min-h-screen bg-[#f7f7fb]">
      {!hideSidebar && <Sidebar />}

      <main
        className={`
          relative z-10 min-h-screen
          transition-all duration-300
          ${hideSidebar ? "" : "md:ml-[var(--user-sidebar-width,270px)]"}
        `}
      >
        <ApiLoadingProvider>{children}</ApiLoadingProvider>
      </main>
    </div>
  );
}
