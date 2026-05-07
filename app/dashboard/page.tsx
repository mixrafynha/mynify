"use client";

import Sidebar from "@/app/components/sidebar";
import NotificationBell from "@/app/components/NotificationBell";
import SmartCreateButton from "@/app/components/SmartCreateButton";

import { ShoppingCart, Sparkles } from "lucide-react";
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
    <div className="flex min-h-screen overflow-x-hidden bg-[#03030a] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.12),transparent_25%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.10),transparent_22%),radial-gradient(circle_at_50%_80%,rgba(168,85,247,0.08),transparent_28%)]" />

      <Sidebar />

      <div className="relative z-10 flex-1 md:pl-[280px]">
        <div className="w-full px-3 md:px-6">
          <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/10 bg-[#03030a]/70 backdrop-blur-xl">
            <div>
              <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-purple-300 shadow-[0_0_18px_rgba(168,85,247,0.18)]">
                <Sparkles size={12} />
                Dashboard
              </div>

              <h1 className="text-xl font-black uppercase tracking-tight text-white md:text-2xl">
                Welcome back
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell notifications={safeNotifications} />

              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                onClick={safeOpenCart}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/80 shadow-[0_0_25px_rgba(168,85,247,0.08)] transition hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-purple-300"
              >
                <ShoppingCart size={18} />
              </motion.button>

              <SmartCreateButton />
            </div>
          </header>

          <main className="space-y-10 py-8">
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] shadow-[0_0_40px_rgba(168,85,247,0.08)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_28%)]" />

              <div className="relative">
                <HeroSection onClick={goAdvertise} />
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-4 shadow-[0_0_40px_rgba(168,85,247,0.08)] md:p-6">
              <Section title="Hot new products">
                <ProductGrid products={safeProducts} isLoading={isLoading} />
              </Section>
            </div>
          </main>
        </div>
      </div>

      <CartDrawer open={cartOpen} onClose={closeCart} />
    </div>
  );
}
