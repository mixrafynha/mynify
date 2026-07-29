"use client";

import { memo, useMemo } from "react";
import { ChevronLeft, type LucideIcon } from "lucide-react";

import SidebarHeader from "./SidebarHeader";
import SidebarMenu from "./SidebarMenu";
import SidebarFooter from "./SidebarFooter";

export type SidebarMenuItem = {
  name: string;
  icon: LucideIcon;
  path: string;
  adminOnly?: boolean;
};

type SidebarShellProps = {
  menu: SidebarMenuItem[];
  user?: any;
  collapsed: boolean;
  transitionsReady?: boolean;
  isAdmin?: boolean;
  onNavigate: (path: string) => void;
  onToggleCollapsed: () => void;
  width?: {
    expanded: number;
    collapsed: number;
  };
};

const DEFAULT_WIDTH = {
  expanded: 270,
  collapsed: 80,
};

function SidebarShell({
  menu,
  user,
  collapsed,
  transitionsReady = true,
  isAdmin = false,
  onNavigate,
  onToggleCollapsed,
  width = DEFAULT_WIDTH,
}: SidebarShellProps) {
  const expanded = !collapsed;
  const sidebarWidth = expanded ? width.expanded : width.collapsed;

  const asideStyle = useMemo(
    () => ({
      width: sidebarWidth,
      transform: "translate3d(0,0,0)",
    }),
    [sidebarWidth]
  );

  return (
    <aside
      style={asideStyle}
      className={`fixed left-0 top-0 z-50 hidden h-dvh flex-col bg-[#03030a] text-white md:flex ${
        transitionsReady
          ? "transition-[width] duration-300 ease-[cubic-bezier(.2,.9,.2,1)]"
          : "transition-none"
      }`}
    >
      <style jsx global>{`
        .sidebar-scroll-shell::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar-scroll-shell::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar-scroll-shell::-webkit-scrollbar-thumb {
          border-radius: 999px;
          border: 1px solid transparent;
          background-color: rgba(255, 255, 255, 0.14);
          background-clip: padding-box;
          transition:
            background-color 180ms ease,
            opacity 180ms ease;
          opacity: 0.72;
        }

        .sidebar-scroll-shell:hover::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.24);
          opacity: 1;
        }
      `}</style>

      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-purple-400/14" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.10),transparent_34%)]" />

      <div
        data-expanded={expanded ? "true" : "false"}
        className="sidebar-scroll-shell relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-color:rgba(255,255,255,0.24)_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin] [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar-thumb:hover]:bg-white/25"
      >
        <div className="sidebar-shell-content flex min-h-0 flex-1 flex-col">
          <SidebarHeader expanded={expanded} />

          <SidebarMenu
            menu={menu}
            expanded={expanded}
            onNavigate={onNavigate}
            isAdmin={isAdmin}
          />

          <SidebarFooter user={user} expanded={expanded} />
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-8 z-50 flex h-8 w-8 items-center justify-center rounded-full border border-purple-300/35 bg-[#05050d] text-white shadow-[0_0_18px_rgba(168,85,247,0.18)] transition-transform duration-200 hover:scale-105 active:scale-95"
      >
        <ChevronLeft
          size={17}
          className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
        />
      </button>
    </aside>
  );
}

export default memo(SidebarShell);
