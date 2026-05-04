"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, Pencil, Trash2, Plus } from "lucide-react";

import { useProducts } from "@/hooks/useProducts";
import { useCurrency } from "@/hooks/useCurrency";

import { convertPrice, symbols } from "@/lib/currency";
import { useMemo, useState, useCallback } from "react";

export default function AdminProductsPage() {
  const { products = [], loading } = useProducts();
  const { currency } = useCurrency();

  const [search, setSearch] = useState("");

  const safeSearch = useMemo(
    () => search.trim().toLowerCase().slice(0, 50),
    [search]
  );

  const filtered = useMemo(() => {
    if (!safeSearch) return products;

    return products.filter((p) =>
      (p.title ?? "").toLowerCase().includes(safeSearch)
    );
  }, [safeSearch, products]);

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
    },
    []
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Delete product?")) return;

    await fetch(`/api/admin/products/${id}`, {
      method: "DELETE",
    });

    location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 w-full">
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />

            <input
              value={search}
              onChange={handleSearch}
              placeholder="Search products..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-gray-100 text-sm outline-none border border-gray-200 focus:border-gray-400 transition"
            />
          </div>

          <Link
            href="/admin/products/new"
            className="group relative overflow-hidden flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-white to-gray-100 text-black text-sm font-medium shadow-sm border border-black/10 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <span className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-black transition" />
            <Plus size={16} className="relative z-10" />
            <span className="relative z-10">New product</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {loading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-100 animate-pulse rounded-2xl"
                />
              ))
            : filtered.map((p) => (
                <div
                  key={p.id}
                  className="group rounded-2xl overflow-hidden bg-white border border-gray-200 hover:shadow-md transition"
                >
                  <Link href={`/dashboard/product/${p.id}`}>
                    <div className="aspect-square relative overflow-hidden bg-gray-100">
                      <Image
                        src={p.image || "/placeholder.png"}
                        alt={p.title || "product"}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                  </Link>

                  <div className="p-3">
                    <h3 className="text-sm font-medium truncate">
                      {p.title}
                    </h3>

                    <p className="text-xs text-gray-500 mt-1">
                      {symbols[currency]} {convertPrice(p.price ?? 0, currency)}
                    </p>

                    <div className="flex justify-between items-center mt-3">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="text-xs text-blue-600 hover:text-blue-500 flex items-center gap-1"
                      >
                        <Pencil size={13} />
                        Edit
                      </Link>

                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}