"use client";

import Sidebar from "@/app/components/sidebar";
import NotificationBell from "@/app/components/NotificationBell";
import SmartCreateButton from "@/app/components/SmartCreateButton";

import { ShoppingCart, X } from "lucide-react";
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

  /* 🔐 SAFE DATA (anti-exploit crash) */
  const safeProducts = safeArray(products);
  const safeNotifications = safeArray(notifications);

  /* 🔐 SAFE WRAPPERS (anti spam / abuse click) */
  const safeOpenCart = () => {
    const now = Date.now();
    if (now - lastClick < 300) return;
    lastClick = now;
    openCart();
  };

  return (
    <div className="min-h-screen bg-[#f6f6f4] text-gray-900 flex overflow-x-hidden">

      <Sidebar />

      <div className="flex-1 md:pl-[280px]">
        <div className="w-full px-2 md:px-5">

          {/* HEADER */}
          <header className="h-16 flex items-center justify-between border-b border-black/5">

            <h1 className="text-base font-semibold tracking-tight" />

            <div className="flex items-center gap-3">

              <NotificationBell notifications={safeNotifications} />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={safeOpenCart}
                className="w-10 h-10 flex items-center justify-center rounded-full border bg-white"
              >
                <ShoppingCart size={18} />
              </motion.button>

              <SmartCreateButton />

            </div>

          </header>

          {/* MAIN */}
          <main className="py-6 space-y-10">

            <Section title="Hot new products">
              <ProductGrid
                products={safeProducts}
                isLoading={isLoading}
              />
            </Section>

            <HeroSection onClick={goAdvertise} />

          </main>

        </div>
      </div>

      <CartDrawer open={cartOpen} onClose={closeCart} />

    </div>
  );
}