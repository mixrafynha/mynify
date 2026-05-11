"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import NotificationBell from "@/app/components/NotificationBell";
import SmartCreateButton from "@/app/components/SmartCreateButton";
import Section from "@/app/components/ui/Section";
import CartDrawer from "@/app/components/ui/CartDrawer";
import ProductGrid from "@/app/components/products/ProductGrid";
import { useDashboard } from "@/hooks/useDashboard";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Info,
  Megaphone,
  PackageCheck,
  Rocket,
  ShoppingCart,
  Sparkles,
  Store,
} from "lucide-react";

const safeArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? v : []);

let lastClick = 0;

type CartItem = { quantity: number };
type Ad = { title?: string; desc?: string; cta?: string; href?: string };

const STORAGE_KEY = "mynify-dashboard-steps-minimized";

const DEFAULT_AD: Required<Ad> = {
  title: "Boost your brand with AI",
  desc: "Create products, generate content and launch faster than ever.",
  cta: "Explore AI tools",
  href: "/dashboard/advertise",
};

const STEPS = [
  {
    title: "Create your first product",
    desc: "Pick a product, add your design, and publish it with Mynify.",
    button: "Create product",
    icon: Store,
    href: "/dashboard/create",
  },
  {
    title: "Connect your store",
    desc: "Connect your favorite platform and start selling your designs.",
    button: "Connect my store",
    icon: PackageCheck,
    href: "/dashboard/connect",
  },
  {
    title: "Join Seller's Club",
    desc: "Get exclusive benefits and grow your business faster.",
    button: "Join now",
    icon: Rocket,
    href: "/dashboard/advertise",
  },
] as const;

