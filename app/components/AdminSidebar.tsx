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

        if (!res.ok) {
          if (!mounted) return;
          setUser(null);
          return;
        }

        const data = await res.json();

        if (!mounted) return;

        setUser(data?.user ?? null);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.documentElement.style.setProperty(
      "--admin-sidebar-width",
      isMobile ? "0px" : collapsed ? "80px" : "270px"
    );
  }, [collapsed, isMobile]);

  const role = user?.profile?.role ?? user?.role ?? null;
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
      <div className="fixed left-0 top-0 z-40 flex h-screen w-[270px] items-center justify-center border-r border-white/10 bg-[#03030a] text-white">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-bold text-white/45 shadow-[0_0_35px_rgba(168,85,247,0.18)] backdrop-blur-xl">
          Loading sidebar...
        </div>
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
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm"
        />
      )}

      <aside
        data-sidebar={expanded ? "expanded" : "collapsed"}
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col overflow-hidden border-r border-white/10 bg-[#03030a]/95 text-white shadow-[0_0_55px_rgba(168,85,247,0.16)] backdrop-blur-2xl transition-[width,transform] duration-300 ease-out ${
          isMobile
            ? mobileOpen
              ? "w-[250px] translate-x-0"
              : "w-[250px] -translate-x-full"
            : collapsed
            ? "w-[80px]"
            : "w-[270px]"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.18),transparent_32%),radial-gradient(circle_at_90%_25%,rgba(14,165,233,0.10),transparent_28%)]" />

        <div className="relative z-10 flex h-full min-h-0 flex-col">
          <SidebarHeader expanded={expanded} />

          <SidebarMenu
            menu={menu}
            expanded={expanded}
            onNavigate={handleNav}
            isAdmin={isAdmin}
          />

          <SidebarFooter user={user} expanded={expanded} />
        </div>

        {!isMobile && (
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="absolute -right-3 top-8 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#070711] text-white shadow-[0_0_25px_rgba(168,85,247,0.35)] transition hover:scale-110 hover:border-purple-500/45 hover:bg-purple-500/20 active:scale-95"
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
