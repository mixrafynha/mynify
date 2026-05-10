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
      setCollapsed(saved === "true");
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
    setCollapsed((current) => {
      const next = !current;

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

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
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
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/55"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-dvh flex-col
          border-r border-white/10 bg-black text-white
          transition-[width,transform] duration-300 ease-out
          ${
            isMobile
              ? mobileOpen
                ? "w-[min(82vw,270px)] translate-x-0"
                : "w-[min(82vw,270px)] -translate-x-full"
              : collapsed
                ? "w-[80px] translate-x-0"
                : "w-[270px] translate-x-0"
          }
        `}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <SidebarHeader expanded={expanded} />

          <SidebarMenu
            menu={menu}
            expanded={expanded}
            onNavigate={handleNav}
          />

          <SidebarFooter user={user} expanded={expanded} />
        </div>

        {!isMobile && (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="absolute -right-3 top-8 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black text-white shadow-md transition-transform hover:scale-105 active:scale-95"
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
