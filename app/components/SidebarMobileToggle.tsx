"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import { LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
  Dashboard: "Home",
  Products: "Products",
  Orders: "Orders",
  Profile: "Profile",
  Settings: "Settings",
  Contact: "Help",
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
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const startX = useRef<number | null>(null);
  const usableMenu = menu;
  const router = useRouter();

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

  const handleLogout = useCallback(async () => {
    close();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }, [close, router]);

  useEffect(() => {
    if (!mobileOpen) {
      setShowSwipeHint(false);
      return;
    }

    const start = window.setTimeout(() => setShowSwipeHint(true), 300);
    const end = window.setTimeout(() => setShowSwipeHint(false), 1150);

    return () => {
      window.clearTimeout(start);
      window.clearTimeout(end);
    };
  }, [mobileOpen]);

  return (
    <div className="fixed inset-0 z-[90] md:hidden pointer-events-none">
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
            bottom: "max(2px, env(safe-area-inset-bottom))",
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

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close mobile menu overlay"
          onClick={close}
          className="pointer-events-auto fixed inset-0 z-[90] cursor-default bg-transparent"
        />
      )}

      <nav
        aria-label="Mobile menu"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`
          pointer-events-auto fixed left-[4px] right-[4px] z-[91]
          h-[74px] bottom-[max(3px,env(safe-area-inset-bottom))]
          rounded-[32px] border border-purple-400/45
          bg-[#050711]/96 px-2.5 py-1.5 text-white shadow-[0_14px_46px_rgba(0,0,0,0.50),0_0_26px_rgba(168,85,247,0.22),inset_0_1px_0_rgba(255,255,255,0.07)]
          backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(.2,.9,.2,1)]
          ${mobileOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[calc(100%+20px)] opacity-0"}
        `}
      >
        <div
          className="flex h-full items-center gap-1.5 overflow-x-auto overflow-y-hidden overscroll-x-contain pr-2 snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ animation: showSwipeHint ? "ryfio-swipe-hint 800ms ease-in-out 1" : undefined }}
        >
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
                  group flex h-[54px] min-w-[62px] shrink-0 snap-start flex-col items-center justify-center gap-1
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
                  size={20}
                  strokeWidth={1.85}
                  className={active ? "drop-shadow-[0_0_10px_rgba(192,76,255,0.7)]" : ""}
                />
                <span className="max-w-full truncate">{label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
            className="group flex h-[54px] min-w-[68px] shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2 text-[10px] leading-none text-red-300/90 transition-all duration-300 hover:bg-red-500/10 hover:text-red-200 active:scale-95"
            style={{
              transitionDelay: mobileOpen ? `${80 + usableMenu.length * 35}ms` : "0ms",
              opacity: mobileOpen ? 1 : 0,
              transform: mobileOpen ? "translateY(0)" : "translateY(10px)",
            }}
          >
            <LogOut
              size={20}
              strokeWidth={1.85}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
            <span className="max-w-full truncate">Logout</span>
          </button>

          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="ml-0.5 flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white/90 shadow-[0_8px_18px_rgba(0,0,0,0.24),inset_0_0_18px_rgba(255,255,255,0.035)] transition-all duration-300 hover:bg-white/[0.13] active:scale-95"
          >
            <X size={16} strokeWidth={2.1} />
          </button>
        </div>
      </nav>

      <style jsx>{`
        @keyframes ryfio-swipe-hint {
          0% { transform: translateX(0); }
          42% { transform: translateX(12px); }
          100% { transform: translateX(0); }
        }

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
