import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#03030a] text-white">
      <section className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(168,85,247,0.18),transparent_28%),radial-gradient(circle_at_24%_18%,rgba(239,68,68,0.16),transparent_24%),radial-gradient(circle_at_center,rgba(217,70,239,0.06),transparent_42%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,10,0.35)_0%,#03030a_100%)]" />

        <section className="relative w-full max-w-[520px] rounded-[32px] border border-white/10 bg-white/[0.04] p-6 text-center shadow-[0_0_60px_rgba(239,68,68,0.10)] backdrop-blur-2xl sm:p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-400/25 bg-rose-400/10 text-rose-300 shadow-[0_0_24px_rgba(251,113,133,0.14)]">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-7 w-7">
              <path
                d="M12 8v5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="M12 16.6h.01"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M10.29 4.86 3.82 16.06A2 2 0 0 0 5.55 19h12.9a2 2 0 0 0 1.73-2.94L13.71 4.86a2 2 0 0 0-3.42 0Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-rose-200">
            Payment not completed
          </div>

          <h1 className="text-3xl font-black uppercase leading-[0.92] tracking-tight sm:text-4xl">
            <span className="block text-white">Payment</span>
            <span className="block bg-gradient-to-r from-rose-300 via-fuchsia-400 to-orange-300 bg-clip-text text-transparent">
              unsuccessful
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/62 sm:text-[15px]">
            Your payment wasn't completed. You haven't been charged.
          </p>

          <div className="mt-7 flex flex-col gap-3">
            <Link
              href="/checkout"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-purple-600 px-5 py-3.5 text-sm font-black text-white shadow-[0_0_35px_rgba(244,63,94,0.25)] transition hover:scale-[1.01]"
            >
              Try again
            </Link>
            <Link
              href="/checkout"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-sm font-black text-white/72 transition hover:border-rose-400/30 hover:bg-white/[0.05] hover:text-white"
            >
              Return to cart
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
