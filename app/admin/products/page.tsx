"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, Pencil, Trash2, Plus, Package, Sparkles } from "lucide-react";
import { useMemo, useState, useCallback, memo } from "react";

import { useProducts } from "@/hooks/useProducts";
import { useCurrency } from "@/hooks/useCurrency";
import { convertPrice, symbols } from "@/lib/currency";

type Product = {
  id: string;
  title?: string;
  image?: string;
  price?: number;
  discount_price?: number;
  category?: string;
};

const ProductCard = memo(function ProductCard({
  product,
  currency,
  onDelete,
}: {
  product: Product;
  currency: "USD" | "EUR" | "GBP";
  onDelete: (id: string) => void;
}) {
  const price = Number(product.discount_price ?? product.price ?? 0);

  return (
    <article className="group relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-[#1b1830] via-[#131325] to-[#0f1020] p-2 transition-transform duration-300 active:scale-[0.99] hover:-translate-y-1">
      <Link href={`/dashboard/product/${encodeURIComponent(product.id)}`}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-[#18182d]">
          <Image
            src={product.image || "/placeholder.png"}
            alt={product.title || "Product image"}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />

          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
        </div>
      </Link>

      <div className="px-1 pb-1 pt-3">
        <p className="mb-1 truncate text-[10px] font-black uppercase tracking-[0.14em] text-[#b8b9d9]">
          {product.category || "Product"}
        </p>

        <h3 className="line-clamp-2 min-h-[34px] text-[13px] font-extrabold leading-tight tracking-[-0.03em] text-[#f3f4ff] sm:text-sm">
          {product.title || "Untitled product"}
        </h3>

        <p className="mt-2 truncate text-sm font-extrabold text-white sm:text-base">
          {symbols[currency]} {convertPrice(price, currency)}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href={`/admin/products/${encodeURIComponent(product.id)}`}
            className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-400/10 text-[11px] font-black text-cyan-100 transition active:scale-95 hover:bg-cyan-400/20"
          >
            <Pencil size={14} />
            Edit
          </Link>

          <button
            type="button"
            onClick={() => onDelete(product.id)}
            className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-rose-300/20 bg-rose-400/10 text-[11px] font-black text-rose-100 transition active:scale-95 hover:bg-rose-400/20"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
});

export default function AdminProductsPage() {
  const { products = [], loading } = useProducts();
  const { currency } = useCurrency();
  const [search, setSearch] = useState("");

  const safeSearch = useMemo(
    () => search.replace(/[<>]/g, "").trim().toLowerCase().slice(0, 50),
    [search]
  );

  const filtered = useMemo(() => {
    const list = products as Product[];
    if (!safeSearch) return list;

    return list.filter((product) =>
      (product.title ?? "").toLowerCase().includes(safeSearch)
    );
  }, [safeSearch, products]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete product?")) return;

    const response = await fetch(`/api/admin/products/${id}`, {
      method: "DELETE",
    });

    if (response.ok) window.location.reload();
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080814] text-white">
      <div className="mx-auto max-w-[1550px] px-3 pb-10 pt-3 sm:px-5 md:px-8">
        <header className="sticky top-0 z-40 -mx-3 bg-[#080814] px-3 pb-3 pt-3 sm:-mx-5 sm:px-5 md:-mx-8 md:px-8">
          <div className="space-y-3">
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
                  placeholder="Search products..."
                  className="h-12 w-full rounded-full border border-white/[0.06] bg-white/[0.065] pl-11 pr-4 text-sm font-bold text-white outline-none placeholder:text-white/32 focus:border-cyan-300/25 focus:bg-white/[0.105]"
                />
              </div>

              <Link
                href="/admin/products/new"
                className="group flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.065] px-3 text-white transition active:scale-95 hover:border-fuchsia-400/25 hover:bg-white/[0.12] sm:px-5"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500">
                  <Plus size={17} />
                </span>
                <span className="hidden text-xs font-black sm:inline">
                  Create product
                </span>
              </Link>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-black tracking-[-0.04em] sm:text-2xl">
                  Admin Products
                </h1>
                <p className="text-xs font-bold text-white/35">
                  {loading ? "Loading products..." : `${filtered.length} products`}
                </p>
              </div>

              <div className="hidden items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.065] px-4 py-2 text-xs font-black sm:flex">
                <Sparkles size={14} className="text-cyan-100" />
                Store manager
              </div>
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
            : filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={currency}
                  onDelete={handleDelete}
                />
              ))}
        </section>

        {!loading && filtered.length === 0 && (
          <div className="mt-16 rounded-[34px] border border-white/[0.05] bg-white/[0.045] p-10 text-center">
            <Package className="mx-auto text-cyan-100" size={24} />
            <p className="mt-4 text-xl font-black">No products found</p>
          </div>
        )}
      </div>
    </main>
  );
}