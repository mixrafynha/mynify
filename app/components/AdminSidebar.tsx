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
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import SidebarHeader from "./SidebarHeader";
import SidebarMenu from "./SidebarMenu";
import SidebarFooter from "./SidebarFooter";
import SidebarMobileToggle from "./SidebarMobileToggle";

import { useIsMobile } from "@/hooks/useIsMobile";

type UserProfile = {
  role?: "admin" | "user" | string;
};

type AuthUser = {
  id?: string;
  email?: string;
  role?: string;
  profile?: UserProfile;
};

const ADMIN_MENU = Object.freeze([
  { name: "Dashboard", icon: Home, path: "/admin" },
  { name: "Products", icon: Package, path: "/admin/products" },
  { name: "Users", icon: Users, path: "/admin/users" },
  { name: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  { name: "Revenue", icon: DollarSign, path: "/admin/revenue" },
  { name: "Settings", icon: Settings, path: "/admin/settings" },
]);

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthRoute =
    pathname === "/login" || pathname === "/signup";

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
      } catch (error) {
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

  const role = user?.profile?.role ?? user?.role ?? null;
  const isAdmin = role === "admin";

  const expanded = isMobile ? mobileOpen : !collapsed;

  const handleNav = useCallback(
    (path: string) => {
      if (pathname === path) return;

      router.push(path);

      if (isMobile) {
        setMobileOpen(false);
      }
    },
    [router, pathname, isMobile]
  );

  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => !value);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const menu = useMemo(() => ADMIN_MENU, []);

  if (isAuthRoute) return null;

  if (loading) {
    return (
      <aside className="fixed top-0 left-0 z-40 h-screen w-[270px] bg-[#03030a]/95 border-r border-white/10 p-5">
        <div className="h-10 w-32 rounded-xl bg-white/10 animate-pulse mb-8" />
        <div className="space-y-4">
          <div className="h-10 rounded-xl bg-white/10 animate-pulse" />
          <div className="h-10 rounded-xl bg-white/10 animate-pulse" />
          <div className="h-10 rounded-xl bg-white/10 animate-pulse" />
        </div>
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
          aria-label="Close sidebar overlay"
          onClick={closeMobile}
          className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen
        overflow-x-hidden overflow-y-auto
        bg-[#03030a]/95 text-white border-r border-white/10
        backdrop-blur-2xl
        shadow-[0_0_55px_rgba(168,85,247,0.16)]
        flex flex-col transition-all duration-300 ${
          isMobile
            ? mobileOpen
              ? "translate-x-0 w-[250px]"
              : "-translate-x-full w-[250px]"
            : collapsed
            ? "w-[80px]"
            : "w-[270px]"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.18),transparent_32%),radial-gradient(circle_at_90%_25%,rgba(14,165,233,0.10),transparent_28%)]" />

        <div className="relative z-10 flex min-h-screen flex-col">
          <SidebarHeader expanded={expanded} />

          <SidebarMenu
            menu={menu}
            expanded={expanded}
            onNavigate={handleNav}
            isAdmin
          />

          <SidebarFooter user={user} expanded={expanded} />
        </div>

        {!isMobile && (
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggleCollapsed}
            className="absolute -right-3 top-8 z-50 w-9 h-9 rounded-full 
            bg-[#070711] border border-white/20 text-white
            flex items-center justify-center
            shadow-[0_0_25px_rgba(168,85,247,0.35)]
            hover:scale-110 hover:border-purple-500/45 hover:bg-purple-500/20
            active:scale-95 transition-all"
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
