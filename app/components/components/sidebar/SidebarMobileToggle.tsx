"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";
import { BarChart3, Home, Megaphone, Package, ShoppingBag, X } from "lucide-react";
import { usePathname } from "next/navigation";

type MenuItem = {
  name: string;
  path: string;
  icon: React.ElementType;
};

type Props = {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  menu?: MenuItem[];
  onNavigate?: (path: string) => void;
};

const normalize = (p?: string) => (p || "").split("?")[0].replace(/\/+$/, "");

const FALLBACK_ITEMS = [
  { name: "Início", path: "/dashboard", icon: Home },
  { name: "Produtos", path: "/dashboard/product", icon: Package },
  { name: "Pedidos", path: "/dashboard/orders", icon: ShoppingBag },
  { name: "Campanhas", path: "/dashboard/campaigns", icon: Megaphone },
  { name: "Analytics", path: "/dashboard/analytics", icon: BarChart3 },
];

const LABEL_BY_PATH: Record<string, string> = {
  "/dashboard": "Início",
  "/dashboard/product": "Produtos",
  "/dashboard/products": "Produtos",
  "/dashboard/orders": "Pedidos",
  "/dashboard/campaigns": "Campanhas",
  "/dashboard/analytics": "Analytics",
};

const ICON_BY_LABEL: Record<string, React.ElementType> = {
  Início: Home,
  Dashboard: Home,
  Produtos: Package,
  Products: Package,
  Pedidos: ShoppingBag,
  Orders: ShoppingBag,
  Campanhas: Megaphone,
  Campaigns: Megaphone,
  Analytics: BarChart3,
};

function HexagonIcon({ active = false }: { active?: boolean }) {
  return (
    <span
      className={`relative flex h-11 w-11 items-center justify-center transition-transform duration-300 ${
        active ? "scale-95" : "scale-100"
      }`}
    >
      <span className="absolute h-8 w-8 bg-purple-400/25 blur-xl" />
      <span className="hexagon-shell absolute h-8 w-8" />
      <span className="hexagon-core absolute h-[26px] w-[26px]" />
      <span className="sr-only">Menu</span>
    </span>
  );
}

function SidebarMobileToggle({ mobileOpen, setMobileOpen, menu, onNavigate }: Props) {
  const pathname = usePathname();
  const startX = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);

  const mobileItems = useMemo(() => {
    const source = Array.isArray(menu) && menu.length > 0 ? menu : FALLBACK_ITEMS;

    const normalized = source.slice(0, 5).map((item, index) => {
      const fallback = FALLBACK_ITEMS[index] || FALLBACK_ITEMS[0];
      const label = LABEL_BY_PATH[item.path] || item.name || fallback.name;
      const Icon = ICON_BY_LABEL[label] || fallback.icon || item.icon;

      return {
        name: label,
        path: item.path || fallback.path,
        icon: Icon,
      };
    });

    while (normalized.length < 5) normalized.push(FALLBACK_ITEMS[normalized.length]);
    return normalized;
  }, [menu]);

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

      const diff = event.clientX - startX.current;
      const visualDiff = mobileOpen ? Math.min(0, diff) : Math.max(0, diff);
      setDragX(Math.max(-88, Math.min(88, visualDiff)));
    },
    [mobileOpen]
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent) => {
      if (startX.current === null) return;

      const diff = event.clientX - startX.current;
      startX.current = null;
      setDragX(0);
      event.currentTarget.releasePointerCapture?.(event.pointerId);

      if (!mobileOpen && diff > 42) openMenu();
      if (mobileOpen && diff < -42) closeMenu();
    },
    [closeMenu, mobileOpen, openMenu]
  );

  const handleHexClick = useCallback(() => {
    setMobileOpen((value) => !value);
  }, [setMobileOpen]);

  const handleNavigate = useCallback(
    (path: string) => {
      if (typeof onNavigate === "function") onNavigate(path);
      closeMenu();
    },
    [closeMenu, onNavigate]
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] block md:hidden">
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black via-black/80 to-transparent transition-opacity duration-300 ${
          mobileOpen ? "opacity-100" : "opacity-80"
        }`}
      />

      {!mobileOpen && (
        <button
          type="button"
          aria-label="Open mobile menu"
          onClick={handleHexClick}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="relative mx-auto mb-0 flex h-[82px] w-28 touch-pan-y items-center justify-center active:scale-95"
          style={{ transform: `translateX(${dragX}px)` }}
        >
          <HexagonIcon />
        </button>
      )}

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={`relative h-[104px] w-full touch-pan-y overflow-hidden rounded-t-[30px] border-t border-white/10 bg-[#050812]/95 text-white shadow-[0_-24px_70px_rgba(0,0,0,0.65)] backdrop-blur-2xl transition-all duration-300 ease-out ${
          mobileOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-full opacity-0"
        }`}
        style={{ transform: mobileOpen ? `translateY(0) translateX(${dragX}px)` : undefined }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(168,85,247,0.22),transparent_35%),radial-gradient(circle_at_82%_0%,rgba(59,130,246,0.12),transparent_28%)]" />
        <div className="absolute left-1/2 top-3 h-1.5 w-12 -translate-x-1/2 rounded-full bg-purple-500 shadow-[0_0_18px_rgba(168,85,247,0.85)]" />

        <nav className="relative flex h-full items-center justify-between gap-1 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-7">
          {mobileItems.map((item) => {
            const Icon = item.icon;
            const active = normalize(pathname) === normalize(item.path);

            return (
              <button
                key={item.path}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => handleNavigate(item.path)}
                className={`group flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-3 transition-all duration-200 active:scale-95 ${
                  active
                    ? "bg-purple-500/20 text-purple-200 shadow-[0_0_30px_rgba(168,85,247,0.25)]"
                    : "text-white/80 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <Icon size={25} strokeWidth={1.8} />
                <span className="max-w-full truncate text-[12px] font-medium leading-none tracking-[-0.02em]">
                  {item.name}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            aria-label="Close mobile menu"
            onClick={closeMenu}
            className="ml-1 flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white shadow-[0_10px_26px_rgba(0,0,0,0.35)] transition-all duration-200 hover:bg-white/[0.12] active:scale-95"
          >
            <X size={28} strokeWidth={1.8} />
          </button>
        </nav>
      </div>

      <style jsx>{`
        .hexagon-shell {
          clip-path: polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0 50%);
          background: linear-gradient(135deg, #d946ef, #8b5cf6 55%, #c084fc);
          filter: drop-shadow(0 0 13px rgba(168, 85, 247, 0.9));
        }

        .hexagon-core {
          clip-path: polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0 50%);
          background: #050812;
        }
      `}</style>
    </div>
  );
}

export default memo(SidebarMobileToggle);
