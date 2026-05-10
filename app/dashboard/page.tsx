"use client";

import { useEffect, useMemo, useState } from "react";

import NotificationBell from "@/app/components/NotificationBell";
import SmartCreateButton from "@/app/components/SmartCreateButton";

import {
  ShoppingCart,
  Sparkles,
  Wand2,
  Store,
  PackageCheck,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

import { useDashboard } from "@/hooks/useDashboard";

import Section from "@/app/components/ui/Section";
import CartDrawer from "@/app/components/ui/CartDrawer";
import ProductGrid from "@/app/components/products/ProductGrid";

const safeArray = (v: any) => (Array.isArray(v) ? v : []);

let lastClick = 0;

type CartItem = {
  quantity: number;
};

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

  const safeProducts = safeArray(products);
  const safeNotifications = safeArray(notifications);

  const loadCartCount = async () => {
    try {
      const response = await fetch("/api/cart", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();
      if (!response.ok) return;

      setCartItems(safeArray(data?.items));
    } catch (error) {
      console.error("Erro ao carregar contador do carrinho:", error);
      setCartItems([]);
    }
  };

  useEffect(() => {
    loadCartCount();
  }, []);

  useEffect(() => {
    if (!cartOpen) loadCartCount();
  }, [cartOpen]);

  const totalCartItems = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      ),
    [cartItems]
  );

  const safeOpenCart = () => {
    const now = Date.now();
    if (now - lastClick < 300) return;
    lastClick = now;
    openCart();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f7fb] text-[#111]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(168,85,247,0.13),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(14,165,233,0.10),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f7f7fb_45%,#f4f2fb_100%)]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 border-b border-black/5 bg-white/60 px-4 py-4 backdrop-blur-2xl sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-purple-700">
                Dashboard
              </p>
              <h1 className="mt-1 text-xl font-black tracking-[-0.045em] text-black sm:text-2xl">
                Brand workspace
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell notifications={safeNotifications} />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={safeOpenCart}
                className="relative grid h-11 w-11 place-items-center rounded-2xl border border-black/5 bg-white/80 text-black/75 shadow-sm backdrop-blur-xl transition hover:border-purple-500/20 hover:text-purple-700"
              >
                <ShoppingCart size={18} />

                {totalCartItems > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-[11px] font-black text-white">
                    {totalCartItems}
                  </span>
                )}
              </motion.button>

              <SmartCreateButton />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1500px] space-y-6">
            <section className="relative overflow-hidden rounded-[36px] border border-black/5 bg-white/80 p-6 shadow-[0_30px_120px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-8 lg:p-10">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(168,85,247,0.18),transparent_34%),radial-gradient(circle_at_82%_10%,rgba(14,165,233,0.14),transparent_30%)]" />

              <div className="relative grid gap-10 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
                <div>
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-500/15 bg-purple-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-purple-700">
                    <Sparkles size={14} />
                    AI Brand Builder
                  </div>

                  <h2 className="max-w-4xl text-4xl font-black tracking-[-0.07em] text-black sm:text-5xl lg:text-6xl">
                    Cria a tua marca
                    <span className="block bg-gradient-to-r from-purple-700 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent">
                      fácil com AI.
                    </span>
                  </h2>

                  <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-black/50 sm:text-base">
                    Transforma ideias em produtos, campanhas e uma loja pronta
                    para vender. Usa AI para acelerar nomes, descrições,
                    produtos e conteúdo para a tua marca.
                  </p>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black px-6 py-4 text-sm font-black text-white shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition hover:scale-[1.03] active:scale-95"
                    >
                      <Wand2 size={18} />
                      Criar com AI
                      <ArrowRight size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={goAdvertise}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/5 bg-white/80 px-6 py-4 text-sm font-black text-black/75 shadow-sm transition hover:border-purple-500/20 hover:bg-purple-500/10 hover:text-purple-700"
                    >
                      Promover marca
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-purple-500/15 via-fuchsia-500/10 to-cyan-500/15 blur-2xl" />

                  <div className="relative overflow-hidden rounded-[34px] border border-black/5 bg-white/85 p-5 shadow-[0_30px_100px_rgba(15,23,42,0.12)] backdrop-blur-2xl">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[26px] border border-black/5 bg-black/[0.025] p-5">
                        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/10 text-purple-700">
                          <Store size={22} />
                        </div>
                        <p className="text-lg font-black text-black">
                          Brand setup
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-black/45">
                          Nome, nicho, estilo e identidade gerados com AI.
                        </p>
                      </div>

                      <div className="rounded-[26px] border border-black/5 bg-black/[0.025] p-5">
                        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-700">
                          <PackageCheck size={22} />
                        </div>
                        <p className="text-lg font-black text-black">
                          Products ready
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-black/45">
                          Produtos preparados para vender e promover.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[28px] border border-purple-500/10 bg-gradient-to-r from-purple-600 to-cyan-500 p-5 text-white">
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-white/70">
                        Mynify AI
                      </p>
                      <p className="mt-2 text-2xl font-black tracking-[-0.045em]">
                        Build. Launch. Sell.
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                        Tudo num dashboard simples para criar e controlar a tua
                        marca.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[28px] border border-black/5 bg-white/75 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.07)] backdrop-blur-2xl">
                <p className="text-2xl font-black text-black">
                  {safeProducts.length}
                </p>
                <p className="mt-1 text-[11px] font-black uppercase tracking-widest text-black/35">
                  Products
                </p>
              </div>

              <div className="rounded-[28px] border border-black/5 bg-white/75 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.07)] backdrop-blur-2xl">
                <p className="text-2xl font-black text-black">
                  {totalCartItems}
                </p>
                <p className="mt-1 text-[11px] font-black uppercase tracking-widest text-black/35">
                  Cart items
                </p>
              </div>

              <div className="rounded-[28px] border border-black/5 bg-white/75 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.07)] backdrop-blur-2xl">
                <p className="text-2xl font-black text-black">
                  {safeNotifications.length}
                </p>
                <p className="mt-1 text-[11px] font-black uppercase tracking-widest text-black/35">
                  Notifications
                </p>
              </div>
            </section>

            <section className="rounded-[32px] border border-black/5 bg-white/75 p-5 shadow-[0_25px_90px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-6">
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
