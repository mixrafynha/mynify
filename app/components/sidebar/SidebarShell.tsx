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
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-purple-400/14" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.10),transparent_34%)]" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SidebarHeader expanded={expanded} />

        <SidebarMenu
          menu={menu}
          expanded={expanded}
          onNavigate={onNavigate}
          isAdmin={isAdmin}
        />

        <SidebarFooter user={user} expanded={expanded} />
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
