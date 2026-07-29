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
  const isProductsRoute = pathname === "/dashboard/product";

  const hideSidebar =
    pathname === "/dashboard/create" ||
    pathname.startsWith("/dashboard/design") ||
    pathname.startsWith("/dashboard/product/");

  return (
    <div className={`min-h-screen ${isProductsRoute ? "bg-[#080814]" : "bg-[#f7f7fb]"}`}>
      {!hideSidebar && <Sidebar />}

      <main
        className={`
          relative z-10 min-h-screen
          ${isProductsRoute ? "bg-[#080814]" : ""}
          transition-all duration-300
          ${hideSidebar ? "" : "md:ml-[var(--user-sidebar-width,270px)]"}
        `}
      >
        <ApiLoadingProvider>{children}</ApiLoadingProvider>
      </main>
    </div>
  );
}
