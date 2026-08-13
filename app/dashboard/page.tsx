"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  Plus,
  Package,
  ShoppingCart,
  Sparkles,
  Truck,
  Store,
  Settings,
  Megaphone,
} from "lucide-react";

import Section from "@/app/components/ui/Section";
import { useDashboard } from "@/hooks/useDashboard";

const CartDrawer = dynamic(() => import("@/app/components/ui/CartDrawer"), {
  ssr: false,
});

const NotificationBell = dynamic(
  () => import("@/app/components/NotificationBell"),
  {
    ssr: false,
    loading: () => (
      <div className="h-10 w-10 rounded-full border border-white/10 bg-white/5 md:h-11 md:w-11" />
    ),
  }
);

const SmartCreateButton = dynamic(
  () => import("@/app/components/SmartCreateButton"),
  {
    ssr: false,
    loading: () => (
      <div className="h-11 w-11 rounded-full border border-slate-300 bg-white sm:w-auto sm:px-4" />
    ),
  }
);

const ProductGrid = dynamic(
  () => import("@/app/components/products/ProductGrid"),
  {
    loading: () => (
      <div className="h-[320px] animate-pulse rounded-[24px] bg-white/60" />
    ),
  }
);

const safeArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);

let lastClick = 0;

type CartItem = { quantity: number };
type Ad = { title?: string; desc?: string; cta?: string; href?: string };

const DEFAULT_AD: Required<Ad> = {
  title: "Launch faster with a cleaner workflow",
  desc: "Create products, check orders, and keep the store moving without extra noise.",
  cta: "Explore tools",
  href: "/dashboard/advertise",
};

const QUICK_ACTIONS = [
  {
    title: "Create product",
    desc: "Start a new design or launch a fresh product in a few clicks.",
    href: "/dashboard/create",
    icon: Plus,
  },
  {
    title: "View products",
    desc: "Open the catalog, review items, and jump into product edits.",
    href: "/dashboard/product",
    icon: Store,
  },
  {
    title: "Check orders",
    desc: "Track incoming orders and follow the fulfillment flow.",
    href: "/dashboard/orders",
    icon: Truck,
  },
  {
    title: "Store settings",
    desc: "Tune your profile, account and operational basics.",
    href: "/dashboard/settings",
    icon: Settings,
  },
] as const;

