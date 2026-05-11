"use client";

import { ChevronLeft } from "lucide-react";

type Props = {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarWidth?: number;
};

export default function SidebarMobileToggle({
  mobileOpen,
  setMobileOpen,
  sidebarWidth = 240,
}: Props) {
  return (
    <button
      onClick={() => setMobileOpen((v) => !v)}
      aria-label="Toggle sidebar"
      className="
        fixed top-3 z-50
        flex h-9 w-9 items-center justify-center
        rounded-full border border-white/10
        bg-black/80 text-white backdrop-blur-md
        shadow-lg transition-all duration-300
        active:scale-95
      "
      style={{
        left: mobileOpen ? sidebarWidth - 18 : 10,
      }}
    >
      <ChevronLeft
        size={16}
        className={`transition-transform duration-300 ${
          mobileOpen ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}
