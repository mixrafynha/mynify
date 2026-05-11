"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

const safeArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? v : []);

export default function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/cart", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Error loading cart");

      setItems(safeArray<CartItem>(data?.items));
    } catch (error) {
      console.error("Erro ao carregar carrinho:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadCart();
  }, [open, loadCart]);

  const updateQuantity = useCallback(
    async (id: string, quantity: number) => {
      if (quantity < 1 || updatingId) return;

      setUpdatingId(id);

      const oldItems = items;

      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item))
      );

      try {
        const res = await fetch("/api/cart/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, quantity }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data?.error || "Error updating cart");
      } catch (error) {
        console.error("Erro ao atualizar quantidade:", error);
        setItems(oldItems);
      } finally {
        setUpdatingId(null);
      }
    },
    [items, updatingId]
  );

  const removeItem = useCallback(
    async (id: string) => {
      if (updatingId) return;

      setUpdatingId(id);

      const oldItems = items;

      setItems((prev) => prev.filter((item) => item.id !== id));

      try {
        const res = await fetch("/api/cart/remove", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data?.error || "Error removing item");
      } catch (error) {
        console.error("Erro ao remover item:", error);
        setItems(oldItems);
      } finally {
        setUpdatingId(null);
      }
    },
    [items, updatingId]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0),
    [items]
  );

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity), 0),
    [items]
  );

  const handleCheckout = useCallback(() => {
    if (!items.length) return;

    onClose();
    router.push("/stepcategory");
  }, [items.length, onClose, router]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            aria-label="Close cart overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
            className="
              fixed right-0 top-0 z-50 flex h-dvh w-full flex-col overflow-hidden
              border-l border-white/10 bg-[#0b0b14]/95 text-white shadow-[0_0_80px_rgba(168,85,247,0.22)]
              backdrop-blur-2xl sm:w-[390px] md:w-[430px]
            "
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.22),transparent_34%),radial-gradient(circle_at_95%_18%,rgba(14,165,233,0.16),transparent_30%)]" />

            <header className="relative flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 shadow-[0_0_26px_rgba(168,85,247,0.45)]">
                  <ShoppingBag size={18} />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-purple-200/75">
                    Mynify cart
                  </p>

                  <h2 className="text-lg font-black tracking-[-0.04em]">
                    Your Cart
                  </h2>
                </div>

                {totalItems > 0 && (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white/10 px-2 text-xs font-black text-white">
                    {totalItems}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/75 transition hover:border-purple-400/40 hover:bg-white/[0.10] hover:text-white active:scale-95"
              >
                <X size={17} />
              </button>
            </header>

            <div className="relative flex-1 overflow-y-auto px-4 py-4">
              {loading ? (
                <div className="grid h-full place-items-center text-sm font-semibold text-white/55">
                  Loading cart...
                </div>
              ) : items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-5 grid h-20 w-20 place-items-center rounded-[28px] bg-white/[0.05] text-purple-300 shadow-[0_0_35px_rgba(168,85,247,0.18)]">
                    <ShoppingBag size={34} />
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
                    className="mt-6 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-3 text-sm font-black text-white shadow-[0_0_25px_rgba(168,85,247,0.35)] transition hover:scale-[1.02] active:scale-95"
                  >
                    Continue shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => {
                    const itemLoading = updatingId === item.id;
                    const quantity = Number(item.quantity);
                    const price = Number(item.price);
                    const total = price * quantity;

                    return (
                      <article
                        key={item.id}
                        className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.045] p-3 shadow-[0_0_30px_rgba(168,85,247,0.06)] transition hover:bg-white/[0.065]"
                      >
                        {itemLoading && (
                          <div className="absolute inset-0 z-20 grid place-items-center bg-[#0b0b14]/55 backdrop-blur-sm">
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-purple-300" />
                          </div>
                        )}

                        <div className="flex gap-3">
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06]">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.title}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-purple-300">
                                <ShoppingBag size={24} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="line-clamp-2 text-sm font-black leading-5 text-white">
                                  {item.title}
                                </p>

                                <p className="mt-1 text-xs font-black text-purple-200">
                                  ${price.toFixed(2)}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                disabled={itemLoading}
                                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white/45 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>

                            {(item.color || item.size || typeof item.stock === "number") && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {item.color && (
                                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] font-bold text-white/60">
                                    Color: {item.color}
                                  </span>
                                )}

                                {item.size && (
                                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] font-bold text-white/60">
                                    Size: {item.size}
                                  </span>
                                )}

                                {typeof item.stock === "number" && (
                                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] font-bold text-white/60">
                                    Stock: {item.stock}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="flex items-center rounded-2xl border border-white/10 bg-[#131320] p-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, quantity - 1)}
                              disabled={quantity <= 1 || itemLoading}
                              className="grid h-8 w-8 place-items-center rounded-xl text-white/75 transition hover:bg-white/10 disabled:opacity-35"
                            >
                              <Minus size={13} />
                            </button>

                            <span className="min-w-8 text-center text-sm font-black">
                              {quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, quantity + 1)}
                              disabled={
                                itemLoading ||
                                (typeof item.stock === "number" && quantity >= item.stock)
                              }
                              className="grid h-8 w-8 place-items-center rounded-xl text-white/75 transition hover:bg-white/10 disabled:opacity-35"
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          <p className="text-base font-black tracking-[-0.03em]">
                            ${total.toFixed(2)}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            <footer className="relative border-t border-white/10 bg-[#0b0b14]/80 px-4 py-4 backdrop-blur-xl">
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-white/55">Items</span>
                  <span className="font-black text-white">{totalItems}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/55">
                    Subtotal
                  </span>
                  <span className="text-2xl font-black tracking-[-0.05em] text-white">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={!items.length}
                onClick={handleCheckout}
                className="
                  flex h-12 w-full items-center justify-center gap-2 rounded-2xl
                  bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500
                  text-sm font-black text-white
                  shadow-[0_0_35px_rgba(168,85,247,0.42)]
                  transition hover:scale-[1.01] active:scale-[0.98]
                  disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100
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
