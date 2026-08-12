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
    <main className="min-h-screen overflow-hidden bg-[#03030a] text-white">
      <section className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(168,85,247,0.28),transparent_30%),radial-gradient(circle_at_24%_18%,rgba(14,165,233,0.14),transparent_22%),radial-gradient(circle_at_center,rgba(217,70,239,0.08),transparent_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,10,0.35)_0%,#03030a_100%)]" />

        <section className="relative w-full max-w-[520px] rounded-[32px] border border-white/10 bg-white/[0.04] p-6 text-center shadow-[0_0_60px_rgba(168,85,247,0.12)] backdrop-blur-2xl sm:p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-300 shadow-[0_0_24px_rgba(74,222,128,0.16)]">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-7 w-7">
              <path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
            Payment confirmed
          </div>

          <h1 className="text-3xl font-black uppercase leading-[0.92] tracking-tight sm:text-4xl">
            <span className="block text-white">Payment</span>
            <span className="block bg-gradient-to-r from-fuchsia-300 via-purple-400 to-cyan-300 bg-clip-text text-transparent">
              successful
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/62 sm:text-[15px]">
            Your order has been confirmed and is now being prepared.
          </p>

          {(order?.id || formattedTotal) && (
            <dl className="mt-6 grid gap-3 rounded-[26px] border border-white/10 bg-black/20 p-4 text-left text-sm">
              {order?.id && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="font-semibold text-white/45">Order number</dt>
                  <dd className="font-black tracking-[-0.02em] text-white">{order.id}</dd>
                </div>
              )}
              {formattedTotal && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="font-semibold text-white/45">Total paid</dt>
                  <dd className="font-black tracking-[-0.02em] text-white">{formattedTotal}</dd>
                </div>
              )}
            </dl>
          )}

          <div className="mt-7 flex flex-col gap-3">
            <Link
              href={orderHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 px-5 py-3.5 text-sm font-black text-white shadow-[0_0_35px_rgba(168,85,247,0.35)] transition hover:scale-[1.01]"
            >
              View my order
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-sm font-black text-white/72 transition hover:border-purple-500/30 hover:bg-white/[0.05] hover:text-white"
            >
              Continue shopping
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
