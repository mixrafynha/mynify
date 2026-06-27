"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Home, Package, Users, DollarSign, Settings, BarChart3, type LucideIcon } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import SidebarShell, { type SidebarMenuItem } from "./sidebar/SidebarShell";
import SidebarMobileToggle from "./sidebar/SidebarMobileToggle";

import { useIsMobile } from "@/hooks/useIsMobile";

type UserProfile = {
  role?: string;
};

type AuthUser = {
  id?: string;
  email?: string;
  role?: string;
  profile?: UserProfile;
};

const STORAGE_KEY = "admin-sidebar-collapsed";

const SIDEBAR_WIDTH = {
  expanded: 270,
  collapsed: 80,
};

const ADMIN_MENU: SidebarMenuItem[] = [
  { name: "Dashboard", icon: Home as LucideIcon, path: "/admin" },
  { name: "Products", icon: Package as LucideIcon, path: "/admin/products" },
  { name: "Users", icon: Users as LucideIcon, path: "/admin/users" },
  { name: "Analytics", icon: BarChart3 as LucideIcon, path: "/admin/analytics" },
  { name: "Revenue", icon: DollarSign as LucideIcon, path: "/admin/revenue" },
  { name: "Settings", icon: Settings as LucideIcon, path: "/admin/settings" },
];

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const menu = useMemo(() => ADMIN_MENU, []);

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

    document.documentElement.style.setProperty("--admin-sidebar-width", width);
  }, [collapsed, isMobile]);

  useEffect(() => {
    if (isAuthRoute) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadUser() {
      try {
        const res = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) {
          setUser(null);
          return;
        }

        const data = await res.json();
        setUser(data?.user ?? null);
      } catch {
        if (!controller.signal.aborted) setUser(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadUser();

    return () => controller.abort();
  }, [isAuthRoute]);

  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  const role = user?.profile?.role ?? user?.role ?? null;
  const isAdmin = role === "admin";

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;

      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}

      document.documentElement.style.setProperty(
        "--admin-sidebar-width",
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

  if (isAuthRoute) return null;

  if (loading) {
    return (
      <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-[270px] bg-[#03030a] p-5 md:block">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-purple-400/14" />
        <div className="mb-10 h-11 w-36 animate-pulse rounded-2xl bg-white/10" />
        <div className="space-y-4">
          <div className="h-11 animate-pulse rounded-2xl bg-white/10" />
          <div className="h-11 animate-pulse rounded-2xl bg-white/10" />
          <div className="h-11 animate-pulse rounded-2xl bg-white/10" />
          <div className="h-11 animate-pulse rounded-2xl bg-white/10" />
        </div>
        <div className="absolute bottom-5 left-5 right-5 h-14 animate-pulse rounded-2xl bg-white/10" />
      </aside>
    );
  }

  if (!user || !isAdmin) return null;

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
          isAdmin
          onNavigate={handleNav}
          onToggleCollapsed={toggleCollapsed}
          width={SIDEBAR_WIDTH}
        />
      )}
    </>
  );
}
