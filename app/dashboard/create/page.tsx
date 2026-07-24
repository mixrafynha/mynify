"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Coffee,
  PackageCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

type CategoryIcon = "tshirt" | "hoodie" | "bag" | "cap" | "mug";

const CATEGORIES = [
  {
    id: "tshirt",
    label: "T-Shirts",
    desc: "Classic and oversized styles",
    icon: "tshirt" as CategoryIcon,
  },
  {
    id: "hoodie",
    label: "Hoodies",
    desc: "Premium comfort wear",
    icon: "hoodie" as CategoryIcon,
  },
  {
    id: "bag",
    label: "Bags & Accessories",
    desc: "Tote bags, backpacks and more",
    icon: "bag" as CategoryIcon,
    featured: true,
  },
  {
    id: "caps",
    label: "Caps",
    desc: "Everyday branded accessories",
    icon: "cap" as CategoryIcon,
  },
  {
    id: "mug",
    label: "Mugs",
    desc: "Custom ceramic mugs",
    icon: "mug" as CategoryIcon,
  },
];

function CategoryArtwork({ type }: { type: CategoryIcon }) {
  if (type === "mug") {
    return <Coffee className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={1.7} />;
  }

  if (type === "tshirt") {
    return (
      <svg viewBox="0 0 64 64" className="h-9 w-9 sm:h-10 sm:w-10" fill="none" aria-hidden="true">
        <path d="M22 10 12 15 5 27l10 6 5-7v28h24V26l5 7 10-6-7-12-10-5c-2 5-5 7-10 7s-8-2-10-7Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/>
        <path d="M22 10c1 6 5 9 10 9s9-3 10-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    );
  }

  if (type === "hoodie") {
    return (
      <svg viewBox="0 0 64 64" className="h-9 w-9 sm:h-10 sm:w-10" fill="none" aria-hidden="true">
        <path d="M23 13c2-5 5-8 9-8s7 3 9 8l10 6 8 15-10 6-5-8v23H20V32l-5 8-10-6 8-15 10-6Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/>
        <path d="M23 13c1 7 4 11 9 11s8-4 9-11M32 24v31M27 38h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    );
  }

  if (type === "bag") {
    return (
      <svg viewBox="0 0 64 64" className="h-9 w-9 sm:h-10 sm:w-10" fill="none" aria-hidden="true">
        <path d="M13 20h38l4 36H9l4-36Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/>
        <path d="M22 24v-7c0-6 4-10 10-10s10 4 10 10v7" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M24 34c2 3 5 5 8 5s6-2 8-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" className="h-9 w-9 sm:h-10 sm:w-10" fill="none" aria-hidden="true">
      <path d="M8 31c4-15 13-23 26-23 12 0 20 7 23 19-12-4-24-2-36 5L8 31Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/>
      <path d="M21 32c9-4 21-6 36-5-2 8-8 13-18 15-8 2-14 1-18-2v-8Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/>
    </svg>
  );
}

type Product = {
  id: string;
  title: string;
  price: number;
  image?: string;
};

function RedirectToEditor({
  product,
  category,
}: {
  product: Product;
  category: string | null;
}) {
  const router = useRouter();

  useEffect(() => {
    const mockup = category || "hoodie";

    router.push(
      `/dashboard/design/${mockup}?productId=${encodeURIComponent(product.id)}`
    );
  }, [product.id, category, router]);

  return (
    <div className="grid min-h-[55vh] place-items-center">
      <div className="flex flex-col items-center gap-5 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-300" />
        <p className="text-sm font-black uppercase tracking-[0.24em] text-white/40">
          Opening editor
        </p>
      </div>
    </div>
  );
}

export default function CreatePage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const productsCache = useRef<Record<string, Product[]>>({});

  const activeCategory = useMemo(() => {
    return CATEGORIES.find((item) => item.id === category);
  }, [category]);

  function handleExit() {
    const confirmExit = window.confirm(
      "Do you want to leave? Unsaved changes will be lost."
    );

    if (!confirmExit) return;

    router.push("/dashboard");
  }

  useEffect(() => {
    if (!category) {
      setProducts([]);
      setSelected(null);
      setLoading(false);
      return;
    }

    // Preserve the narrowed string value for the async function.
    // TypeScript cannot guarantee that the state value remains non-null
    // inside an asynchronous closure.
    const currentCategory = category;

    const cached = productsCache.current[currentCategory];
    if (cached) {
      setProducts(cached);
      setSelected(cached[0] ?? null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadProducts() {
      setLoading(true);

      try {
        const res = await fetch("/api/products/by-type", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: currentCategory }),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Unable to load products: ${res.status}`);
        }

        const data: unknown = await res.json();
        const list: Product[] = Array.isArray(data) ? data : [];

        productsCache.current[currentCategory] = list;
        setProducts(list);
        setSelected(list[0] ?? null);
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error("Unable to load products:", error);
        setProducts([]);
        setSelected(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      controller.abort();
    };
  }, [category]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#03030a] px-3 py-5 text-white sm:px-7 sm:py-7 lg:px-10 lg:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#03030a_0%,#080812_55%,#03030a_100%)] sm:fixed sm:bg-[radial-gradient(circle_at_15%_0%,rgba(168,85,247,0.20),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(217,70,239,0.14),transparent_30%),linear-gradient(180deg,#03030a_0%,#080812_52%,#03030a_100%)]" />
      <div className="pointer-events-none fixed inset-0 hidden bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20 sm:block" />

      <button
        type="button"
        onClick={handleExit}
        className="fixed right-4 top-4 z-50 inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-[#0b0b13]/80 px-4 text-xs font-black uppercase tracking-[0.16em] text-white/65 shadow-[0_10px_35px_rgba(0,0,0,0.35)] sm:backdrop-blur-xl transition hover:border-fuchsia-300/25 hover:text-white active:scale-95 sm:right-8 sm:top-8"
      >
        <X size={15} />
        Exit
      </button>

      <section className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-10 max-w-4xl pt-10 sm:pt-5">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-purple-300">
            <Sparkles size={13} />
            Product Studio
          </div>

          <h1 className="text-4xl font-black tracking-[-0.07em] text-white sm:text-6xl lg:text-7xl">
            Create your product
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/45 sm:text-base">
            Choose a product, customize your design and publish it with a clean
            premium workflow.
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            {["Choose", "Select", "Design"].map((label, index) => {
              const active = step === index + 1;
              const done = step > index + 1;

              return (
                <div
                  key={label}
                  className={`
                    inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition
                    ${
                      active
                        ? "border-fuchsia-300/25 bg-gradient-to-r from-purple-500/15 to-fuchsia-500/15 text-white shadow-[0_0_26px_rgba(168,85,247,0.16)]"
                        : done
                          ? "border-cyan-300/20 bg-cyan-300/5 text-cyan-200/80"
                          : "border-white/10 bg-white/[0.02] text-white/35"
                    }
                  `}
                >
                  <span
                    className={`
                      h-1.5 w-1.5 rounded-full
                      ${
                        active
                          ? "bg-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,0.8)]"
                          : done
                            ? "bg-cyan-300"
                            : "bg-white/20"
                      }
                    `}
                  />
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
            {CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setCategory(item.id);
                  setStep(2);
                }}
                className={`group relative overflow-hidden rounded-[1.4rem] border bg-white/[0.03] p-4 text-left transition active:scale-[0.985] sm:rounded-[2rem] sm:p-8 sm:shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:backdrop-blur-xl sm:hover:-translate-y-1 ${item.featured ? "col-span-2 border-fuchsia-300/20 bg-gradient-to-r from-purple-500/[0.08] to-fuchsia-500/[0.05] sm:col-span-1" : "border-white/10 hover:border-fuchsia-300/25 hover:bg-white/[0.055]"}`}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.18),transparent_38%)] opacity-0 transition group-hover:opacity-100" />

                <div className="relative">
                  <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-[#0b0b13]/70 text-purple-200 shadow-[0_0_24px_rgba(168,85,247,0.10)] sm:mb-8 sm:h-16 sm:w-16 sm:rounded-3xl">
                    <CategoryArtwork type={item.icon} />
                  </div>

                  <p className="text-base font-black tracking-[-0.035em] text-white sm:text-2xl">
                    {item.label}
                  </p>

                  <p className="mt-1 text-xs font-semibold leading-5 text-white/42 sm:mt-2 sm:text-sm sm:leading-6">
                    {item.desc}
                  </p>

                  <div className="mt-4 inline-flex items-center gap-2 text-[10px] sm:mt-8 sm:text-xs font-black uppercase tracking-[0.18em] text-purple-300/80">
                    Choose
                    <ArrowRight
                      size={14}
                      className="transition group-hover:translate-x-1"
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-purple-300">
                  Selected category
                </p>

                <h2 className="mt-2 text-3xl font-black capitalize tracking-[-0.055em] text-white sm:text-4xl">
                  {activeCategory?.label || category}
                </h2>

                <p className="mt-2 text-sm font-semibold text-white/40">
                  Choose the product base you want to customize.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setSelected(null);
                  setProducts([]);
                }}
                className="inline-flex items-center gap-2 text-sm font-black text-white/45 transition hover:text-white"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            </div>

            {loading ? (
              <div className="grid min-h-[280px] place-items-center rounded-[2rem] border border-white/10 bg-white/[0.025]">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-300" />
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-white/35">
                    Loading products
                  </p>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="grid min-h-[280px] place-items-center rounded-[2rem] border border-white/10 bg-white/[0.025] text-center">
                <div>
                  <PackageCheck className="mx-auto h-9 w-9 text-white/25" />
                  <p className="mt-4 text-lg font-black text-white">
                    No products found
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white/40">
                    Try another category.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                  {products.map((product) => {
                    const active = selected?.id === product.id;

                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => setSelected(product)}
                        className="group text-left"
                      >
                        <div
                          className={`
                            relative aspect-square overflow-hidden rounded-[1.75rem] border bg-white/[0.03] p-3 transition sm:p-4 sm:backdrop-blur-xl
                            ${
                              active
                                ? "border-fuchsia-300/35 shadow-[0_0_35px_rgba(168,85,247,0.22)]"
                                : "border-white/10 hover:border-white/20"
                            }
                          `}
                        >
                          <img
                            src={product.image || "/placeholder.png"}
                            alt={product.title}
                            className="h-full w-full object-contain transition duration-300 sm:group-hover:scale-105"
                            loading="lazy"
                            decoding="async"
                          />

                          {active && (
                            <span className="absolute right-3 top-3 rounded-full border border-fuchsia-300/25 bg-fuchsia-400/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-fuchsia-200">
                              Selected
                            </span>
                          )}
                        </div>

                        <p className="mt-3 truncate text-sm font-black text-white sm:text-base">
                          {product.title}
                        </p>

                        <p className="mt-1 text-xs font-bold text-white/38 sm:text-sm">
                          Base €{product.price}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 flex justify-end border-t border-white/10 pt-5 sm:mt-10 sm:pt-6">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!selected}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 px-7 py-3 text-sm font-black text-white shadow-[0_0_35px_rgba(168,85,247,0.32)] transition hover:scale-[1.025] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Continue
                    <ArrowRight size={17} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 3 && selected && (
          <RedirectToEditor product={selected} category={category} />
        )}
      </section>
    </main>
  );
}
