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

  const normalize = (p: string) => p.split("?")[0].replace(/\/+$/, "");

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
        "group relative flex w-full items-center overflow-hidden rounded-2xl",
        "transition-all duration-300 ease-out active:scale-[0.98]",
        expanded ? "gap-4 px-4 py-3.5" : "justify-center px-3 py-3.5",

        active
          ? "bg-gradient-to-r from-purple-600/20 via-fuchsia-500/15 to-cyan-500/10 text-white shadow-[0_0_28px_rgba(168,85,247,0.22)]"
          : "text-white/45 hover:bg-white/[0.045] hover:text-white",
      ].join(" ")}
    >
      {/* ACTIVE GLOW */}
      {active && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(168,85,247,0.28),transparent_55%)]" />
          <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-300 via-fuchsia-500 to-cyan-400 shadow-[0_0_18px_rgba(168,85,247,0.85)]" />
        </>
      )}

      {/* ICON */}
      <div
        className={[
          "relative z-10 flex items-center justify-center rounded-xl transition-all duration-300",
          expanded ? "h-9 w-9" : "h-10 w-10",
          active
            ? "bg-white/10 text-purple-300 shadow-[0_0_18px_rgba(168,85,247,0.35)]"
            : "text-white/45 group-hover:bg-white/5 group-hover:text-purple-300",
        ].join(" ")}
      >
        <Icon size={20} />
      </div>

      {/* LABEL */}
      {expanded && (
        <span
          className={[
            "relative z-10 truncate text-sm font-bold tracking-tight transition-colors duration-300",
            active ? "text-white" : "text-white/55 group-hover:text-white",
          ].join(" ")}
        >
          {item.name}
        </span>
      )}

      {/* ACTIVE DOT */}
      {active && expanded && (
        <div className="absolute right-4 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.95)]" />
      )}
    </button>
  );
}
