"use client";

import { memo, useCallback, useRef, useState } from "react";
import type React from "react";
import { X } from "lucide-react";

type MenuItem = {
  name: string;
  path: string;
  icon: React.ElementType;
};

type Props = {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  menu?: MenuItem[];
  pathname?: string | null;
  onNavigate?: (path: string) => void;
};

const labelMap: Record<string, string> = {
  Dashboard: "Dashboard",
  Products: "Products",
  Orders: "Orders",
  Profile: "Profile",
  Settings: "Settings",
  Contact: "Contact",
};

const normalize = (p?: string | null) =>
  (p || "").split("?")[0].replace(/\/+$/, "") || "/";

function HexagonIcon({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative block h-8 w-8 ${className}`}
    >
      <svg viewBox="0 0 48 48" className="h-full w-full overflow-visible">
        <path
          d="M24 3.8 41.2 13.9v20.2L24 44.2 6.8 34.1V13.9L24 3.8Z"
          fill="rgba(0,0,0,0.96)"
          stroke="rgb(196,76,255)"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function SidebarMobileToggle({
  mobileOpen,
  setMobileOpen,
  menu = [],
  pathname,
  onNavigate,
}: Props) {
  const [dragX, setDragX] = useState(0);
  const startX = useRef<number | null>(null);
  const usableMenu = menu;

  const open = useCallback(() => setMobileOpen(true), [setMobileOpen]);
  const close = useCallback(() => setMobileOpen(false), [setMobileOpen]);

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    startX.current = event.clientX;
    setDragX(0);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (startX.current === null) return;
      const next = event.clientX - startX.current;
      setDragX(Math.max(-90, Math.min(120, next)));
    },
    []
  );

  const onPointerUp = useCallback(() => {
    if (dragX > 42) open();
    if (dragX < -42) close();
    startX.current = null;
    setDragX(0);
  }, [close, dragX, open]);

  const handleNavigate = useCallback(
    (path: string) => {
      onNavigate?.(path);
      close();
    },
    [close, onNavigate]
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] md:hidden pointer-events-none">
      {!mobileOpen && (
        <button
          type="button"
          aria-label="Open menu"
          onClick={open}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            transform: `translateX(calc(-50% + ${dragX}px))`,
            bottom: "max(10px, env(safe-area-inset-bottom))",
          }}
          className="
            pointer-events-auto fixed left-1/2 z-[92]
            flex h-[48px] w-[48px] touch-none items-center justify-center
            bg-transparent p-0 outline-none
            transition-transform duration-300 ease-[cubic-bezier(.2,.9,.2,1)] active:scale-95
          "
        >
          <HexagonIcon className="h-8 w-8 animate-[hex-float_2.4s_cubic-bezier(.45,0,.2,1)_infinite] drop-shadow-[0_0_10px_rgba(192,76,255,0.75)]" />
        </button>
      )}

      <nav
        aria-label="Mobile menu"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`
          pointer-events-auto fixed inset-x-0 bottom-0 z-[91]
          h-[92px] pb-[max(8px,env(safe-area-inset-bottom))]
          rounded-t-[24px] border border-white/10 border-b-0
          bg-[#050711]/96 px-2.5 pt-2 text-white shadow-[0_-12px_46px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.07)]
          backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(.2,.9,.2,1)]
          ${mobileOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"}
        `}
      >
        <div className="flex h-full flex-col gap-1.5">
          <div className="flex h-4 items-center justify-center">
            <div
              aria-hidden="true"
              className="h-1 w-10 rounded-full bg-white/28 shadow-[0_0_14px_rgba(255,255,255,0.12)]"
            />
          </div>

          <div className="relative flex min-h-0 flex-1 items-center">
            <div className="flex h-full flex-1 items-center gap-1.5 overflow-x-auto overflow-y-hidden overscroll-x-contain pr-[52px] [-ms-overflow-style:none] [scrollbar-width:none] [scroll-snap-type:x_proximity] [&::-webkit-scrollbar]:hidden">
          {usableMenu.map((item, index) => {
            const Icon = item.icon;
            const active = normalize(pathname) === normalize(item.path);
            const label = labelMap[item.name] || item.name;

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNavigate(item.path)}
                aria-current={active ? "page" : undefined}
                className={`
                  group flex h-[56px] min-w-[64px] shrink-0 snap-start flex-col items-center justify-center gap-1
                  rounded-[18px] px-2 py-2 text-[10px] leading-none
                  transition-all duration-300 active:scale-95
                  ${active ? "bg-[linear-gradient(180deg,rgba(168,85,247,0.26),rgba(88,28,135,0.18))] text-purple-100 shadow-[0_8px_22px_rgba(168,85,247,0.14),inset_0_0_22px_rgba(168,85,247,0.18)]" : "text-white/80 hover:bg-white/[0.06] hover:text-white"}
                `}
                style={{
                  transitionDelay: mobileOpen ? `${80 + index * 35}ms` : "0ms",
                  opacity: mobileOpen ? 1 : 0,
                  transform: mobileOpen ? "translateY(0)" : "translateY(10px)",
                }}
              >
                <Icon
                  size={21}
                  strokeWidth={1.85}
                  className={active ? "drop-shadow-[0_0_10px_rgba(192,76,255,0.7)]" : ""}
                />
                <span className="max-w-full truncate">{label}</span>
              </button>
            );
          })}

            </div>

            <button
              type="button"
              aria-label="Close menu"
              onClick={close}
              className="absolute right-1 top-1/2 flex h-[34px] w-[34px] -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#080914]/92 text-white/85 shadow-[0_8px_18px_rgba(0,0,0,0.28),inset_0_0_18px_rgba(255,255,255,0.035)] transition-all duration-300 hover:bg-white/[0.1] active:scale-95"
            >
              <X size={15} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </nav>

      <style jsx>{`
        @keyframes hex-float {
          0%, 100% {
            transform: translateY(0) scale(1);
            filter: drop-shadow(0 0 8px rgba(192,76,255,0.55));
          }
          45% {
            transform: translateY(-4px) scale(1.045);
            filter: drop-shadow(0 0 15px rgba(192,76,255,0.85));
          }
          70% {
            transform: translateY(-1px) scale(0.99);
            filter: drop-shadow(0 0 10px rgba(192,76,255,0.65));
          }
        }
      `}</style>
    </div>
  );
}

export default memo(SidebarMobileToggle);
