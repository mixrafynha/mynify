"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Package, Search, ShoppingBag, Clock, CheckCircle2 } from "lucide-react";

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

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "paid", label: "Paid" },
] as const;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "pending">("all");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
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

  const safeSearch = useMemo(
    () => search.replace(/[<>]/g, "").trim().toLowerCase().slice(0, 50),
    [search]
  );

  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => filter === "all" || o.status === filter)
      .filter((o) => o.product.title.toLowerCase().includes(safeSearch));
  }, [orders, safeSearch, filter]);

  return (
    <div className="min-h-screen bg-[#f8f6ff] text-[#060817]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(168,85,247,0.16),transparent_28%),radial-gradient(circle_at_85%_8%,rgba(14,165,233,0.09),transparent_26%),linear-gradient(180deg,#ffffff_0%,#f8f6ff_48%,#f2efff_100%)]" />

      <main className="relative z-10 min-h-screen">
        <div className="px-3 py-5 sm:px-5 md:px-8 md:py-7">
          <div className="mx-auto max-w-[1500px] space-y-5">
            <header className="sticky top-0 z-30 -mx-3 bg-[#f8f6ff]/90 px-3 pb-4 pt-0 backdrop-blur-2xl sm:-mx-5 sm:px-5 md:-mx-8 md:px-8">
              <div className="mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-600">
                  Orders
                </p>

                <h1 className="text-3xl font-black tracking-[-0.06em] text-[#060817] sm:text-4xl">
                  My Orders
                </h1>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Track your purchases and payments.
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
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
                    placeholder="Search orders..."
                    className="h-11 w-full rounded-full border border-white bg-white/90 pl-11 pr-4 text-sm font-medium text-slate-700 shadow-[0_12px_35px_rgba(101,85,143,0.13)] outline-none placeholder:text-slate-400 transition focus:ring-4 focus:ring-purple-500/15 sm:h-12"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 lg:w-[360px]">
                  {FILTERS.map((f) => {
                    const active = filter === f.key;

                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setFilter(f.key)}
                        className={`h-11 rounded-full text-xs font-black transition sm:h-12 sm:text-sm ${
                          active
                            ? "bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-500 text-white shadow-[0_18px_35px_rgba(124,58,237,0.24)]"
                            : "bg-white/90 text-slate-600 shadow-[0_12px_30px_rgba(101,85,143,0.10)] hover:text-purple-700"
                        }`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </header>

            {loading ? (
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[170px] animate-pulse rounded-[24px] bg-white/85 shadow-[0_12px_30px_rgba(101,85,143,0.10)]"
                  />
                ))}
              </section>
            ) : filteredOrders.length === 0 ? (
              <section className="flex min-h-[55vh] flex-col items-center justify-center text-center">
                <div className="mb-5 grid h-20 w-20 place-items-center rounded-[28px] bg-white/90 text-purple-600 shadow-[0_18px_45px_rgba(101,85,143,0.14)]">
                  <Package size={36} />
                </div>

                <h3 className="text-2xl font-black tracking-[-0.05em]">
                  No orders found
                </h3>

                <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-slate-500">
                  Try adjusting your search or filter to find what you're
                  looking for.
                </p>
              </section>
            ) : (
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {filteredOrders.map((o) => {
                  const paid = o.status === "paid";
                  const pending = o.status === "pending";

                  return (
                    <Link
                      key={o.id}
                      href={`/dashboard/orders/${o.id}`}
                      className="group"
                    >
                      <article className="relative overflow-hidden rounded-[24px] bg-white/90 p-4 shadow-[0_12px_35px_rgba(101,85,143,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(124,58,237,0.18)] sm:p-5">
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-500/10 text-purple-600">
                              <ShoppingBag size={20} />
                            </div>

                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                Order
                              </p>

                              <p className="font-mono text-xs font-black text-slate-500">
                                #{o.id.slice(0, 6)}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black ${
                              paid
                                ? "bg-emerald-500/10 text-emerald-600"
                                : pending
                                  ? "bg-amber-500/10 text-amber-600"
                                  : "bg-slate-500/10 text-slate-500"
                            }`}
                          >
                            {paid ? (
                              <CheckCircle2 size={13} />
                            ) : (
                              <Clock size={13} />
                            )}
                            {o.status}
                          </span>
                        </div>

                        <h3 className="line-clamp-2 text-base font-black leading-5 tracking-[-0.035em] text-[#060817] transition group-hover:text-purple-700">
                          {o.product.title}
                        </h3>

                        <div className="mt-4 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                              Total
                            </p>

                            <p className="mt-1 text-xl font-black tracking-[-0.04em] text-purple-600">
                              {o.product.currency} {o.product.price}
                            </p>
                          </div>

                          <p className="text-xs font-bold text-slate-400">
                            {new Date(o.created_at).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>

                        <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4">
                          <span className="text-sm font-black text-slate-500 transition group-hover:text-purple-700">
                            View order
                          </span>

                          <span className="grid h-8 w-8 place-items-center rounded-full bg-purple-500/10 text-purple-600 transition group-hover:translate-x-1 group-hover:bg-purple-600 group-hover:text-white">
                            →
                          </span>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
