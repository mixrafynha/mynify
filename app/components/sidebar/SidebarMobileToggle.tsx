"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type MenuItem = {
  name: string;
  path: string;
  icon: React.ElementType;
};

type Props = {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  menu: MenuItem[];
  onNavigate: (path: string) => void;
  pathname?: string;
};

const normalize = (p?: string) => (p || "").split("?")[0].replace(/\/+$/, "");

function HexagonIcon({ active = false }: { active?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={[
        "relative block h-9 w-9 shrink-0 transition-all duration-300",
        active ? "scale-95" : "animate-[ryfio-hex-idle_2.2s_ease-in-out_infinite]",
      ].join(" ")}
    >
      <span className="absolute inset-0 bg-[linear-gradient(135deg,#c084fc,#a855f7,#7dd3fc)] [clip-path:polygon(25%_6%,75%_6%,100%_50%,75%_94%,25%_94%,0_50%)]" />
      <span className="absolute inset-[2px] bg-[#050812] [clip-path:polygon(25%_6%,75%_6%,100%_50%,75%_94%,25%_94%,0_50%)]" />
      <span className="absolute inset-0 rounded-full shadow-[0_0_22px_rgba(168,85,247,0.75)]" />
    </span>
  );
}

function SidebarMobileToggle({
  mobileOpen,
  setMobileOpen,
  menu,
  onNavigate,
  pathname = "",
}: Props) {
  const startX = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);

  const openMenu = useCallback(() => setMobileOpen(true), [setMobileOpen]);
  const closeMenu = useCallback(() => setMobileOpen(false), [setMobileOpen]);

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    startX.current = event.clientX;
    setDragX(0);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (startX.current === null) return;
      const delta = event.clientX - startX.current;
      setDragX(mobileOpen ? Math.min(0, delta) : Math.max(0, delta));
    },
    [mobileOpen]
  );

  const onPointerEnd = useCallback(() => {
    if (!mobileOpen && dragX > 46) openMenu();
    if (mobileOpen && dragX < -46) closeMenu();
    startX.current = null;
    setDragX(0);
  }, [closeMenu, dragX, mobileOpen, openMenu]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [closeMenu]);

  const visibleMenu = Array.isArray(menu) ? menu.slice(0, 5) : [];

  if (!mobileOpen) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[90] flex h-[78px] items-center justify-center border-t border-white/10 bg-[#030712]/95 pb-[max(env(safe-area-inset-bottom),8px)] shadow-[0_-18px_70px_rgba(0,0,0,0.7)] backdrop-blur-2xl md:hidden">
        <button
          type="button"
          aria-label="Open dashboard menu"
          onClick={openMenu}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          style={{ transform: `translateX(${Math.min(dragX, 130)}px)` }}
          className="flex h-16 w-20 touch-pan-x items-center justify-center rounded-3xl transition-transform duration-200 active:scale-95"
        >
          <HexagonIcon />
        </button>

        {dragX > 8 && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-y-1/2 translate-x-5 items-center gap-2 text-purple-400">
            <span className="h-px w-24 border-t border-dashed border-purple-400/80" />
            <span className="text-2xl leading-none">→</span>
          </div>
        )}

        <style jsx>{`
          @keyframes ryfio-hex-idle {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.9; }
            50% { transform: translateY(-2px) scale(1.04); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <nav
      aria-label="Dashboard mobile menu"
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-white/10 bg-[#050812]/98 px-3 pt-5 pb-[max(env(safe-area-inset-bottom),12px)] shadow-[0_-24px_90px_rgba(0,0,0,0.82)] backdrop-blur-2xl md:hidden"
    >
      <div className="absolute left-1/2 top-2 h-1 w-12 -translate-x-1/2 rounded-full bg-purple-500 shadow-[0_0_18px_rgba(168,85,247,0.95)]" />

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        style={{ transform: `translateX(${Math.max(dragX, -140)}px)` }}
        className="mx-auto flex min-h-[86px] max-w-[560px] touch-pan-x items-center justify-between gap-1 rounded-[28px] border border-white/10 bg-white/[0.035] px-2 transition-transform duration-200"
      >
        {visibleMenu.map((item) => {
          const Icon = item.icon;
          const active = normalize(pathname) === normalize(item.path);

          return (
            <button
              key={item.path}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onNavigate(item.path)}
              className={[
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-3 text-[11px] font-medium transition-all duration-200 active:scale-95",
                active
                  ? "bg-purple-500/20 text-purple-300 shadow-[0_0_26px_rgba(168,85,247,0.32)]"
                  : "text-white/80 hover:bg-white/[0.06] hover:text-white",
              ].join(" ")}
            >
              <Icon size={24} strokeWidth={1.9} />
              <span className="max-w-full truncate">{item.name === "Dashboard" ? "Início" : item.name}</span>
            </button>
          );
        })}

        <button
          type="button"
          aria-label="Close dashboard menu"
          onClick={closeMenu}
          className="ml-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white shadow-[0_0_20px_rgba(255,255,255,0.06)] transition-all duration-200 active:scale-90"
        >
          <X size={26} strokeWidth={1.8} />
        </button>
      </div>

      <style jsx>{`
        @keyframes ryfio-hex-idle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.9; }
          50% { transform: translateY(-2px) scale(1.04); opacity: 1; }
        }
      `}</style>
    </nav>
  );
}

export default memo(SidebarMobileToggle);
