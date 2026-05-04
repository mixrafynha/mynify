"use client";

import { useState, useCallback, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";

export default function SmartCreateButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);

  const ref = useRef<HTMLDivElement | null>(null);

  const isProUser = false;
  const canCreate = true;

  const goCreate = useCallback(() => {
    if (!canCreate) {
      router.push("/pricing");
      return;
    }
    router.push("/dashboard/create");
  }, [router, canCreate]);

  // 🔥 AUTO DETECTA SE ESTÁ PERTO DA BORDA DIREITA
  useLayoutEffect(() => {
    if (!open || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const spaceRight = window.innerWidth - rect.left;

    setAlignRight(spaceRight < 280); // largura do dropdown
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex">
      {/* ================= BUTTON ================= */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={goCreate}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="
          flex items-center gap-1.5
          bg-black text-white
          px-3 sm:px-3.5
          h-9 sm:h-10
          rounded-full
          text-xs sm:text-sm
          font-medium
          shadow-sm
          hover:shadow-md
          transition
          whitespace-nowrap
        "
      >
        <Plus size={14} />

        <span className="hidden sm:inline">Create</span>
        <span className="sm:hidden">New</span>

        <span className="ml-1 text-[10px] bg-white/15 px-2 py-[1px] rounded-full">
          {isProUser ? "PRO" : "FREE"}
        </span>
      </motion.button>

      {/* ================= DROPDOWN ================= */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            className={`
              absolute top-12
              w-56 sm:w-64
              bg-white border border-gray-100
              shadow-xl rounded-xl
              p-3 text-xs z-50

              ${alignRight ? "right-0" : "left-0"}
            `}
          >
            <div className="flex items-center gap-2 font-semibold mb-2">
              <Sparkles size={14} />
              Smart Creation
            </div>

            <p className="text-gray-600 leading-snug">
              Create and publish products instantly with SaaS-ready AI structure.
            </p>

            <div className="mt-3 space-y-1 text-gray-700">
              <p>⚡ Instant publish</p>
              <p>💰 Monetization ready</p>
              <p>🔐 Secure access control</p>
            </div>

            <button
              onClick={goCreate}
              className="
                mt-3 w-full
                bg-black text-white
                h-8 rounded-lg
                text-xs
                hover:bg-black/90
                transition
              "
            >
              Start creating
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}