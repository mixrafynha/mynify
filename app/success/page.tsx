import Link from "next/link";
import { supabase } from "@/lib/supabase";

type SuccessPageProps = {
  searchParams: {
    session_id?: string;
    order_id?: string;
  };
};

function formatMoney(value: number | string | null | undefined, currency: string | null | undefined) {
  const amount = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(amount ?? NaN)) return null;

  const resolvedCurrency = String(currency ?? "EUR").toUpperCase();
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: resolvedCurrency,
    maximumFractionDigits: 2,
  }).format(amount as number);
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const sessionId = searchParams.session_id ?? null;
  const orderId = searchParams.order_id ?? null;

  let order:
    | {
        id: string;
        total: number | null;
        currency: string | null;
      }
    | null = null;

  if (sessionId || orderId) {
    const query = supabase.from("orders").select("id, total, currency").limit(1);

    const { data } = sessionId
      ? await query.eq("stripe_session_id", sessionId).maybeSingle()
      : await query.eq("id", orderId).maybeSingle();

    order = data ?? null;

    if (orderId && order) {
      await supabase.from("orders").update({ status: "paid" }).eq("id", order.id);
    }
  }

  const formattedTotal = formatMoney(order?.total ?? null, order?.currency ?? "EUR");
  const orderHref = order?.id ? `/dashboard/orders/${order.id}` : "/dashboard/orders";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),rgba(245,246,248,1))] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <section className="w-full rounded-3xl border border-black/5 bg-white/90 p-6 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-7 w-7"
            >
              <path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-3xl">
            Payment successful
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-[15px]">
            Your order has been confirmed and is now being prepared.
          </p>

          {(order?.id || formattedTotal) && (
            <dl className="mt-6 grid gap-3 rounded-2xl bg-slate-50/80 p-4 text-left text-sm text-slate-600">
              {order?.id && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="font-medium text-slate-500">Order number</dt>
                  <dd className="font-semibold tracking-[-0.02em] text-slate-900">{order.id}</dd>
                </div>
              )}
              {formattedTotal && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="font-medium text-slate-500">Total paid</dt>
                  <dd className="font-semibold tracking-[-0.02em] text-slate-900">{formattedTotal}</dd>
                </div>
              )}
            </dl>
          )}

          <div className="mt-7 grid gap-3">
            <Link
              href={orderHref}
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
            >
              View my order
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
            >
              Continue shopping
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
