"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Home, Package, Tag, Truck, Settings, User, type LucideIcon } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import SidebarShell, { type SidebarMenuItem } from "./sidebar/SidebarShell";
import SidebarMobileToggle from "./sidebar/SidebarMobileToggle";

import { useUser } from "@/hooks/useUser";
import { useIsMobile } from "@/hooks/useIsMobile";

const STORAGE_KEY = "user-sidebar-collapsed";

const SIDEBAR_WIDTH = {
  expanded: 270,
  collapsed: 80,
};

const USER_MENU: SidebarMenuItem[] = [
  { name: "Dashboard", icon: Home as LucideIcon, path: "/dashboard" },
  { name: "Products", icon: Tag as LucideIcon, path: "/dashboard/product" },
  { name: "Orders", icon: Truck as LucideIcon, path: "/dashboard/orders" },
  { name: "Profile", icon: User as LucideIcon, path: "/dashboard/profile" },
  { name: "Settings", icon: Settings as LucideIcon, path: "/dashboard/settings" },
  { name: "Contact", icon: Package as LucideIcon, path: "/dashboard/Contact" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const isMobile = useIsMobile();

  const isAdminRoute = pathname?.startsWith("/admin");
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  const menu = useMemo(() => USER_MENU, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      setCollapsed(saved === "true");
    } catch {}
  }, []);

  useEffect(() => {
    const width = isMobile
      ? "0px"
      : collapsed
        ? `${SIDEBAR_WIDTH.collapsed}px`
        : `${SIDEBAR_WIDTH.expanded}px`;

    document.documentElement.style.setProperty("--user-sidebar-width", width);
  }, [collapsed, isMobile]);

  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;

      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}

      document.documentElement.style.setProperty(
        "--user-sidebar-width",
        next ? `${SIDEBAR_WIDTH.collapsed}px` : `${SIDEBAR_WIDTH.expanded}px`
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
        <SidebarShell
          menu={menu}
          user={user}
          collapsed={collapsed}
          onNavigate={handleNav}
          onToggleCollapsed={toggleCollapsed}
          width={SIDEBAR_WIDTH}
        />
      )}
    </>
  );
}
