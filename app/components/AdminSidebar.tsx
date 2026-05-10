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
      if (saved === "true") setCollapsed(true);
      if (saved === "false") setCollapsed(false);
    } catch {}
  }, []);

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
    setCollapsed((value) => {
      const nextValue = !value;

      try {
        window.localStorage.setItem(STORAGE_KEY, String(nextValue));
      } catch {}

      return nextValue;
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
      <aside className="fixed left-0 top-0 z-40 h-dvh w-[270px] bg-[#03030a]/95 border-r border-white/10 backdrop-blur-2xl p-5 hidden md:block">
        <div className="h-11 w-36 rounded-2xl bg-white/10 animate-pulse mb-10" />

        <div className="space-y-4">
          <div className="h-11 rounded-2xl bg-white/10 animate-pulse" />
          <div className="h-11 rounded-2xl bg-white/10 animate-pulse" />
          <div className="h-11 rounded-2xl bg-white/10 animate-pulse" />
          <div className="h-11 rounded-2xl bg-white/10 animate-pulse" />
        </div>

        <div className="absolute bottom-5 left-5 right-5 h-14 rounded-2xl bg-white/10 animate-pulse" />
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
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 h-dvh overflow-hidden
          bg-[#03030a]/95 text-white border-r border-white/10
          backdrop-blur-2xl shadow-[0_0_55px_rgba(168,85,247,0.16)]
          transition-[width,transform] duration-300 ease-out will-change-transform
          ${
            isMobile
              ? mobileOpen
                ? "translate-x-0 w-[min(82vw,270px)]"
                : "-translate-x-full w-[min(82vw,270px)]"
              : collapsed
              ? "translate-x-0 w-[80px]"
              : "translate-x-0 w-[270px]"
          }
        `}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.18),transparent_32%),radial-gradient(circle_at_90%_25%,rgba(14,165,233,0.10),transparent_28%)]" />

        <div className="relative z-10 flex h-full flex-col overflow-y-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <SidebarHeader expanded={expanded} />

          <div className="flex-1">
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
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggleCollapsed}
            className="
              absolute -right-3 top-8 z-50
              grid h-9 w-9 place-items-center rounded-full
              bg-[#070711] border border-white/20 text-white
              shadow-[0_0_25px_rgba(168,85,247,0.35)]
              hover:scale-110 hover:border-purple-500/45 hover:bg-purple-500/20
              active:scale-95 transition-all
            "
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
