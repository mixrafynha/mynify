"use client";

import { useEffect, useMemo, useState } from "react";

import Sidebar from "@/app/components/sidebar";
import NotificationBell from "@/app/components/NotificationBell";
import SmartCreateButton from "@/app/components/SmartCreateButton";

import { ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";

import { useDashboard } from "@/hooks/useDashboard";

import Section from "@/app/components/ui/Section";
import CartDrawer from "@/app/components/ui/CartDrawer";
import ProductGrid from "@/app/components/products/ProductGrid";
import HeroSection from "@/app/components/hero/HeroSection";

/* ================= SAFE HELPERS ================= */
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

  /* 🔐 SAFE DATA (anti-exploit crash) */
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
                className="relative w-10 h-10 flex items-center justify-center rounded-full border bg-white"
              >
                <ShoppingCart size={18} />

                {totalCartItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-black text-white text-[11px] flex items-center justify-center font-medium">
                    {totalCartItems}
                  </span>
                )}
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
