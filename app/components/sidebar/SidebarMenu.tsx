"use client";

import React from "react";
import SidebarItem from "./SidebarItem";

type MenuItem = {
  name: string;
  path: string;
  icon: React.ElementType;
  adminOnly?: boolean;
};

type SidebarMenuProps = {
  menu: MenuItem[];
  expanded: boolean;
  onNavigate: (path: string) => void;
  isAdmin?: boolean;
  loading?: boolean;
};

export default function SidebarMenu({
  menu,
  expanded,
  onNavigate,
  isAdmin = false,
  loading = false,
}: SidebarMenuProps) {
  if (!Array.isArray(menu)) return null;

  // 🔥 evita flicker antes de user carregar
  if (loading) return null;

  return (
    <div className="flex-1 overflow-y-auto px-3 py-8 space-y-9">
      {menu.map((item) => {
        if (!item?.path || !item?.icon) return null;

        // 🔐 ADMIN PROTECTION
        if (item.adminOnly && !isAdmin) return null;

        return (
          <SidebarItem
            key={item.path}
            item={item}
            expanded={expanded}
            onClick={onNavigate}
          />
        );
      })}
    </div>
  );
}