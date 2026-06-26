"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Home,
  Package,
  Tag,
  Truck,
  Settings,
  ChevronLeft,
  User,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import SidebarHeader from "./SidebarHeader";
import SidebarMenu from "./SidebarMenu";
import SidebarFooter from "./SidebarFooter";
import SidebarMobileToggle from "./SidebarMobileToggle";

import { useUser } from "@/hooks/useUser";
import { useIsMobile } from "@/hooks/useIsMobile";

const STORAGE_KEY = "user-sidebar-collapsed";

const SIDEBAR_WIDTH = {
  expanded: 270,
  collapsed: 80,
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const { user } = useUser();
  const isMobile = useIsMobile();

  const isAdminRoute = pathname?.startsWith("/admin");
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  const effectiveCollapsed = isMobile ? true : collapsed;
  const expanded = !effectiveCollapsed;

  const sidebarWidth = effectiveCollapsed
    ? SIDEBAR_WIDTH.collapsed
    : SIDEBAR_WIDTH.expanded;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setCollapsed(saved === "true");
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--user-sidebar-width",
      isMobile ? "0px" : `${sidebarWidth}px`
    );
  }, [isMobile, sidebarWidth]);

  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  const menu = useMemo(
    () => [
      { name: "Dashboard", icon: Home, path: "/dashboard" },
      { name: "Products", icon: Tag, path: "/dashboard/product" },
      { name: "Orders", icon: Truck, path: "/dashboard/orders" },
      { name: "Profile", icon: User, path: "/dashboard/profile" },
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
        next
          ? `${SIDEBAR_WIDTH.collapsed}px`
          : `${SIDEBAR_WIDTH.expanded}px`
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
          menu={menu}
          pathname={pathname}
          onNavigate={handleNav}
        />
      )}


      {!isMobile && (
        <aside
          style={{
            width: sidebarWidth,
          }}
          className="fixed left-0 top-0 z-50 flex h-dvh flex-col border-r border-white/10 bg-black text-white transition-[width,transform] duration-300 ease-out"
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
        </aside>
      )}
    </>
  );
}
