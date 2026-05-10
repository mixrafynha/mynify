"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import NotificationBell from "@/app/components/NotificationBell";
import SmartCreateButton from "@/app/components/SmartCreateButton";

import {
  ShoppingCart,
  Sparkles,
  Wand2,
  Store,
  PackageCheck,
  ArrowRight,
  Layers3,
  Rocket,
} from "lucide-react";

import { useDashboard } from "@/hooks/useDashboard";

import Section from "@/app/components/ui/Section";
import CartDrawer from "@/app/components/ui/CartDrawer";
import ProductGrid from "@/app/components/products/ProductGrid";

const safeArray = <T,>(v: T[] | unknown): T[] => (Array.isArray(v) ? v : []);

let lastClick = 0;

type CartItem = {
  quantity: number;
};

const HERO_FEATURES = [
  {
    title: "Brand setup",
    desc: "Generate your name, niche and style with AI.",
    icon: Store,
  },
  {
    title: "Products ready",
    desc: "Prepare ideas, descriptions and launch content.",
    icon: PackageCheck,
  },
  {
    title: "Launch flow",
    desc: "Move from idea to store, ads and sales.",
    icon: Rocket,
  },
];

export default function Dashboard() {
  const {
    cartOpen,
    openCart,
    closeCart,
    goAdvertise,
    products,
    isLoading,
    notifications,
  } = useDashboard();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const safeProducts = useMemo(() => safeArray<any>(products), [products]);
  const safeNotifications = useMemo(
    () => safeArray<any>(notifications),
    [notifications]
  );

  const loadCartCount = useCallback(async () => {
    try {
      const response = await fetch("/api/cart", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = await response.json();
      setCartItems(safeArray<CartItem>(data?.items));
    } catch (error) {
      console.error("Error loading cart count:", error);
      setCartItems([]);
    }
  }, []);

  useEffect(() => {
    loadCartCount();
  }, [loadCartCount]);

  useEffect(() => {
    if (!cartOpen) loadCartCount();
  }, [cartOpen, loadCartCount]);

  const totalCartItems = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      ),
    [cartItems]
  );

  const safeOpenCart = useCallback(() => {
    const now = Date.now();
    if (now - lastClick < 300) return;

    lastClick = now;
    openCart();
  }, [openCart]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f7fb] text-[#111]">
      <div className="pointer-events-none absolute inset-0 hidden md:block md:bg-[radial-gradient(circle_at_10%_0%,rgba(168,85,247,0.12),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(14,165,233,0.09),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f7f7fb_45%,#f4f2fb_100%)]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 border-b border-black/5 bg-white/90 px-3 py-3 backdrop-blur-md md:bg-white/65 md:px-6 md:py-4 md:backdrop-blur-xl lg:px-8">
          <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[10px] font-black uppercase tracking-[0.22em] text-purple-700 sm:text-xs">
                Dashboard
              </p>

              <h1 className="mt-1 truncate text-lg font-black tracking-[-0.045em] text-black sm:text-2xl">
                Brand workspace
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <NotificationBell notifications={safeNotifications} />

              <button
                type="button"
                onClick={safeOpenCart}
                className="relative grid h-10 w-10 place-items-center rounded-2xl border border-black/5 bg-white text-black/75 shadow-sm transition active:scale-95 md:h-11 md:w-11 md:bg-white/80 md:hover:border-purple-500/20 md:hover:text-purple-700"
              >
                <ShoppingCart size={18} />

                {totalCartItems > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-[11px] font-black text-white">
                    {totalCartItems}
                  </span>
                )}
              </button>

              <SmartCreateButton />
            </div>
          </div>
        </header>

        <main className="flex-1 px-3 py-4 sm:px-5 md:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1500px] space-y-5 md:space-y-6">
            <section className="relative overflow-hidden rounded-[28px] border border-black/5 bg-white p-5 shadow-sm md:rounded-[36px] md:bg-white/80 md:p-8 md:shadow-[0_30px_120px_rgba(15,23,42,0.10)] md:backdrop-blur-xl lg:p-10">
              <div className="pointer-events-none absolute inset-0 hidden md:block md:bg-[radial-gradient(circle_at_18%_0%,rgba(168,85,247,0.18),transparent_34%),radial-gradient(circle_at_86%_8%,rgba(14,165,233,0.14),transparent_30%)]" />

              <div className="relative grid gap-7 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/15 bg-purple-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-purple-700 sm:px-4 sm:text-xs">
                    <Sparkles size={14} />
                    AI Brand Builder
                  </div>

                  <h2 className="max-w-4xl text-[2.45rem] font-black leading-[0.92] tracking-[-0.075em] text-black sm:text-6xl lg:text-7xl">
                    Create your brand
                    <span className="block bg-gradient-to-r from-purple-700 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent">
                      easily with AI.
                    </span>
                  </h2>

                  <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-black/50 sm:text-base">
                    Turn an idea into products, campaigns, and a store ready to
                    sell. Use Mynify AI to generate your brand direction,
                    product content, and launch assets faster.
                  </p>

                  <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3.5 text-sm font-black text-white shadow-sm transition active:scale-95 md:px-6 md:py-4 md:shadow-[0_20px_60px_rgba(0,0,0,0.18)] md:hover:scale-[1.03]"
                    >
                      <Wand2 size={18} />
                      Create with AI
                      <ArrowRight size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={goAdvertise}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/5 bg-white px-5 py-3.5 text-sm font-black text-black/75 shadow-sm transition active:scale-95 md:px-6 md:py-4 md:hover:border-purple-500/20 md:hover:bg-purple-500/10 md:hover:text-purple-700"
                    >
                      Promote brand
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -inset-6 hidden rounded-[40px] bg-gradient-to-br from-purple-500/15 via-fuchsia-500/10 to-cyan-500/15 blur-2xl md:block" />

                  <div className="relative overflow-hidden rounded-[28px] border border-black/5 bg-white p-4 shadow-sm md:rounded-[34px] md:bg-white/85 md:p-5 md:shadow-[0_30px_100px_rgba(15,23,42,0.12)] md:backdrop-blur-xl">
                    <div className="mb-4 flex items-center justify-between rounded-[24px] border border-black/5 bg-black/[0.025] p-4 md:rounded-[26px]">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-black/35">
                          Mynify AI
                        </p>
                        <p className="mt-1 text-2xl font-black tracking-[-0.045em] text-black">
                          Build. Launch. Sell.
                        </p>
                      </div>

                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/10 text-purple-700">
                        <Layers3 size={22} />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                      {HERO_FEATURES.map((item) => (
                        <div
                          key={item.title}
                          className="rounded-[22px] border border-black/5 bg-white p-4 shadow-sm md:rounded-[24px] md:bg-white/75"
                        >
                          <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-purple-500/10 text-purple-700">
                            <item.icon size={20} />
                          </div>

                          <p className="text-sm font-black text-black">
                            {item.title}
                          </p>

                          <p className="mt-2 text-xs font-semibold leading-5 text-black/45">
                            {item.desc}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-[24px] border border-purple-500/10 bg-gradient-to-r from-purple-600 to-cyan-500 p-5 text-white md:rounded-[26px]">
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-white/70">
                        Launch system
                      </p>

                      <p className="mt-2 text-sm font-semibold leading-6 text-white/75">
                        One dashboard to create your brand, prepare your
                        products, promote your store, and keep everything moving.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-black/5 bg-white p-4 shadow-sm md:rounded-[32px] md:bg-white/75 md:p-6 md:shadow-[0_25px_90px_rgba(15,23,42,0.08)] md:backdrop-blur-xl">
              <Section title="Hot new products">
                <ProductGrid products={safeProducts} isLoading={isLoading} />
              </Section>
            </section>
          </div>
        </main>
      </div>

      <CartDrawer open={cartOpen} onClose={closeCart} />
    </div>
  );
}
