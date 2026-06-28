"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BadgePercent,
  CheckCircle2,
  Gift,
  Rocket,
  ShieldCheck,
  Sparkles,
  TicketPercent,
  Users,
  Zap,
} from "lucide-react";

const benefits = [
  "Exclusive Ryfio promo codes",
  "Creator launch discounts",
  "Limited-time product offers",
  "Early access to new tools",
];

const steps = [
  {
    title: "Create your account",
    text: "Join Ryfio and access creator tools, product design and checkout features.",
  },
  {
    title: "Apply a promo code",
    text: "Use an active code during checkout or inside eligible promotional flows.",
  },
  {
    title: "Launch faster",
    text: "Use discounts to test products, create samples and move quicker.",
  },
];

const promos = [
  {
    code: "RYFIOSTART",
    title: "Creator launch code",
    text: "A starter promo for new creators testing their first products.",
    status: "Coming soon",
  },
  {
    code: "SAMPLE10",
    title: "Sample order discount",
    text: "Designed for creators ordering samples before publishing products.",
    status: "Coming soon",
  },
  {
    code: "DROP20",
    title: "Product drop campaign",
    text: "Seasonal promo support for limited product launches.",
    status: "Coming soon",
  },
];

export default function PromoPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#03030a] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_4%,rgba(168,85,247,0.24),transparent_30%),radial-gradient(circle_at_85%_8%,rgba(14,165,233,0.16),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(217,70,239,0.10),transparent_32%)]"
      />

      <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8 lg:pt-28">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-purple-300 shadow-[0_0_34px_rgba(168,85,247,0.12)] backdrop-blur-xl">
              <TicketPercent size={15} />
              Ryfio Promo Codes
            </div>

            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-7xl">
              Save more when you launch with Ryfio.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/58 sm:text-lg">
              Access creator discounts, product sample offers and limited-time
              promo codes built for print-on-demand creators who want to test,
              launch and grow faster.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 px-6 py-4 text-sm font-black text-white shadow-[0_0_34px_rgba(168,85,247,0.34)] transition hover:scale-[1.02]"
              >
                Start with Ryfio
                <ArrowUpRight size={16} />
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-black text-white/75 backdrop-blur-xl transition hover:bg-white/[0.07] hover:text-white"
              >
                Ask about offers
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {benefits.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-white/45"
                >
                  <CheckCircle2 size={14} className="text-purple-300/80" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[36px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_0_80px_rgba(168,85,247,0.12)] backdrop-blur-2xl sm:p-7">
            <div className="rounded-[28px] border border-purple-400/20 bg-gradient-to-br from-purple-500/15 via-fuchsia-500/10 to-cyan-500/10 p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-200">
                <Gift size={28} />
              </div>

              <h2 className="mt-6 text-2xl font-black">Creator Promo Access</h2>
              <p className="mt-3 text-sm leading-7 text-white/55">
                Promo codes will appear here when they are active. Some codes
                may be limited by account, region, product type, order value or
                campaign period.
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/35">
                  Example Code
                </p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <code className="rounded-xl bg-white/[0.06] px-4 py-3 text-sm font-black text-purple-200">
                    RYFIOSTART
                  </code>
                  <span className="rounded-full bg-white/[0.06] px-3 py-2 text-xs font-bold text-white/45">
                    Soon
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {promos.map((promo) => (
            <article
              key={promo.code}
              className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_55px_rgba(168,85,247,0.08)] backdrop-blur-xl"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-200">
                  <BadgePercent size={22} />
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white/45">
                  {promo.status}
                </span>
              </div>

              <h3 className="text-xl font-black">{promo.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/55">{promo.text}</p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">
                  Code
                </p>
                <p className="mt-2 font-black text-purple-200">{promo.code}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {steps.map((step, index) => (
            <article
              key={step.title}
              className="rounded-[30px] border border-white/10 bg-white/[0.025] p-6 backdrop-blur-xl"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-purple-200">
                {index === 0 ? <Users size={21} /> : index === 1 ? <Zap size={21} /> : <Rocket size={21} />}
              </div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-purple-300/80">
                Step {index + 1}
              </p>
              <h3 className="text-xl font-black">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/55">{step.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-[34px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_0_70px_rgba(168,85,247,0.10)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
                <ShieldCheck size={14} />
                Fair use
              </div>
              <h2 className="text-2xl font-black">Promo terms</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">
                Promo codes may expire, be limited to selected products, regions
                or users, and may not be combinable with other offers. Ryfio may
                modify or end promotional campaigns at any time where permitted
                by law.
              </p>
            </div>

            <Link
              href="/terms"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/75 transition hover:bg-white/[0.07] hover:text-white"
            >
              Read Terms
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
