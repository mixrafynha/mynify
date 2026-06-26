"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Home,
  Package,
  Users,
  DollarSign,
  Settings,
  ChevronLeft,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import SidebarHeader from "./SidebarHeader";
import SidebarMenu from "./SidebarMenu";
import SidebarFooter from "./SidebarFooter";
import SidebarMobileToggle from "./SidebarMobileToggle";

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

type MenuItem = {
  name: string;
  icon: LucideIcon;
  path: string;
};

const STORAGE_KEY = "admin-sidebar-collapsed";

const ADMIN_MENU: MenuItem[] = [
  { name: "Dashboard", icon: Home, path: "/admin" },
  { name: "Products", icon: Package, path: "/admin/products" },
  { name: "Users", icon: Users, path: "/admin/users" },
  { name: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  { name: "Revenue", icon: DollarSign, path: "/admin/revenue" },
  { name: "Settings", icon: Settings, path: "/admin/settings" },
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

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      setCollapsed(saved === "true");
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--admin-sidebar-width",
      isMobile ? "0px" : collapsed ? "80px" : "270px"
    );
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
        if (!controller.signal.aborted) {
          setUser(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
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
  const expanded = isMobile ? mobileOpen : !collapsed;

  const menu = useMemo<MenuItem[]>(() => ADMIN_MENU, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;

      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}

      document.documentElement.style.setProperty(
        "--admin-sidebar-width",
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

  if (isAuthRoute) return null;

  if (loading) {
    return (
      <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-[270px] border-r border-white/10 bg-black p-5 md:block">
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
          fixed left-0 top-0 z-50 flex h-dvh flex-col overflow-hidden
          border-r border-white/10 bg-black text-white
          transition-[width,transform] duration-300 ease-out
          md:will-change-[width] will-change-transform
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
        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <SidebarHeader expanded={expanded} />

          <div className="min-h-0 flex-1">
            <SidebarMenu
              menu={menu}
              expanded={expanded}
              onNavigate={handleNav}
              isAdmin
            />
          </div>

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
