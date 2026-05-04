"use client";

import { useCallback, useState, useEffect, useMemo } from "react";
import {
  Home,
  Package,
  Tag,
  Truck,
  DollarSign,
  BarChart3,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import { supabase } from "@/lib/supabase";

/* 🧩 IMPORT COMPONENTS */
import SidebarHeader from "./SidebarHeader";
import SidebarMenu from "./SidebarMenu";
import SidebarFooter from "./SidebarFooter";
import SidebarMobileToggle from "./SidebarMobileToggle";

/* 🧩 IMPORT HOOKS */
import { useUser } from "@/hooks/useUser";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const { user, loading } = useUser();
  const isMobile = useIsMobile();

  /* 🚨 FIX IMPORTANTE: evita render em rotas admin */
  const isAdminRoute = pathname?.startsWith("/admin");
  const isAuthRoute =
    pathname === "/login" || pathname === "/signup";

  /* ❌ NÃO MOSTRAR SIDEBAR NO ADMIN (evita duplicação) */
  if (isAdminRoute || isAuthRoute) return null;

  /* ================= STATE ================= */
  const expanded = isMobile ? mobileOpen : !collapsed;

  /* ================= MENU ================= */
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

  /* ================= NAV ================= */
  const handleNav = useCallback(
    (path: string) => {
      router.push(path);
      if (isMobile) setMobileOpen(false);
    },
    [router, isMobile]
  );

  /* ================= UI ================= */
  return (
    <>
      {/* MOBILE TOGGLE */}
      {isMobile && (
        <SidebarMobileToggle
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
      )}

      {/* OVERLAY MOBILE */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
        />
      )}

      {/* SIDEBAR */}
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
        {/* HEADER */}
        <SidebarHeader expanded={expanded} />

        {/* MENU */}
        <SidebarMenu
          menu={menu}
          expanded={expanded}
          onNavigate={handleNav}
        />

        {/* FOOTER */}
        <SidebarFooter user={user} expanded={expanded} />

        {/* DESKTOP TOGGLE */}
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