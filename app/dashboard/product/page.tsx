"use client";

import Image from "next/image";
import Link from "next/link";
import Sidebar from "@/app/components/sidebar";
import { Heart, Search } from "lucide-react";

import { useProducts } from "@/hooks/useProducts";
import { useFavorites } from "@/hooks/useFavorites";
import { useCurrency } from "@/hooks/useCurrency";

import { convertPrice, symbols } from "@/lib/currency";
import { useMemo, useState, useCallback } from "react";

type Product = {
  id: string;
  title?: string;
  image?: string;
  price?: number;
};

export default function ProductsPage() {
  const { products = [], loading } = useProducts();
  const { likes = {}, toggleLike } = useFavorites();
  const { currency, setCurrency } = useCurrency();

  const [search, setSearch] = useState("");

  // 🔒 sanitize input (evita lixo + abuse de state)
  const safeSearch = useMemo(() => {
    return search
      .replace(/[<>]/g, "") // anti injection visual
      .trim()
      .toLowerCase()
      .slice(0, 50); // evita payload gigante
  }, [search]);

  const filtered = useMemo(() => {
    if (!safeSearch) return products;

    return (products as Product[]).filter((p) => {
      const title = (p.title ?? "").toLowerCase();
      return title.includes(safeSearch);
    });
  }, [safeSearch, products]);

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
    },
    []
  );

  const handleCurrencyChange = useCallback(
    (c: "USD" | "EUR" | "GBP") => {
      if (typeof setCurrency !== "function") return;
      setCurrency(c);
    },
    [setCurrency]
  );

  return (
    <div className="min-h-screen bg-[#f7f7f3] flex">
      <Sidebar />

      <div className="flex-1 md:pl-[280px]">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

          {/* SEARCH + CURRENCY */}
          <div className="flex items-center gap-2 sm:gap-3 ml-[20px] sm:ml-0 -mt-[8px]  sm:mt-0">

            {/* SEARCH */}
            <div className="relative w-full sm:max-w-xs ml-[11px] sm:ml-0 sm:mt-0">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={14}
              />

              <input
                value={search}
                onChange={handleSearch}
                maxLength={50}
                autoComplete="off"
                spellCheck={false}
                className="
                  w-full h-9
                  pl-9 pr-3
                  rounded-full bg-white
                  outline-none focus:ring-2 focus:ring-black/10
                  shadow-sm text-sm
                "
                placeholder="Search..."
              />
            </div>

            {/* CURRENCY */}
            <details className="relative group">
            <summary
              className="
                list-none cursor-pointer
                h-9 px-3
                flex items-center gap-1
                rounded-full
                border border-gray-200
                bg-white
                hover:bg-gray-50
                transition-all duration-200
                shadow-sm text-sm
                select-none
                active:scale-[0.98]
                focus:outline-none
              "
            >
              <span className="text-base">💱</span>
              <span className="font-medium text-gray-700">{currency}</span>
            </summary>

            {/* dropdown */}
            <div
              className="
                absolute right-0 mt-2 w-32
                rounded-xl
                border border-gray-100
                bg-white
                shadow-lg
                overflow-hidden
                z-50
              "
            >
              {(["USD", "EUR", "GBP"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCurrencyChange(c)}
                  className={`
                    w-full text-left px-3 py-2 text-sm
                    flex items-center gap-2
                    transition
                    hover:bg-gray-50
                    active:bg-gray-100
                    ${
                      currency === c
                        ? "bg-gray-50 font-semibold text-gray-900"
                        : "text-gray-600"
                    }
                  `}
                >
                  <span className="text-base">{symbols[c]}</span>
                  <span>{c}</span>

                  {/* active dot */}
                  {currency === c && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>
              ))}
            </div>
          </details>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="aspect-square bg-gray-200 animate-pulse rounded-2xl"
                  />
                ))
              : filtered.map((p: Product) => {
                  const isLiked = Boolean(likes?.[p.id]);

                  // 🔒 hard guard (evita crashes / undefined injection)
                  if (!p?.id || !p?.image) return null;

                  return (
                    <Link
                      key={p.id}
                      href={`/dashboard/product/${encodeURIComponent(p.id)}`}
                      className="group"
                    >
                      <div className="relative bg-white rounded-2xl p-3 shadow-sm hover:shadow-md transition">

                        {/* IMAGE */}
                        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
                          <Image
                            src={p.image}
                            alt={p.title || "Product image"}
                            fill
                            className="object-cover group-hover:scale-105 transition duration-300"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        </div>

                        {/* TITLE (safe render) */}
                        <h3 className="text-sm mt-3 line-clamp-1 font-medium">
                          {p.title ? p.title.slice(0, 80) : "Untitled product"}
                        </h3>

                        {/* PRICE */}
                        <p className="text-gray-500 text-sm mt-1">
                          {symbols[currency]}{" "}
                          {convertPrice(p.price ?? 0, currency)}
                        </p>

                        {/* LIKE */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation(); // 🔒 evita bubbling abuse
                            toggleLike?.(p.id);
                          }}
                          className="absolute top-3 right-3 bg-white/80 p-1.5 rounded-full hover:scale-110 transition"
                        >
                          <Heart
                            size={18}
                            className={
                              isLiked
                                ? "text-red-500 fill-red-500"
                                : "text-gray-400"
                            }
                          />
                        </button>

                      </div>
                    </Link>
                  );
                })}
          </div>

        </div>
      </div>
    </div>
  );
}