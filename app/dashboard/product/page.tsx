"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Search,
  ChevronDown,
  ChevronRight,
  Grid2X2,
  Shirt,
  Coffee,
  ImageIcon,
} from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useFavorites } from "@/hooks/useFavorites";
import { useCurrency } from "@/hooks/useCurrency";
import { convertPrice, symbols } from "@/lib/currency";
import { useCallback, useMemo, useState } from "react";

type Product = {
  id: string;
  title?: string;
  image?: string;
  price?: number;
  category?: string;
};

const CATEGORIES = [
  { name: "All", icon: Grid2X2 },
  { name: "Hoodies", icon: Shirt },
  { name: "T-Shirts", icon: Shirt },
  { name: "Caps", icon: Shirt },
  { name: "Mugs", icon: Coffee },
  { name: "Posters", icon: ImageIcon },
] as const;

export default function ProductsPage() {
  const { products = [], loading } = useProducts();
  const { likes = {}, toggleLike } = useFavorites();
  const { currency, setCurrency } = useCurrency();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const safeSearch = useMemo(
    () => search.replace(/[<>]/g, "").trim().toLowerCase().slice(0, 50),
    [search]
  );

  const filtered = useMemo(() => {
    return (products as Product[]).filter((p) => {
      const title = (p.title ?? "").toLowerCase();
      const productCategory = (p.category ?? "").toLowerCase();

      return (
        (!safeSearch || title.includes(safeSearch)) &&
        (category === "All" || productCategory.includes(category.toLowerCase()))
      );
    });
  }, [products, safeSearch, category]);

  const handleCurrencyChange = useCallback(
    (c: "USD" | "EUR" | "GBP") => setCurrency?.(c),
    [setCurrency]
  );

  return (
    <div className="min-h-screen bg-[#f8f6ff] text-[#060817]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(168,85,247,0.16),transparent_28%),radial-gradient(circle_at_85%_8%,rgba(14,165,233,0.09),transparent_26%),linear-gradient(180deg,#ffffff_0%,#f8f6ff_48%,#f2efff_100%)]" />

      <main className="relative z-10 min-h-screen md:pl-[280px]">
        <div className="w-full px-3 pb-10 pt-2 sm:px-4 md:px-5 xl:px-6">
          <header className="sticky top-0 z-30 -mx-3 bg-[#f8f6ff]/90 px-3 pb-4 pt-2 backdrop-blur-2xl sm:-mx-4 sm:px-4 md:-mx-5 md:px-5 xl:-mx-6 xl:px-6">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  maxLength={50}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Search..."
                  className="h-11 w-full rounded-full border border-white bg-white/90 pl-11 pr-4 text-sm font-medium text-slate-700 shadow-[0_12px_35px_rgba(101,85,143,0.13)] outline-none placeholder:text-slate-400 transition focus:ring-4 focus:ring-purple-500/15 sm:h-12"
                />
              </div>

              <details className="group relative shrink-0">
                <summary className="flex h-11 cursor-pointer list-none items-center gap-1.5 rounded-full border border-white bg-white/90 px-3 text-sm font-bold text-[#111127] shadow-[0_12px_35px_rgba(101,85,143,0.13)] transition active:scale-95 sm:h-12 sm:px-4">
                  <span className="text-purple-600">{symbols[currency]}</span>
                  {currency}
                  <ChevronDown
                    size={13}
                    className="transition group-open:rotate-180"
                  />
                </summary>

                <div className="absolute right-0 z-50 mt-2 w-28 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-xl">
                  {(["USD", "EUR", "GBP"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleCurrencyChange(c)}
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-sm transition hover:bg-purple-50 ${
                        currency === c
                          ? "font-black text-purple-700"
                          : "font-semibold text-slate-600"
                      }`}
                    >
                      <span>{symbols[c]}</span>
                      {c}
                    </button>
                  ))}
                </div>
              </details>
            </div>

            <div className="mt-4">
              <p className="mb-3 text-sm font-black tracking-[-0.02em] text-[#111127]">
                Categories
              </p>

              <div className="grid grid-cols-[repeat(6,minmax(0,1fr))_38px] gap-2 sm:grid-cols-[repeat(6,minmax(0,1fr))_44px] sm:gap-3">
                {CATEGORIES.map(({ name, icon: Icon }) => {
                  const active = category === name;

                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setCategory(name)}
                      className={`flex h-[62px] flex-col items-center justify-center gap-1 rounded-[15px] text-[9px] font-black transition-all duration-300 sm:h-[86px] sm:gap-2 sm:rounded-[22px] sm:text-sm ${
                        active
                          ? "bg-gradient-to-br from-purple-600 via-violet-600 to-fuchsia-500 text-white shadow-[0_18px_35px_rgba(124,58,237,0.28)]"
                          : "bg-white/90 text-[#111127] shadow-[0_12px_30px_rgba(101,85,143,0.10)] hover:-translate-y-0.5 hover:text-purple-700"
                      }`}
                    >
                      <Icon
                        size={16}
                        strokeWidth={2}
                        className={`sm:size-[22px] ${
                          active ? "text-white" : "text-purple-500"
                        }`}
                      />

                      <span className="leading-none">{name}</span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  className="grid h-[62px] place-items-center rounded-[15px] bg-white/90 text-[#111127] shadow-[0_12px_30px_rgba(101,85,143,0.10)] transition hover:-translate-y-0.5 hover:text-purple-700 sm:h-[86px] sm:rounded-[22px]"
                >
                  <ChevronRight size={17} className="sm:size-[20px]" />
                </button>
              </div>
            </div>
          </header>

          <section className="grid grid-cols-2 gap-3 pt-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[236px] animate-pulse rounded-[22px] bg-white/85 shadow-[0_12px_30px_rgba(101,85,143,0.10)] sm:h-[340px]"
                  />
                ))
              : filtered.map((p) => {
                  if (!p?.id || !p?.image) return null;

                  const isLiked = Boolean(likes?.[p.id]);

                  return (
                    <Link
                      key={p.id}
                      href={`/dashboard/product/${encodeURIComponent(p.id)}`}
                      className="group"
                    >
                      <article className="relative overflow-hidden rounded-[20px] bg-white/90 p-2.5 shadow-[0_12px_35px_rgba(101,85,143,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(124,58,237,0.18)] sm:rounded-[28px] sm:p-4">
                        <div className="relative aspect-square overflow-hidden rounded-[16px] bg-[#f0f1ed] sm:rounded-[22px]">
                          <Image
                            src={p.image}
                            alt={p.title || "Product image"}
                            fill
                            className="object-cover transition duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleLike?.(p.id);
                          }}
                          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-110 sm:right-5 sm:top-5 sm:h-9 sm:w-9"
                        >
                          <Heart
                            size={18}
                            className={
                              isLiked
                                ? "fill-red-500 text-red-500"
                                : "text-slate-400"
                            }
                          />
                        </button>

                        <div className="px-1 pb-1 pt-3 sm:pt-4">
                          <h3 className="line-clamp-1 text-[13px] font-bold tracking-[-0.02em] text-[#050816] sm:text-base">
                            {p.title?.slice(0, 80) || "Untitled product"}
                          </h3>

                          <p className="mt-1 text-sm font-black text-purple-600 sm:text-base">
                            {symbols[currency]}{" "}
                            {convertPrice(p.price ?? 0, currency)}
                          </p>
                        </div>
                      </article>
                    </Link>
                  );
                })}
          </section>
        </div>
      </main>
    </div>
  );
}
