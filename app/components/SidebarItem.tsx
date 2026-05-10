"use client";

import { usePathname } from "next/navigation";
import React, { useMemo, useCallback } from "react";

type SidebarItemProps = {
  item: {
    name: string;
    path: string;
    icon: React.ElementType;
  };
  expanded: boolean;
  onClick: (path: string) => void;
};

const normalize = (p?: string) => (p || "").split("?")[0].replace(/\/+$/, "");

export default function SidebarItem({
  item,
  expanded,
  onClick,
}: SidebarItemProps) {
  const pathname = usePathname();
  const Icon = item?.icon;

  const active = useMemo(() => {
    return normalize(pathname) === normalize(item?.path);
  }, [pathname, item?.path]);

  const handleClick = useCallback(() => {
    if (!item?.path || typeof onClick !== "function") return;
    onClick(item.path);
  }, [item?.path, onClick]);

  if (!item?.path || !Icon) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-current={active ? "page" : undefined}
      title={!expanded ? item.name : undefined}
      className={[
        "group relative flex w-full items-center rounded-2xl",
        "transition-colors duration-200 active:scale-[0.98]",
        expanded ? "gap-3 px-4 py-3" : "justify-center px-3 py-3",
        active
          ? "bg-white/10 text-white"
          : "text-white/45 hover:bg-white/[0.06] hover:text-white",
      ].join(" ")}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-purple-400" />
      )}

      <span
        className={[
          "flex shrink-0 items-center justify-center rounded-xl transition-colors duration-200",
          expanded ? "h-9 w-9" : "h-10 w-10",
          active
            ? "bg-white/10 text-purple-300"
            : "text-white/45 group-hover:text-purple-300",
        ].join(" ")}
      >
        <Icon size={20} />
      </span>

      {expanded && (
        <span
          className={[
            "min-w-0 flex-1 truncate text-left text-sm font-bold tracking-tight",
            active ? "text-white" : "text-white/55 group-hover:text-white",
          ].join(" ")}
        >
          {item.name}
        </span>
      )}

      {active && expanded && (
        <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-300" />
      )}
    </button>
  );
}
