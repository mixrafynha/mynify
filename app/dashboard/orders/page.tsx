"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  ShoppingBag,
  Clock,
  CheckCircle2,
} from "lucide-react";

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
  const [filter, setFilter] = useState<
    "all" | "paid" | "pending"
  >("all");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const res = await fetch("/api/orders", {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok) return;

        const mapped: Order[] = (json.data || []).map(
          (o: any) => ({
            id: String(o.id),
            product: {
              title: o.product?.title ?? "Product",
              price: Number(o.product?.price ?? 0),
              currency: o.product?.currency ?? "$",
            },
            status: o.status ?? "pending",
            created_at: o.created_at,
          })
        );

        if (isMounted) {
          setOrders(mapped);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const safeSearch = useMemo(
    () =>
      search
        .replace(/[<>]/g, "")
        .trim()
        .toLowerCase()
        .slice(0, 50),
    [search]
  );

  const filteredOrders = useMemo(() => {
    return orders
      .filter(
        (o) =>
          filter === "all" || o.status === filter
      )
      .filter((o) =>
        o.product.title
          .toLowerCase()
          .includes(safeSearch)
      );
  }, [orders, safeSearch, filter]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080814] text-white">
      <div className="relative z-10 mx-auto max-w-[1550px] px-3 pb-10 pt-3 sm:px-5 md:px-8">
        <header className="sticky top-0 z-30 pb-4 pt-3 backdrop-blur-2xl">
          
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-400">
              Orders
            </p>

            <h1 className="text-3xl font-black tracking-[-0.06em] text-white sm:text-4xl">
              My Orders
            </h1>

            <p className="mt-1 text-sm font-semibold text-white/45">
              Track your purchases and payments.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                maxLength={50}
                autoComplete="off"
                spellCheck={false}
                placeholder="Search orders..."
                className="h-11 w-full rounded-full border border-white/[0.08] bg-white/[0.05] pl-11 pr-4 text-sm font-medium text-white outline-none placeholder:text-white/35 transition focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/10 sm:h-12"
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
                        ? "bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 text-white shadow-[0_12px_35px_rgba(139,92,246,0.35)]"
                        : "border border-white/[0.06] bg-white/[0.04] text-white/60 hover:text-white"
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
          <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map(
              (_, i) => (
                <div
                  key={i}
                  className="h-[190px] animate-pulse rounded-[28px] bg-white/[0.055]"
                />
              )
            )}
          </section>
        ) : filteredOrders.length === 0 ? (
          <section className="mt-16 rounded-[34px] border border-white/[0.05] bg-white/[0.045] p-10 text-center backdrop-blur-xl">
            <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-[28px] bg-white/[0.04] text-violet-400">
              <Package size={36} />
            </div>

            <h3 className="text-2xl font-black tracking-[-0.05em] text-white">
              No orders found
            </h3>

            <p className="mt-2 text-sm font-semibold text-white/45">
              Try adjusting your search or filter.
            </p>
          </section>
        ) : (
          <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {filteredOrders.map((o) => {
              const paid =
                o.status === "paid";

              const pending =
                o.status === "pending";

              return (
                <Link
                  key={o.id}
                  href={`/dashboard/orders/${o.id}`}
                  className="group"
                >
                  <article className="relative overflow-hidden rounded-[30px] border border-white/[0.05] bg-white/[0.045] p-4 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-violet-500/30 sm:p-5">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500/10 text-violet-400">
                          <ShoppingBag size={20} />
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                            Order
                          </p>

                          <p className="font-mono text-xs font-black text-white/50">
                            #{o.id.slice(0, 6)}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black ${
                          paid
                            ? "bg-emerald-500/10 text-emerald-400"
                            : pending
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-white/10 text-white/50"
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

                    <h3 className="line-clamp-2 text-base font-black leading-5 tracking-[-0.035em] text-white transition group-hover:text-violet-300">
                      {o.product.title}
                    </h3>

                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                          Total
                        </p>

                        <p className="mt-1 text-xl font-black tracking-[-0.04em] text-violet-400">
                          {o.product.currency}{" "}
                          {o.product.price}
                        </p>
                      </div>

                      <p className="text-xs font-bold text-white/40">
                        {new Date(
                          o.created_at
                        ).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-white/[0.05] pt-4">
                      <span className="text-sm font-black text-white/50 transition group-hover:text-violet-300">
                        View order
                      </span>

                      <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-500/10 text-violet-400 transition group-hover:translate-x-1 group-hover:bg-violet-600 group-hover:text-white">
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
    </main>
  );
}