export default function Dashboard() {
  const {
    cartOpen,
    openCart,
    closeCart,
    products,
    isLoading,
    notifications,
  } = useDashboard();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [ad, setAd] = useState<Required<Ad>>(DEFAULT_AD);
  const [activeStep, setActiveStep] = useState(0);
  const [minimized, setMinimized] = useState(false);

  const safeProducts = useMemo(() => safeArray<any>(products), [products]);
  const safeNotifications = useMemo(
    () => safeArray<any>(notifications),
    [notifications]
  );

  const totalCartItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cartItems]
  );

  const goTo = useCallback((href: string) => {
    window.location.href = href;
  }, []);

  const toggleMinimized = useCallback(() => {
    setMinimized((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const loadCartCount = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) return;

      const data = await res.json();
      setCartItems(safeArray<CartItem>(data?.items));
    } catch {
      setCartItems([]);
    }
  }, []);

  const loadAd = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard-ad", { cache: "no-store" });
      if (!res.ok) return;

      const data: Ad = await res.json();

      setAd({
        title: data.title || DEFAULT_AD.title,
        desc: data.desc || DEFAULT_AD.desc,
        cta: data.cta || DEFAULT_AD.cta,
        href: data.href || DEFAULT_AD.href,
      });
    } catch {
      setAd(DEFAULT_AD);
    }
  }, []);

  useEffect(() => {
    setMinimized(localStorage.getItem(STORAGE_KEY) === "true");
    loadCartCount();
    loadAd();
  }, [loadCartCount, loadAd]);

  useEffect(() => {
    if (!cartOpen) loadCartCount();
  }, [cartOpen, loadCartCount]);

  const safeOpenCart = useCallback(() => {
    const now = Date.now();
    if (now - lastClick < 300) return;
    lastClick = now;
    openCart();
  }, [openCart]);

  return (
    <div className="min-h-screen overflow-hidden bg-[#03030a] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(168,85,247,0.18),transparent_30%),radial-gradient(circle_at_88%_4%,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#03030a_0%,#070711_52%,#03030a_100%)]" />

      <div className="relative z-10">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#03030a]/80 px-3 py-3 backdrop-blur-xl sm:px-5 md:px-8">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[10px] font-black uppercase tracking-[0.22em] text-purple-300 sm:text-xs">
                Dashboard
              </p>

              <h1 className="truncate text-lg font-black tracking-[-0.045em] text-white sm:text-2xl">
                Brand workspace
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <NotificationBell notifications={safeNotifications} />

              <button
                type="button"
                onClick={safeOpenCart}
                className="relative grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white shadow-sm transition hover:border-purple-400/40 hover:text-purple-200 active:scale-95 md:h-11 md:w-11"
              >
                <ShoppingCart size={18} />

                {totalCartItems > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 px-1.5 text-[11px] font-black text-white">
                    {totalCartItems}
                  </span>
                )}
              </button>

              <SmartCreateButton />
            </div>
          </div>
        </header>

        <main className="px-3 py-5 sm:px-5 md:px-8 md:py-7">
          <div className="mx-auto max-w-[1500px] space-y-10">
            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Store size={25} className="shrink-0 text-purple-300" />

                  <h2 className="truncate text-xl font-black tracking-[-0.045em] text-white sm:text-2xl md:text-3xl">
                    Set up{" "}
                    <span className="text-white/35">My new store</span>
                  </h2>

                  <Info size={16} className="hidden shrink-0 text-white/50 sm:block" />
                </div>

                <button
                  type="button"
                  onClick={toggleMinimized}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-black text-white/80 transition hover:border-purple-400/40 hover:bg-white/10 sm:gap-2 sm:px-4 sm:text-sm"
                >
                  <span className="hidden sm:inline">
                    {minimized ? "Expand steps" : "Minimize steps"}
                  </span>
                  <span className="sm:hidden">
                    {minimized ? "Expand" : "Hide"}
                  </span>
                  {minimized ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                </button>
              </div>

              <div
                className={`flex w-full overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.035] shadow-[0_0_60px_rgba(168,85,247,0.10)] ${
                  minimized ? "h-[72px] sm:h-[86px]" : "h-[360px] sm:h-[430px] md:h-[500px]"
                }`}
              >
                {STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const selected = activeStep === index;

                  return (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() => setActiveStep(index)}
                      className={`relative flex min-w-0 flex-col border-r border-white/10 text-left transition-all duration-300 last:border-r-0 ${
                        selected
                          ? "w-[50%] bg-[#070711] text-white sm:w-[44%]"
                          : "w-[25%] bg-white/[0.02] text-white/80 hover:bg-white/[0.055] sm:w-[28%]"
                      } ${
                        minimized
                          ? "px-3 py-4 sm:px-6 sm:py-6"
                          : "px-3 py-5 sm:px-6 sm:py-8 md:px-8 md:py-9"
                      }`}
                    >
                      <div className="pointer-events-none absolute inset-0 opacity-70">
                        {selected && (
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(168,85,247,0.28),transparent_35%),radial-gradient(circle_at_90%_0%,rgba(14,165,233,0.16),transparent_28%)]" />
                        )}
                      </div>

                      {minimized ? (
                        <p
                          className={`relative z-10 line-clamp-2 text-[11px] font-black leading-tight sm:text-sm md:text-base ${
                            selected ? "text-white" : "text-white/55"
                          }`}
                        >
                          Step {index + 1}: {step.title}
                        </p>
                      ) : (
                        <>
                          <p
                            className={`relative z-10 text-[11px] font-black sm:text-sm md:text-base ${
                              selected ? "text-purple-200/80" : "text-white/40"
                            }`}
                          >
                            Step {index + 1}
                          </p>

                          <div className="relative z-10 mt-8 flex justify-center sm:mt-11 md:mt-14">
                            <div
                              className={`grid h-16 w-16 place-items-center rounded-3xl sm:h-24 sm:w-24 md:h-28 md:w-28 ${
                                selected
                                  ? "bg-purple-500/10 text-purple-300"
                                  : "bg-white/[0.04] text-purple-300/75"
                              }`}
                            >
                              <Icon
                                size={42}
                                strokeWidth={1.55}
                                className="sm:size-[64px] md:size-[82px]"
                              />
                            </div>
                          </div>

                          <h3 className="relative z-10 mt-8 line-clamp-3 max-w-[340px] text-base font-black leading-[1.05] tracking-[-0.045em] text-white sm:mt-10 sm:text-2xl md:mt-12 md:text-3xl">
                            {step.title}
                          </h3>

                          <p
                            className={`relative z-10 mt-3 line-clamp-4 max-w-[420px] text-[11px] font-semibold leading-5 sm:text-sm md:mt-4 md:text-base md:leading-7 ${
                              selected ? "text-white/72" : "text-white/45"
                            }`}
                          >
                            {step.desc}
                          </p>

                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              goTo(step.href);
                            }}
                            className={`relative z-10 mt-auto inline-flex w-fit items-center justify-center gap-2 rounded-xl px-3 py-2 text-[11px] font-black transition sm:px-5 sm:py-3 sm:text-sm ${
                              selected
                                ? "bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white shadow-[0_0_25px_rgba(168,85,247,0.38)]"
                                : "border border-white/10 bg-white/[0.04] text-white/75"
                            }`}
                          >
                            <span className="hidden sm:inline">{step.button}</span>
                            <span className="sm:hidden">Go</span>
                            <ArrowRight size={14} />
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-[0.92fr_1.08fr]">
              <div className="relative min-h-[230px] overflow-hidden rounded-[30px] bg-gradient-to-br from-purple-600 via-fuchsia-600 to-cyan-500 p-6 text-white shadow-[0_30px_100px_rgba(168,85,247,0.22)] md:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_20%,rgba(255,255,255,0.26),transparent_28%)]" />

                <div className="relative max-w-xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
                    <Sparkles size={13} />
                    New campaign
                  </div>

                  <h3 className="text-3xl font-black leading-tight tracking-[-0.055em] md:text-5xl">
                    {ad.title}
                  </h3>

                  <p className="mt-4 max-w-md text-sm font-semibold leading-6 text-white/82">
                    {ad.desc}
                  </p>

                  <button
                    type="button"
                    onClick={() => goTo(ad.href)}
                    className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-black transition hover:scale-[1.02] active:scale-95"
                  >
                    {ad.cta}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              <div className="relative min-h-[230px] overflow-hidden rounded-[30px] bg-[#070711] p-6 text-white shadow-[0_30px_100px_rgba(0,0,0,0.24)] md:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.34),transparent_34%),radial-gradient(circle_at_90%_20%,rgba(14,165,233,0.20),transparent_32%)]" />

                <div className="relative flex items-start gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10">
                    <Megaphone size={25} />
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-purple-200/80">
                      Featured campaign
                    </p>

                    <h3 className="mt-2 text-3xl font-black tracking-[-0.055em] md:text-5xl">
                      Promote your store
                    </h3>

                    <p className="mt-4 max-w-lg text-sm font-medium leading-6 text-white/65">
                      Ready for admin configuration through your API route.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-purple-300">
                    Products
                  </p>
                  <h2 className="text-2xl font-black tracking-[-0.045em] text-white md:text-3xl">
                    Hot new products
                  </h2>
                </div>
              </div>

              <Section title="">
                <ProductGrid products={safeProducts} isLoading={isLoading} />
              </Section>
            </section>
          </div>
        </main>
      </div>

      <CartDrawer open={cartOpen} onClose={closeCart} />
    </div>
  );
}
