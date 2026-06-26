"use client";

import { memo, useCallback, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";

const DROPDOWN_WIDTH = 256;
const ITEMS = ["⚡ Instant publish", "💰 Monetization ready", "🔐 Secure access"];

function SmartCreateButton() {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);

  const isProUser = false;
  const canCreate = true;
  const planLabel = isProUser ? "PRO" : "FREE";

  const goCreate = useCallback(() => {
    router.push(canCreate ? "/dashboard/create" : "/pricing");
  }, [router, canCreate]);

  useLayoutEffect(() => {
    if (!open || !ref.current) return;

    const { left } = ref.current.getBoundingClientRect();
    setAlignRight(window.innerWidth - left < DROPDOWN_WIDTH);
  }, [open]);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="relative inline-flex"
    >
      <motion.button
        type="button"
        aria-label="Create"
        onClick={goCreate}
        whileHover={{ scale: 1.035 }}
        whileTap={{ scale: 0.965 }}
        className="group relative flex h-11 w-11 select-none items-center justify-center overflow-hidden rounded-full border border-purple-400/40 bg-[#070711] shadow-[0_0_24px_rgba(168,85,247,0.28)] transition-all duration-300 hover:border-fuchsia-400/70 hover:shadow-[0_0_36px_rgba(168,85,247,0.55)] sm:w-auto sm:px-4"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 opacity-[0.94]" />
        <span className="absolute inset-[1px] rounded-full bg-[#070711]/65 backdrop-blur-xl" />
        <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.16),transparent_65%)]" />

        <span className="relative z-10 flex flex-col items-center justify-center leading-none sm:flex-row sm:gap-2">
          <span className="flex items-center justify-center rounded-full bg-white/14 p-[4px] shadow-[0_0_12px_rgba(255,255,255,0.12)]">
            <Plus
              size={16}
              strokeWidth={2.8}
              className="text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.35)]"
            />
          </span>

          <span className="mt-[2px] text-[7px] font-black tracking-[0.18em] text-white opacity-95 sm:hidden">
            {planLabel}
          </span>

          <span className="hidden text-sm font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.16)] sm:inline-block">
            Create
          </span>
        </span>

        <span className="relative z-10 hidden rounded-full border border-white/10 bg-white/10 px-2 py-[3px] text-[9px] font-black tracking-[0.12em] text-white shadow-inner sm:inline-flex">
          {planLabel}
        </span>
      </motion.button>

      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.985 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute top-14 z-50 w-64 overflow-hidden rounded-2xl border border-purple-400/20 bg-[#070711]/95 p-3 text-white shadow-[0_0_45px_rgba(168,85,247,0.22)] backdrop-blur-2xl ${
              alignRight ? "right-0" : "left-0"
            }`}
          >
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.22),transparent_34%),radial-gradient(circle_at_90%_30%,rgba(14,165,233,0.14),transparent_32%)]" />

            <div className="relative mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 shadow-[0_0_18px_rgba(168,85,247,0.5)]">
                <Sparkles size={13} className="text-white" />
              </span>

              <div>
                <p className="text-xs font-black text-white">
                  Smart Creation
                </p>
                <p className="text-[10px] font-medium text-purple-200/80">
                  AI-powered workflow
                </p>
              </div>
            </div>

            <p className="relative text-xs leading-relaxed text-white/70">
              Create products instantly with optimized AI structure,
              monetization and automated publishing.
            </p>

            <div className="relative mt-3 space-y-1.5">
              {ITEMS.map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-white/10 bg-white/[0.045] px-2 py-1.5 text-[11px] font-medium text-white/80"
                >
                  {item}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={goCreate}
              className="relative mt-3 flex h-9 w-full items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 text-xs font-black text-white shadow-[0_0_22px_rgba(168,85,247,0.38)] transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(168,85,247,0.58)] active:scale-[0.99]"
            >
              Start creating
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(SmartCreateButton);
