"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  Coffee,
  Grid2X2,
  Heart,
  ImageIcon,
  Mars,
  Search,
  Shirt,
  ShoppingCart,
  Venus,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import CartDrawer from "@/app/components/ui/CartDrawer";
import { useProducts } from "@/hooks/useProducts";
import { useFavorites } from "@/hooks/useFavorites";
import { useCurrency } from "@/hooks/useCurrency";
import { convertPrice, symbols } from "@/lib/currency";

type Product = {
  id: string;
  title?: string;
  image?: string;
  images?: string[];
  price?: number;
  discount_price?: number;
  category?: string;
  color?: string;
  size?: string;
  sku?: string;
};

const CATEGORIES = [
  { name: "All", icon: Grid2X2 },
  { name: "Hoodies", icon: Shirt },
  { name: "T-Shirts", icon: Shirt },
  { name: "Caps", icon: Shirt },
  { name: "Mugs", icon: Coffee },
  { name: "Posters", icon: ImageIcon },
] as const;

const AUDIENCES = [
  { name: "All", label: "All", icon: Grid2X2 },
  { name: "Woman", label: "Woman", icon: Venus },
  { name: "Man", label: "Man", icon: Mars },
] as const;

export default function ProductsPage() {
  const { products = [], loading } = useProducts();
  const { likes = {}, toggleLike } = useFavorites();
  const { currency, setCurrency } = useCurrency();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [audience, setAudience] =
    useState<(typeof AUDIENCES)[number]["name"]>("All");

  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const activeCategory =
    CATEGORIES.find((item) => item.name === category) ?? CATEGORIES[0];

  const ActiveCategoryIcon = activeCategory.icon;

  const safeSearch = useMemo(
    () => search.replace(/[<>]/g, "").trim().toLowerCase().slice(0, 50),
    [search]
  );

  const filtered = useMemo(() => {
    return (products as Product[]).filter((product) => {
      const title = (product.title ?? "").toLowerCase();
      const productCategory = (product.category ?? "").toLowerCase();
      const audienceValue = audience.toLowerCase();

      return (
        (!safeSearch || title.includes(safeSearch)) &&
        (category === "All" ||
          productCategory.includes(category.toLowerCase())) &&
        (audience === "All" ||
          title.includes(audienceValue) ||
          productCategory.includes(audienceValue))
      );
    });
  }, [products, safeSearch, category, audience]);

  const loadCart = useCallback(async () => {
    try {
      const response = await fetch("/api/cart", {
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = await response.json();

      const items = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];

      const total = items.reduce(
        (acc: number, item: any) => acc + Number(item.quantity || 1),
        0
      );

      setCartCount(total);
    } catch (error) {
      console.error("Cart error:", error);
    }
  }, []);

  useEffect(() => {
    loadCart();

    const onFocus = () => loadCart();

    window.addEventListener("focus", onFocus);

    return () => window.removeEventListener("focus", onFocus);
  }, [loadCart]);

  useEffect(() => {
    loadCart();
  }, [cartOpen, loadCart]);

  const handleCurrencyChange = useCallback(
    (nextCurrency: "USD" | "EUR" | "GBP") => {
      setCurrency?.(nextCurrency);
    },
    [setCurrency]
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080814] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(217,70,239,0.20),transparent_34%),radial-gradient(circle_at_88%_8%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_50%_105%,rgba(168,85,247,0.18),transparent_36%),linear-gradient(180deg,#080814_0%,#121226_52%,#080814_100%)]" />

      <div className="relative z-10 mx-auto max-w-[1550px] px-3 pb-10 pt-3 sm:px-5 md:px-8">
        <header className="sticky top-0 z-40 pb-4 pt-3 backdrop-blur-3xl">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-100/65"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  maxLength={50}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Search products..."
                  className="h-12 w-full rounded-full border border-white/[0.06] bg-white/[0.065] pl-11 pr-4 text-sm font-bold text-white outline-none placeholder:text-white/32 transition duration-300 focus:border-cyan-300/25 focus:bg-white/[0.105]"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setCartOpen(true);
                  loadCart();
                }}
                className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/[0.06] bg-white/[0.065] text-white transition duration-300 active:scale-95 hover:border-fuchsia-400/25 hover:bg-white/[0.12]"
              >
                <ShoppingCart size={19} />

                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-1 text-[10px] font-black text-white shadow-[0_0_24px_rgba(34,211,238,0.55)]">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>

              <details className="group relative shrink-0">
                <summary className="flex h-12 cursor-pointer list-none items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.065] px-4 text-sm font-black text-white transition duration-300 active:scale-95 hover:bg-white/[0.11]">
                  <span className="text-cyan-100">{symbols[currency]}</span>
                  <span className="hidden sm:inline">{currency}</span>
                  <ChevronDown
                    size={14}
                    className="transition group-open:rotate-180"
                  />
                </summary>

                <div className="absolute right-0 z-50 mt-2 w-28 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#15152b]/96 p-1 shadow-2xl backdrop-blur-2xl">
                  {(["USD", "EUR", "GBP"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleCurrencyChange(item)}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition hover:bg-white/10 ${
                        currency === item
                          ? "font-black text-white"
                          : "font-semibold text-white/60"
                      }`}
                    >
                      <span>{symbols[item]}</span>
                      {item}
                    </button>
                  ))}
                </div>
              </details>
            </div>

            <div className="hidden items-center justify-between gap-3 lg:flex">
              <div className="flex flex-wrap items-center gap-1.5">
                {AUDIENCES.map(({ name, label, icon: Icon }) => {
                  const active = audience === name;

                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setAudience(name)}
                      className={`flex h-10 items-center gap-2 rounded-full px-4 text-xs font-black transition duration-300 active:scale-95 ${
                        active
                          ? "bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500 text-white shadow-[0_12px_36px_rgba(217,70,239,0.28)]"
                          : "bg-white/[0.035] text-white/55 hover:bg-white/[0.09] hover:text-white"
                      }`}
                    >
                      <Icon size={15} />
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-1.5">
                {CATEGORIES.map(({ name, icon: Icon }) => {
                  const active = category === name;

                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setCategory(name)}
                      className={`flex h-10 items-center gap-2 rounded-full px-4 text-xs font-black transition duration-300 active:scale-95 ${
                        active
                          ? "bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500 text-white shadow-[0_12px_36px_rgba(34,211,238,0.24)]"
                          : "bg-white/[0.035] text-white/55 hover:bg-white/[0.09] hover:text-white"
                      }`}
                    >
                      <Icon size={15} />
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:hidden">
              <details className="group relative">
                <summary className="flex h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.065] px-3 text-xs font-black text-white transition active:scale-95 hover:bg-white/[0.10]">
                  {audience === "Man" ? (
                    <Mars size={16} className="text-cyan-100" />
                  ) : (
                    <Venus size={16} className="text-cyan-100" />
                  )}

                  <span>{audience === "All" ? "Woman / Man" : audience}</span>
                  <ChevronDown
                    size={13}
                    className="transition group-open:rotate-180"
                  />
                </summary>

                <div className="absolute left-0 z-50 mt-2 grid w-[160px] gap-1 rounded-2xl border border-white/[0.06] bg-[#15152b]/96 p-1.5 shadow-2xl backdrop-blur-2xl">
                  {AUDIENCES.map(({ name, label, icon: Icon }) => {
                    const active = audience === name;

                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setAudience(name)}
                        className={`flex h-9 items-center justify-center gap-2 rounded-xl text-xs font-black transition active:scale-95 ${
                          active
                            ? "bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500 text-white"
                            : "text-white/65 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Icon size={14} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </details>

              <details className="group relative">
                <summary className="flex h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.065] px-3 text-xs font-black text-white transition active:scale-95 hover:bg-white/[0.10]">
                  <ActiveCategoryIcon size={16} className="text-cyan-100" />
                  <span className="truncate">
                    {category === "All" ? "All Categories" : category}
                  </span>
                  <ChevronDown
                    size={13}
                    className="transition group-open:rotate-180"
                  />
                </summary>

                <div className="absolute right-0 z-50 mt-2 grid w-[185px] gap-1 rounded-2xl border border-white/[0.06] bg-[#15152b]/96 p-1.5 shadow-2xl backdrop-blur-2xl">
                  {CATEGORIES.map(({ name, icon: Icon }) => {
                    const active = category === name;

                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setCategory(name)}
                        className={`flex h-9 items-center justify-center gap-2 rounded-xl text-xs font-black transition active:scale-95 ${
                          active
                            ? "bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500 text-white"
                            : "text-white/65 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Icon size={14} />
                        {name}
                      </button>
                    );
                  })}
                </div>
              </details>
            </div>
          </div>
        </header>

        <section className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
          {loading
            ? Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[260px] animate-pulse rounded-[28px] bg-white/[0.055] sm:h-[330px]"
                />
              ))
            : filtered.map((product) => {
                if (!product?.id || !product?.image) return null;

                const isLiked = Boolean(likes?.[product.id]);

                const price = Number(
                  product.discount_price ?? product.price ?? 0
                );

                const hasDiscount =
                  typeof product.discount_price === "number" &&
                  typeof product.price === "number" &&
                  product.discount_price < product.price;

                return (
                  <Link
                    key={product.id}
                    href={`/dashboard/product/${encodeURIComponent(
                      product.id
                    )}`}
                    className="group min-w-0"
                  >
                    <article className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-[#1b1830] via-[#131325] to-[#0f1020] p-2 transition duration-300 active:scale-[0.99] hover:-translate-y-1 hover:border-fuchsia-400/25 hover:shadow-[0_25px_80px_rgba(217,70,239,0.16)]">
                      <div className="pointer-events-none absolute inset-0 opacity-100">
                        <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />
                        <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
                      </div>

                      <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-[#18182d]">
                        <Image
                          src={product.image}
                          alt={product.title || "Product image"}
                          fill
                          className="object-cover transition duration-700 group-hover:scale-[1.06]"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        />

                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        {hasDiscount && (
                          <div className="absolute left-2.5 top-2.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white shadow-lg">
                            Sale
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            toggleLike?.(product.id);
                          }}
                          className={`absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full border backdrop-blur-xl transition active:scale-95 ${
                            isLiked
                              ? "border-rose-300/40 bg-rose-400/20 text-rose-100 shadow-[0_0_24px_rgba(251,113,133,0.35)]"
                              : "border-white/10 bg-black/35 text-white hover:bg-white/10 hover:text-rose-100"
                          }`}
                        >
                          <Heart
                            size={17}
                            className={
                              isLiked
                                ? "fill-rose-300 text-rose-200"
                                : "text-white/85"
                            }
                          />
                        </button>
                      </div>

                      <div className="relative px-1 pb-1 pt-3">
                        <p className="mb-1 truncate text-[10px] font-black uppercase tracking-[0.14em] text-[#b8b9d9]">
                          {product.category || "Product"}
                        </p>

                        <h3 className="line-clamp-2 min-h-[34px] text-[13px] font-extrabold leading-tight tracking-[-0.03em] text-[#f3f4ff] sm:text-sm">
                          {product.title?.slice(0, 80) || "Untitled product"}
                        </h3>

                        <div className="mt-3 flex items-end justify-between gap-2">
                          <div>
                            <p className="text-sm font-extrabold text-white sm:text-base">
                              {symbols[currency]}{" "}
                              {convertPrice(price, currency)}
                            </p>

                            {hasDiscount && (
                              <p className="text-[10px] font-bold text-[#8d90b3] line-through">
                                {symbols[currency]}{" "}
                                {convertPrice(product.price ?? 0, currency)}
                              </p>
                            )}
                          </div>

                          <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#d9dbff] backdrop-blur-xl transition group-hover:bg-white/[0.14]">
                            View
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
        </section>

        {!loading && filtered.length === 0 && (
          <div className="mt-16 rounded-[34px] border border-white/[0.05] bg-white/[0.045] p-10 text-center backdrop-blur-xl">
            <p className="text-xl font-black text-white">No products found</p>
            <p className="mt-2 text-sm text-white/45">
              Try another search or category.
            </p>
          </div>
        )}
      </div>

      <CartDrawer
        open={cartOpen}
        onClose={() => {
          setCartOpen(false);
          loadCart();
        }}
      />
    </main>
  );
}
