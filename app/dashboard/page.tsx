"use client";

import Sidebar from "@/app/components/sidebar";
import NotificationBell from "@/app/components/NotificationBell";
import SmartCreateButton from "@/app/components/SmartCreateButton";

import { ShoppingCart, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

import { useDashboard } from "@/hooks/useDashboard";

import Section from "@/app/components/ui/Section";
import CartDrawer from "@/app/components/ui/CartDrawer";
import ProductGrid from "@/app/components/products/ProductGrid";
import HeroSection from "@/app/components/hero/HeroSection";

/* ================= SAFE HELPERS ================= */

const safeArray = (v: any) => (Array.isArray(v) ? v : []);

let lastClick = 0;

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

  const safeProducts = safeArray(products);
  const safeNotifications = safeArray(notifications);

  const safeOpenCart = () => {
    const now = Date.now();
    if (now - lastClick < 300) return;
    lastClick = now;
    openCart();
  };

  return (
    <div className="relative flex min-h-screen overflow-x-hidden bg-[#03030a] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_18%_12%,rgba(168,85,247,0.18),transparent_24%),radial-gradient(circle_at_82%_8%,rgba(14,165,233,0.14),transparent_22%),radial-gradient(circle_at_55%_90%,rgba(217,70,239,0.10),transparent_30%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(180deg,rgba(3,3,10,0.2)_0%,#03030a_100%)]" />

      <Sidebar />

      <div className="relative z-10 flex-1 md:pl-[280px]">
        <div className="w-full px-3 md:px-6 lg:px-8">
          <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/10 bg-[#03030a]/75 backdrop-blur-2xl">
            <div>
              <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-purple-300 shadow-[0_0_18px_rgba(168,85,247,0.18)]">
                <Sparkles size={12} />
                Dashboard
              </div>

              <h1 className="text-xl font-black uppercase tracking-tight md:text-2xl">
                Welcome back
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell notifications={safeNotifications} />

              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                onClick={safeOpenCart}
                className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-white/80 shadow-[0_0_25px_rgba(168,85,247,0.08)] transition hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-purple-300"
              >
                <ShoppingCart size={18} />
                {safeProducts.length > 0 && (
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-fuchsia-500 shadow-[0_0_14px_rgba(217,70,239,0.8)]" />
                )}
              </motion.button>

              <SmartCreateButton />
            </div>
          </header>

          <main className="space-y-8 py-8">
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_0_35px_rgba(168,85,247,0.07)] backdrop-blur-xl">
                <p className="text-xs font-black uppercase tracking-widest text-white/40">
                  Products
                </p>
                <p className="mt-2 text-3xl font-black">{safeProducts.length}</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_0_35px_rgba(168,85,247,0.07)] backdrop-blur-xl">
                <p className="text-xs font-black uppercase tracking-widest text-white/40">
                  Notifications
                </p>
                <p className="mt-2 text-3xl font-black">
                  {safeNotifications.length}
                </p>
              </div>

              <div className="rounded-3xl border border-purple-500/25 bg-gradient-to-br from-purple-500/15 to-fuchsia-500/5 p-5 shadow-[0_0_35px_rgba(168,85,247,0.12)] backdrop-blur-xl">
                <div className="flex items-center gap-2 text-purple-300">
                  <TrendingUp size={18} />
                  <p className="text-xs font-black uppercase tracking-widest">
                    Growth mode
                  </p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  Promote your products and scale your store faster.
                </p>
              </div>
            </section>

            <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.035] shadow-[0_0_50px_rgba(168,85,247,0.1)] backdrop-blur-xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_28%)]" />
              <div className="relative">
                <HeroSection onClick={goAdvertise} />
              </div>
            </section>

            <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.035] p-4 shadow-[0_0_50px_rgba(168,85,247,0.08)] backdrop-blur-xl md:p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(168,85,247,0.12),transparent_25%)]" />

              <div className="relative">
                <Section title="Hot new products">
                  <ProductGrid products={safeProducts} isLoading={isLoading} />
                </Section>
              </div>
            </section>
          </main>
        </div>
      </div>

      <CartDrawer open={cartOpen} onClose={closeCart} />
    </div>
  );
}
