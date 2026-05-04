"use client";

import { usePathname } from "next/navigation";
import React, { useMemo } from "react";

type SidebarItemProps = {
  item: {
    name: string;
    path: string;
    icon: React.ElementType;
  };
  expanded: boolean;
  onClick: (path: string) => void;
};

export default function SidebarItem({
  item,
  expanded,
  onClick,
}: SidebarItemProps) {
  const pathname = usePathname();
  const Icon = item?.icon;

  if (!item?.path || !Icon) return null;

  // 🔥 NORMALIZAÇÃO FORTE (production safe)
  const normalize = (p: string) =>
    p.split("?")[0].replace(/\/+$/, "");

  const active = useMemo(() => {
    return normalize(pathname) === normalize(item.path);
  }, [pathname, item.path]);

  const handleClick = () => {
    if (typeof onClick !== "function") return;
    onClick(item.path);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-current={active ? "page" : undefined}
      className={[
        "group relative w-full flex items-center rounded-xl",
        "transition-all duration-200 ease-out",
        "active:scale-[0.98]",
        "hover:scale-[1.01]",

        expanded ? "gap-4 px-4 py-3" : "justify-center py-3",

        active
          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
          : "text-gray-400 hover:bg-white/5 hover:text-white",
      ].join(" ")}
    >
      {/* background */}
      <div className="absolute inset-0 rounded-xl backdrop-blur-sm transition-all duration-200" />

      {/* icon */}
      <div
        className={[
          "relative z-10 flex items-center justify-center",
          "transition-colors duration-200",
          active ? "text-emerald-400" : "text-gray-400 group-hover:text-white",
        ].join(" ")}
      >
        <Icon size={20} />
      </div>

      {/* label */}
      {expanded && (
        <span
          className={[
            "relative z-10 text-sm font-medium",
            "transition-colors duration-200",
            active ? "text-emerald-400" : "group-hover:text-white",
          ].join(" ")}
        >
          {item.name}
        </span>
      )}

      {/* active indicator */}
      {active && (
        <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
      )}
    </button>
  );
}