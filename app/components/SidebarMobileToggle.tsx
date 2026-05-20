"use client";

import { memo } from "react";

type Props = {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

function SidebarMobileToggle({
  mobileOpen,
  setMobileOpen,
}: Props) {
  return (
    <button
      type="button"
      aria-label={mobileOpen ? "Close sidebar" : "Open sidebar"}
      onClick={() => setMobileOpen((v) => !v)}
      className="
        fixed left-3 top-1 z-[80]
        flex h-8 w-8 items-center justify-center
        active:scale-90
      "
    >
      <span
        className={`
          select-none text-[22px] leading-none
          transition-all duration-300
          ${
            mobileOpen
              ? "rotate-45 scale-95 text-cyan-300"
              : "animate-[star-float_1.8s_ease-in-out_infinite] text-fuchsia-300 drop-shadow-[0_0_12px_rgba(217,70,239,0.9)]"
          }
        `}
      >
        ✦
      </span>

      <style jsx>{`
        @keyframes star-float {
          0%,
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.75;
          }

          50% {
            transform: translateY(2px) scale(1.12);
            opacity: 1;
          }
        }
      `}</style>
    </button>
  );
}

export default memo(SidebarMobileToggle);