export default function Dashboard() {
  const router = useRouter();
  const cartRequestRef = useRef<Promise<void> | null>(null);

  const {
    cartOpen,
    openCart,
    closeCart,
    products,
    isLoading,
    notifications,
    canSell,
  } = useDashboard();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [ad, setAd] = useState<Required<Ad>>(DEFAULT_AD);

  const safeProducts = useMemo(() => safeArray<any>(products), [products]);
  const safeNotifications = useMemo(() => safeArray<any>(notifications), [notifications]);

  const totalCartItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cartItems]
  );

  const goTo = useCallback((href: string) => {
    router.push(href);
  }, [router]);

  const loadCartCount = useCallback(async () => {
    if (cartRequestRef.current) return cartRequestRef.current;

    const request = (async () => {
      try {
        const res = await fetch("/api/cart", { cache: "no-store" });
        if (!res.ok) return;

        const data = await res.json();
        setCartItems(safeArray<CartItem>(data?.items));
      } catch {
        setCartItems([]);
      } finally {
        cartRequestRef.current = null;
      }
    })();

    cartRequestRef.current = request;
    return request;
  }, []);

  const loadAd = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard-ad", { cache: "no-store" });
      if (!res.ok) return;

      const data: Ad = await res.json();

      setAd({
        title: data.title || DEFAULT_AD.title,
        desc: data.desc || DEFAULT_AD.desc,
        cta: data.cta || DEFAULT_AD.cta,
        href: data.href || DEFAULT_AD.href,
      });
    } catch {
      setAd(DEFAULT_AD);
    }
  }, []);

  useEffect(() => {
    loadCartCount();
    const deferredAd = window.setTimeout(loadAd, 350);
    return () => window.clearTimeout(deferredAd);
  }, [loadCartCount, loadAd]);

  useEffect(() => {
    if (!cartOpen) loadCartCount();
  }, [cartOpen, loadCartCount]);

  const safeOpenCart = useCallback(() => {
    const now = Date.now();
    if (now - lastClick < 300) return;
    lastClick = now;
    openCart();
  }, [openCart]);

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.11),transparent_34%),radial-gradient(circle_at_85%_0%,rgba(16,185,129,0.09),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#f6f7fb_35%,#eef2ff_100%)]" />

      <div className="relative z-10">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">
                Dashboard
              </p>
              <h1 className="truncate text-xl font-black tracking-[-0.04em] text-slate-950 sm:text-2xl">
                Admin landing
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={safeOpenCart}
                className="relative grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 active:scale-95 md:h-11 md:w-11"
                aria-label="Open cart"
              >
                <ShoppingCart size={18} />
                {totalCartItems > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-950 px-1.5 text-[11px] font-black text-white">
                    {totalCartItems}
                  </span>
                )}
              </button>

              <NotificationBell notifications={safeNotifications} />
              <SmartCreateButton />
            </div>
          </div>
        </header>

        <main className="px-4 py-5 sm:px-6 sm:py-6">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
            <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  <Sparkles size={13} />
                  Ready to move
                </div>

                <div className="mt-5 max-w-2xl">
                  <h2 className="text-3xl font-black tracking-[-0.055em] text-slate-950 sm:text-5xl">
                    Keep the admin flow simple and fast.
                  </h2>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                    A lightweight workspace for the daily tasks: create products,
                    inspect orders, check notifications, and jump into the store
                    when something needs attention.
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => goTo("/dashboard/create")}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-95"
                  >
                    Create product
                    <ArrowRight size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => goTo("/dashboard/product")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:text-slate-950 active:scale-95"
                  >
                    Browse catalog
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_18px_60px_rgba(15,23,42,0.16)] sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10">
                    <Megaphone size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/55">
                      Featured action
                    </p>
                    <h3 className="mt-2 text-2xl font-black tracking-[-0.05em] sm:text-3xl">
                      {ad.title}
                    </h3>
                  </div>
                </div>

                <p className="mt-5 max-w-md text-sm leading-6 text-white/72">
                  {ad.desc}
                </p>

                <button
                  type="button"
                  onClick={() => goTo(ad.href)}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:scale-[1.01] active:scale-95"
                >
                  {ad.cta}
                  <ArrowRight size={16} />
                </button>

                <div className="mt-8 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                      Cart
                    </p>
                    <p className="mt-2 text-2xl font-black">{totalCartItems}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                      Status
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      {canSell ? "Selling" : "Free"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    key={action.title}
                    type="button"
                    onClick={() => goTo(action.href)}
                    className="group rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-[0_14px_40px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_50px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white transition group-hover:scale-[1.03]">
                        <Icon size={18} />
                      </div>
                      <ArrowRight size={16} className="mt-1 text-slate-400 transition group-hover:text-slate-950" />
                    </div>
                    <h3 className="mt-5 text-lg font-black tracking-[-0.04em] text-slate-950">
                      {action.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {action.desc}
                    </p>
                  </button>
                );
              })}
            </section>

            <section className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                    <Bell size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                      Operations
                    </p>
                    <h3 className="text-xl font-black tracking-[-0.04em] text-slate-950">
                      Useful next steps
                    </h3>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={safeOpenCart}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                  >
                    Open cart drawer
                    <ArrowRight size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => goTo("/dashboard/orders")}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                  >
                    Review current orders
                    <ArrowRight size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => goTo("/dashboard/settings")}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                  >
                    Update account settings
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-8">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                      Products
                    </p>
                    <h3 className="text-xl font-black tracking-[-0.04em] text-slate-950">
                      Recent catalog overview
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => goTo("/dashboard/product")}
                    className="text-sm font-bold text-slate-600 transition hover:text-slate-950"
                  >
                    View all
                  </button>
                </div>

                <Section title="">
                  <ProductGrid products={safeProducts} isLoading={isLoading} />
                </Section>
              </div>
            </section>
          </div>
        </main>
      </div>

      <CartDrawer open={cartOpen} onClose={closeCart} />
    </div>
  );
}
