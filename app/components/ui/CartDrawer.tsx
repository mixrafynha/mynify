"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* DRAWER */}
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

            {/* HEADER */}
            <div className="p-3 border-b flex items-center justify-between">
              <h2 className="font-semibold text-sm md:text-base">
                Your Cart
              </h2>

              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* CONTENT */}
            <div className="flex-1 p-3 flex flex-col items-center justify-center text-center">
              <p className="text-sm text-gray-500">
                Your cart is empty
              </p>

              <span className="text-xs text-gray-400 mt-1">
                Add products to continue
              </span>
            </div>

            {/* FOOTER */}
            <div className="p-3 border-t">
              <button
                disabled
                className="
                  w-full h-10 rounded-full
                  bg-black text-white text-sm
                  opacity-40 cursor-not-allowed
                "
              >
                Checkout
              </button>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}