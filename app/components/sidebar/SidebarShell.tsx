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
      className="fixed left-0 top-0 z-50 hidden h-dvh flex-col bg-[#03030a] text-white transition-[width] duration-300 ease-[cubic-bezier(.2,.9,.2,1)] md:flex"
    >
      <style jsx global>{`
        .sidebar-scroll-shell::-webkit-scrollbar {
          width: 8px;
        }

        .sidebar-scroll-shell::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar-scroll-shell::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background-color: rgba(255, 255, 255, 0.18);
          transition: background-color 180ms ease;
        }

        .sidebar-scroll-shell:hover::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.32);
        }

        .sidebar-scroll-shell[data-expanded="true"] .sidebar-shell-content {
          animation: sidebar-shell-in 220ms cubic-bezier(.2,.9,.2,1) both;
        }

        @keyframes sidebar-shell-in {
          from {
            opacity: 0;
            transform: translate3d(-8px, 0, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-purple-400/14" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.10),transparent_34%)]" />

      <div
        data-expanded={expanded ? "true" : "false"}
        className="sidebar-scroll-shell relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-gutter:stable] [scrollbar-width:thin] [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-white/12 [&::-webkit-scrollbar-thumb:hover]:bg-white/22"
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
