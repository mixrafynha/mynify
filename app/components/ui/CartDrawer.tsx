"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Trash2, Minus, Plus, ShoppingCart } from "lucide-react";
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

export default function CartDrawer({
  open,
  onClose,
  onOpen,
}: {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
}) {
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadCart = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/cart", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Error loading cart");
      }

      setItems(data?.items || []);
    } catch (error) {
      console.error("Erro ao carregar carrinho:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    if (open) loadCart();
  }, [open]);

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1 || updatingId) return;

    setUpdatingId(id);

    const oldItems = items;

    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );

    try {
      const response = await fetch("/api/cart/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          quantity: newQuantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Error updating cart");
      }
    } catch (error) {
      console.error("Erro ao atualizar quantidade:", error);
      setItems(oldItems);
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (id: string) => {
    if (updatingId) return;

    setUpdatingId(id);

    const oldItems = items;

    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      const response = await fetch("/api/cart/remove", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Error removing item");
      }
    } catch (error) {
      console.error("Erro ao remover item:", error);
      setItems(oldItems);
    } finally {
      setUpdatingId(null);
    }
  };

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0
      ),
    [items]
  );

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity), 0),
    [items]
  );

  const handleCheckout = () => {
    if (items.length === 0) return;

    onClose();
    router.push("/stepcategory");
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={onOpen}
          className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
        >
          <ShoppingCart size={22} />

          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-black text-white text-[11px] flex items-center justify-center font-medium">
              {totalItems}
            </span>
          )}
        </button>
      )}

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            <motion.div
              initial={{ x: 120 }}
              animate={{ x: 0 }}
              exit={{ x: 120 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="
                fixed right-0 top-0 z-50
                h-full w-[300px] sm:w-[340px] md:w-[380px]
                bg-white shadow-2xl
                flex flex-col
                border-l border-black/10
              "
            >
              <div className="p-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-sm md:text-base">
                    Your Cart
                  </h2>

                  {totalItems > 0 && (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-black text-white text-[11px] flex items-center justify-center font-medium">
                      {totalItems}
                    </span>
                  )}
                </div>

                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 p-3 overflow-y-auto">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-sm text-gray-500">
                    Loading cart...
                  </div>
                ) : items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <p className="text-sm text-gray-500">Your cart is empty</p>
                    <span className="text-xs text-gray-400 mt-1">
                      Add products to continue
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => {
                      const itemLoading = updatingId === item.id;
                      const itemQuantity = Number(item.quantity);

                      return (
                        <div
                          key={item.id}
                          className="border-b pb-3 flex flex-col gap-2"
                        >
                          <div className="flex justify-between gap-3">
                            <div className="flex gap-3">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                                />
                              )}

                              <div>
                                <p className="text-sm font-medium">
                                  {item.title}
                                </p>

                                <div className="text-xs text-gray-500 space-y-0.5">
                                  <p>${Number(item.price).toFixed(2)}</p>

                                  {(item.color || item.size) && (
                                    <p>
                                      {item.color && `Color: ${item.color}`}
                                      {item.color && item.size && " · "}
                                      {item.size && `Size: ${item.size}`}
                                    </p>
                                  )}

                                  {typeof item.stock === "number" && (
                                    <p>Stock: {item.stock}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              disabled={itemLoading}
                              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center disabled:opacity-40"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item.id, itemQuantity - 1)
                                }
                                disabled={itemQuantity <= 1 || itemLoading}
                                className="w-7 h-7 rounded-full border flex items-center justify-center disabled:opacity-40"
                              >
                                <Minus size={13} />
                              </button>

                              <span className="text-sm min-w-5 text-center">
                                {itemQuantity}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item.id, itemQuantity + 1)
                                }
                                disabled={
                                  itemLoading ||
                                  (typeof item.stock === "number" &&
                                    itemQuantity >= item.stock)
                                }
                                className="w-7 h-7 rounded-full border flex items-center justify-center disabled:opacity-40"
                              >
                                <Plus size={13} />
                              </button>
                            </div>

                            <p className="text-sm font-semibold">
                              ${(Number(item.price) * itemQuantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-3 border-t space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>

                <button
                  type="button"
                  disabled={items.length === 0}
                  onClick={handleCheckout}
                  className="
                    w-full h-10 rounded-full
                    bg-black text-white text-sm
                    disabled:opacity-40 disabled:cursor-not-allowed
                  "
                >
                  Checkout {totalItems > 0 ? `(${totalItems})` : ""}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
