"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type CartItem = {
  id: string;
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  variant_id?: string | null;
  color?: string | null;
  size?: string | null;
  image?: string | null;
  stock?: number | null;
};

const safeArray = <T,>(value: unknown): T[] =>
  Array.isArray(value) ? value : [];

const money = (value: number) => `$${value.toFixed(2)}`;

export default function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { subtotal, totalItems } = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const qty = Math.max(0, Number(item.quantity) || 0);
        const price = Math.max(0, Number(item.price) || 0);

        acc.totalItems += qty;
        acc.subtotal += price * qty;

        return acc;
      },
      { subtotal: 0, totalItems: 0 }
    );
  }, [items]);

  const loadCart = useCallback(async () => {
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    try {
      const res = await fetch("/api/cart", {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.error || "Error loading cart");

      setItems(safeArray<CartItem>(data?.items));
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Erro ao carregar carrinho:", error);
        setItems([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    loadCart();

    return () => {
      abortRef.current?.abort();
    };
  }, [open, loadCart]);

  const updateQuantity = useCallback(
    async (id: string, quantity: number) => {
      if (quantity < 1 || updatingId) return;

      let oldItems: CartItem[] = [];

      setUpdatingId(id);
      setItems((prev) => {
        oldItems = prev;
        return prev.map((item) =>
          item.id === id ? { ...item, quantity } : item
        );
      });

      try {
        const res = await fetch("/api/cart/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, quantity }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) throw new Error(data?.error || "Error updating cart");
      } catch (error) {
        console.error("Erro ao atualizar quantidade:", error);
        setItems(oldItems);
      } finally {
        setUpdatingId(null);
      }
    },
    [updatingId]
  );

  const removeItem = useCallback(
    async (id: string) => {
      if (updatingId) return;

      let oldItems: CartItem[] = [];

      setUpdatingId(id);
      setItems((prev) => {
        oldItems = prev;
        return prev.filter((item) => item.id !== id);
      });

      try {
        const res = await fetch("/api/cart/remove", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) throw new Error(data?.error || "Error removing item");
      } catch (error) {
        console.error("Erro ao remover item:", error);
        setItems(oldItems);
      } finally {
        setUpdatingId(null);
      }
    },
    [updatingId]
  );

  const handleCheckout = useCallback(() => {
    if (!items.length) return;

    onClose();
    router.push("/stepcategory");
  }, [items.length, onClose, router]);

  return (
    <AnimatePresence mode="wait">
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close cart overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 sm:backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
            className="
              fixed right-0 top-0 z-50 flex h-dvh w-full flex-col overflow-hidden
              border-l border-white/10 bg-[#0b0b14] text-white
              shadow-2xl will-change-transform sm:w-[390px] md:w-[430px]
            "
          >
            <header className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-purple-600">
                  <ShoppingBag size={17} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-[10px] font-black uppercase tracking-[0.22em] text-purple-200/70">
                    Mynify cart
                  </p>

                  <h2 className="truncate text-lg font-black tracking-[-0.04em]">
                    Your Cart
                  </h2>
                </div>

                {totalItems > 0 && (
                  <span className="grid h-6 min-w-6 place-items-center rounded-full bg-white/10 px-2 text-xs font-black">
                    {totalItems}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close cart"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/[0.06] text-white/75 active:scale-95"
              >
                <X size={17} />
              </button>
            </header>

            <main className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
              {loading ? (
                <div className="grid h-full place-items-center text-sm font-semibold text-white/55">
                  Loading cart...
                </div>
              ) : items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <div className="mb-5 grid h-18 w-18 place-items-center rounded-[26px] bg-white/[0.06] text-purple-300">
                    <ShoppingBag size={32} />
                  </div>

                  <p className="text-xl font-black tracking-[-0.04em]">
                    Your cart is empty
                  </p>

                  <span className="mt-2 max-w-[240px] text-sm font-medium leading-6 text-white/50">
                    Add products to continue your custom brand order.
                  </span>

                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-6 rounded-2xl bg-purple-600 px-5 py-3 text-sm font-black text-white active:scale-95"
                  >
                    Continue shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => {
                    const itemLoading = updatingId === item.id;
                    const quantity = Math.max(1, Number(item.quantity) || 1);
                    const price = Math.max(0, Number(item.price) || 0);
                    const total = price * quantity;
                    const maxStock =
                      typeof item.stock === "number" ? item.stock : Infinity;

                    return (
                      <article
                        key={item.id}
                        className="relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.045] p-3"
                      >
                        {itemLoading && (
                          <div className="absolute inset-0 z-20 grid place-items-center bg-[#0b0b14]/60">
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-purple-300" />
                          </div>
                        )}

                        <div className="flex gap-3">
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white/[0.06]">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.title}
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-purple-300">
                                <ShoppingBag size={23} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="line-clamp-2 text-sm font-black leading-5">
                                  {item.title}
                                </p>

                                <p className="mt-1 text-xs font-black text-purple-200">
                                  {money(price)}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                disabled={itemLoading || !!updatingId}
                                aria-label="Remove item"
                                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white/45 active:scale-95 disabled:opacity-35"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>

                            {(item.color || item.size) && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {item.color && (
                                  <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] font-bold text-white/60">
                                    {item.color}
                                  </span>
                                )}

                                {item.size && (
                                  <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] font-bold text-white/60">
                                    {item.size}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="flex items-center rounded-2xl bg-[#131320] p-1">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.id, quantity - 1)
                              }
                              disabled={
                                quantity <= 1 || itemLoading || !!updatingId
                              }
                              aria-label="Decrease quantity"
                              className="grid h-8 w-8 place-items-center rounded-xl text-white/75 active:scale-95 disabled:opacity-35"
                            >
                              <Minus size={13} />
                            </button>

                            <span className="min-w-8 text-center text-sm font-black">
                              {quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.id, quantity + 1)
                              }
                              disabled={
                                itemLoading ||
                                !!updatingId ||
                                quantity >= maxStock
                              }
                              aria-label="Increase quantity"
                              className="grid h-8 w-8 place-items-center rounded-xl text-white/75 active:scale-95 disabled:opacity-35"
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          <p className="text-base font-black tracking-[-0.03em]">
                            {money(total)}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </main>

            <footer className="border-t border-white/10 bg-[#0b0b14] px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-white/55">Items</span>
                  <span className="font-black">{totalItems}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/55">
                    Subtotal
                  </span>

                  <span className="text-2xl font-black tracking-[-0.05em]">
                    {money(subtotal)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={!items.length}
                onClick={handleCheckout}
                className="
                  flex h-12 w-full items-center justify-center gap-2 rounded-2xl
                  bg-purple-600 text-sm font-black text-white
                  active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40
                "
              >
                Checkout {totalItems > 0 ? `(${totalItems})` : ""}
                <ArrowRight size={16} />
              </button>

              <p className="mt-3 text-center text-[11px] font-medium text-white/38">
                Secure checkout • Fast custom production
              </p>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
