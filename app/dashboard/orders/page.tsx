"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "@/app/components/sidebar";
import { Package, Search } from "lucide-react";

type Order = {
  id: string;
  product: {
    title: string;
    price: number;
    currency: string;
  };
  status: "paid" | "pending" | string;
  created_at: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "pending">("all");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const res = await fetch("/api/orders");
        const json = await res.json();

        if (!res.ok) return;

        const mapped: Order[] = (json.data || []).map((o: any) => ({
          id: String(o.id),

          product: {
            title: o.product?.title ?? "Product",
            price: Number(o.product?.price ?? 0),
            currency: o.product?.currency ?? "€",
          },

          status: o.status ?? "pending",
          created_at: o.created_at,
        }));

        if (isMounted) setOrders(mapped);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders
      .filter((o) => filter === "all" || o.status === filter)
      .filter((o) => o.product.title.toLowerCase().includes(q));
  }, [orders, search, filter]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6f6f4] to-[#f1f1ec] flex">
      <Sidebar />

      <div className="flex-1 md:pl-[280px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 space-y-8">

          {/* HEADER */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">My Orders</h1>
              <p className="text-sm text-gray-500">
                Track your purchases and payments
              </p>
            </div>

            {/* SEARCH + FILTERS */}
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">

              {/* SEARCH */}
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 h-10 w-full sm:w-64 shadow-sm focus-within:ring-2 focus-within:ring-black/10 transition">
                <Search size={16} className="text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search orders..."
                  className="w-full outline-none text-sm bg-transparent"
                />
              </div>

              {/* FILTERS */}
              <div className="flex gap-2">
                {(["all", "pending", "paid"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 h-10 rounded-full text-sm border transition-all duration-200 ${
                      filter === f
                        ? f === "paid"
                          ? "bg-green-600 text-white shadow-sm"
                          : f === "pending"
                          ? "bg-yellow-500 text-white shadow-sm"
                          : "bg-black text-white shadow-sm"
                        : "bg-white hover:shadow-md hover:-translate-y-0.5"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CONTENT */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 rounded-2xl bg-white border border-gray-100 shadow-sm animate-pulse"
                />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="p-4 rounded-full bg-white shadow-sm mb-4">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium">No orders found</h3>
              <p className="text-sm text-gray-500 max-w-sm mt-1">
                Try adjusting your search or filter to find what you're looking for.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

              {filteredOrders.map((o) => (
                <Link
                  key={o.id}
                  href={`/dashboard/orders/${o.id}`}
                  className="group bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* TOP */}
                  <div className="flex justify-between items-center mb-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        o.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : o.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {o.status}
                    </span>

                    <span className="text-xs text-gray-400 font-mono">
                      #{o.id.slice(0, 6)}
                    </span>
                  </div>

                  {/* TITLE */}
                  <h3 className="text-sm font-semibold group-hover:text-black transition-colors">
                    {o.product.title}
                  </h3>

                  {/* PRICE */}
                  <p className="text-sm text-gray-500 mt-1">
                    {o.product.currency} {o.product.price}
                  </p>

                  {/* DATE */}
                  <p className="text-xs text-gray-400 mt-3">
                    {new Date(o.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>

                  {/* CTA */}
                  <div className="mt-4 text-sm font-medium text-black opacity-70 group-hover:opacity-100 transition">
                    View order →
                  </div>
                </Link>
              ))}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}