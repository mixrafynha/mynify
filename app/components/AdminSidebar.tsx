"use client";

import { useCallback, useState, useMemo, useEffect } from "react";
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

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();

        if (!mounted) return;

        setUser(data?.user ?? null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  /* 🔥 FIX PRINCIPAL (ROBUSTO SAAS) */
  const role =
    user?.profile?.role ??
    user?.role ??
    null;

  const isAdmin = role === "admin";

  const menu = useMemo(
    () => [
      { name: "Dashboard", icon: Home, path: "/admin" },
      { name: "Products", icon: Package, path: "/admin/products" },
      { name: "Users", icon: Users, path: "/admin/users" },
      { name: "Analytics", icon: BarChart3, path: "/admin/analytics" },
      { name: "Revenue", icon: DollarSign, path: "/admin/revenue" },
      { name: "Settings", icon: Settings, path: "/admin/settings" },
    ],
    []
  );

  const handleNav = useCallback(
    (path: string) => {
      router.push(path);
      if (isMobile) setMobileOpen(false);
    },
    [router, isMobile]
  );

  const expanded = isMobile ? mobileOpen : !collapsed;

  if (pathname === "/login") return null;

  if (loading) {
    return (
      <div className="text-white p-4 text-sm opacity-60">
        Loading sidebar...
      </div>
    );
  }

  if (!user) return null;

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
          className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen 
        bg-black text-white border-r border-white/10 
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
        <SidebarHeader expanded={expanded} />

        <SidebarMenu
          menu={menu}
          expanded={expanded}
          onNavigate={handleNav}
          isAdmin={isAdmin}
        />

        <SidebarFooter user={user} expanded={expanded} />

        {!isMobile && (
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="absolute -right-3 top-8 z-50 w-9 h-9 rounded-full 
            bg-black border border-white/30 
            flex items-center justify-center
            shadow-lg hover:scale-110 active:scale-95 transition-all"
          >
            <ChevronLeft
              size={18}
              className={collapsed ? "rotate-180" : ""}
            />
          </button>
        )}
      </aside>
    </>
  );
}