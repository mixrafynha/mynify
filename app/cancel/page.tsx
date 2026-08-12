import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(246,247,249,1))] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <section className="w-full rounded-3xl border border-black/5 bg-white/90 p-6 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-7 w-7">
              <path
                d="M12 8v5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="M12 16.5h.01"
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

          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-3xl">
            Payment unsuccessful
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-[15px]">
            Your payment wasn't completed. You haven't been charged.
          </p>

          <div className="mt-7 grid gap-3">
            <Link
              href="/checkout"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
            >
              Try again
            </Link>
            <Link
              href="/checkout"
              className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
            >
              Return to cart
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
