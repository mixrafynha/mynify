"use client";

import { ChevronLeft } from "lucide-react";

type Props = {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean | ((v: boolean) => boolean)) => void;
  sidebarWidth?: number; // 👈 chave do upgrade
};

export default function SidebarMobileToggle({
  mobileOpen,
  setMobileOpen,
  sidebarWidth = 240, // default SaaS
}: Props) {
  return (
    <button
      onClick={() => setMobileOpen((v: boolean) => !v)}
      className={`
        fixed top-3 z-50 w-10 h-10 rounded-full
        bg-black border border-white/20
        flex items-center justify-center text-white shadow-xl
        transition-all
      `}
      style={{
        left: mobileOpen ? sidebarWidth - 20 : 8,
      }}
    >
      <ChevronLeft
        size={20}
        className={`transition-transform duration-300 ${
          mobileOpen ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}