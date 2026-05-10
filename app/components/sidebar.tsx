"use client";

import { useCallback, useState, useEffect, useMemo } from "react";
import {
  Home,
  Package,
  Tag,
  Truck,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import SidebarHeader from "./SidebarHeader";
import SidebarMenu from "./SidebarMenu";
import SidebarFooter from "./SidebarFooter";
import SidebarMobileToggle from "./SidebarMobileToggle";

import { useUser } from "@/hooks/useUser";
import { useIsMobile } from "@/hooks/useIsMobile";

const STORAGE_KEY = "user-sidebar-collapsed";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const { user } = useUser();
  const isMobile = useIsMobile();

  const isAdminRoute = pathname?.startsWith("/admin");
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "true") setCollapsed(true);
      if (saved === "false") setCollapsed(false);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--user-sidebar-width",
      isMobile ? "0px" : collapsed ? "80px" : "270px"
    );
  }, [collapsed, isMobile]);

  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  const expanded = isMobile ? mobileOpen : !collapsed;

  const menu = useMemo(
    () => [
      { name: "Dashboard", icon: Home, path: "/dashboard" },
      { name: "Products", icon: Tag, path: "/dashboard/product" },
      { name: "Orders", icon: Truck, path: "/dashboard/orders" },
      { name: "Settings", icon: Settings, path: "/dashboard/settings" },
      { name: "Contact", icon: Package, path: "/dashboard/Contact" },
    ],
    []
  );

  const toggleCollapsed = useCallback(() => {
    setCollapsed((v) => {
      const next = !v;

      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}

      document.documentElement.style.setProperty(
        "--user-sidebar-width",
        next ? "80px" : "270px"
      );

      return next;
    });
  }, []);

  const handleNav = useCallback(
    (path: string) => {
      if (pathname !== path) router.push(path);
      if (isMobile) setMobileOpen(false);
    },
    [router, pathname, isMobile]
  );

  if (isAdminRoute || isAuthRoute) return null;

  return (
    <>
      {isMobile && (
        <SidebarMobileToggle
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
      )}

      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/10 bg-black text-white transition-all duration-300 ${
          isMobile
            ? mobileOpen
              ? "w-[250px] translate-x-0"
              : "w-[250px] -translate-x-full"
            : collapsed
              ? "w-[80px] translate-x-0"
              : "w-[270px] translate-x-0"
        }`}
      >
        <SidebarHeader expanded={expanded} />

        <SidebarMenu
          menu={menu}
          expanded={expanded}
          onNavigate={handleNav}
        />

        <SidebarFooter user={user} expanded={expanded} />

        {!isMobile && (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="absolute -right-3 top-8 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black shadow-lg transition-all hover:scale-110 active:scale-95"
          >
            <ChevronLeft
              size={18}
              className={`transition-transform duration-300 ${
                collapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
      </aside>
    </>
  );
}
