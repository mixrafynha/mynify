"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Crown,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

/* ================= SECURITY HELPERS ================= */

const safeHref = (href: string) => {
  if (typeof href !== "string") return "/";
  const clean = href.trim().toLowerCase();

  if (clean.startsWith("javascript:")) return "/";
  if (clean.startsWith("data:")) return "/";

  return href;
};

const safeText = (val: unknown) => {
  if (typeof val !== "string") return "";

  return val
    .replace(/<script.*?>.*?<\/script>/gi, "")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

/* ================= DATA ================= */

const PLANS = Object.freeze([
  {
    icon: Sparkles,
    name: "Starter",
    price: "Free",
    desc: "Perfect to start your first products.",
    features: [
      "Basic product creation",
      "Limited store customization",
      "Community support",
    ],
    button: "Start free",
    highlight: false,
    href: "/signup",
  },
  {
    icon: Crown,
    name: "Pro",
    price: "€19 / month",
    desc: "Best for growing creators.",
    features: [
      "Unlimited products",
      "Advanced customization",
      "Priority support",
      "Discount codes",
    ],
    button: "Go Pro",
    highlight: true,
    href: "/signup",
  },
  {
    icon: ShieldCheck,
    name: "Business",
    price: "€49 / month",
    desc: "For serious brands and scaling stores.",
    features: [
      "Everything in Pro",
      "Automation tools",
      "Analytics dashboard",
      "Dedicated support",
    ],
    button: "Contact sales",
    highlight: false,
    href: "/contact",
  },
]);

export default function PricingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#03030a] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_32%,rgba(168,85,247,0.35),transparent_28%),radial-gradient(circle_at_58%_52%,rgba(14,165,233,0.25),transparent_24%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,10,0.35)_0%,#03030a_100%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 text-center md:px-8 lg:px-12 lg:pt-28">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-500/60 bg-purple-500/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-white/85 shadow-[0_0_22px_rgba(168,85,247,0.35)]">
            <Zap size={15} className="text-purple-400" />
            Flexible plans for every creator
          </div>

          <h1 className="mx-auto mb-6 max-w-5xl text-5xl font-black uppercase leading-[0.9] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            Simple{" "}
            <span className="bg-gradient-to-r from-violet-300 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
              pricing
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg md:text-xl">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>
        </div>
      </section>

      {/* PLANS */}
      <section className="relative bg-[#03030a] pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.16),transparent_28%)]" />

        <div className="relative mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
          <div className="grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => {
              const Icon = plan.icon;

              return (
                <div
                  key={plan.name}
                  className={`relative overflow-hidden rounded-3xl border p-8 transition duration-300 hover:-translate-y-1 ${
                    plan.highlight
                      ? "border-purple-500/50 bg-gradient-to-b from-purple-500/15 to-white/[0.03] shadow-[0_0_60px_rgba(168,85,247,0.22)]"
                      : "border-white/10 bg-white/[0.035] shadow-[0_0_30px_rgba(168,85,247,0.08)] hover:border-purple-500/40"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 px-3 py-1 text-xs font-black uppercase tracking-wide text-white shadow-[0_0_20px_rgba(168,85,247,0.45)]">
                      Most popular
                    </div>
                  )}

                  <div
                    className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border ${
                      plan.highlight
                        ? "border-purple-400/40 bg-purple-500/20 text-purple-200"
                        : "border-white/10 bg-white/5 text-purple-300"
                    }`}
                  >
                    <Icon size={28} />
                  </div>

                  <h2 className="mb-2 text-2xl font-black uppercase">
                    {safeText(plan.name)}
                  </h2>

                  <p className="mb-3 text-4xl font-black">
                    {safeText(plan.price)}
                  </p>

                  <p className="mb-8 text-white/60">
                    {safeText(plan.desc)}
                  </p>

                  <div className="mb-8 space-y-4">
                    {plan.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-3 text-white/75"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/15 text-purple-400">
                          <Check size={14} />
                        </div>

                        <span>{safeText(feature)}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href={safeHref(plan.href)}
                    className={`inline-flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 font-bold transition ${
                      plan.highlight
                        ? "bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white shadow-[0_0_35px_rgba(168,85,247,0.45)] hover:scale-105"
                        : "border border-white/10 bg-white/5 text-white hover:border-purple-500/40 hover:bg-purple-500/10"
                    }`}
                  >
                    {safeText(plan.button)}
                    <ArrowRight size={18} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* STRIP */}
      <section className="relative overflow-hidden bg-[#05050d] py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.14),transparent_40%)]" />

        <div className="relative mx-auto max-w-5xl px-4 text-center md:px-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-purple-300">
            <Star size={14} />
            Transparent pricing
          </div>

          <h3 className="mb-4 text-3xl font-black uppercase">
            No hidden fees
          </h3>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/60">
            You only pay when you grow. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#03030a] py-28 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.35),transparent_45%)]" />

        <div className="relative mx-auto max-w-5xl px-4 md:px-8 lg:px-12">
          <h2 className="mb-6 text-4xl font-black uppercase leading-tight tracking-tight md:text-6xl">
            Ready to{" "}
            <span className="bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
              start selling?
            </span>
          </h2>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/60 md:text-xl">
            Join thousands of creators building their brand with MYNIFY.
          </p>

          <Link
            href={safeHref("/signup")}
            className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-10 py-4 text-lg font-bold text-white shadow-[0_0_35px_rgba(168,85,247,0.55)] transition hover:scale-105"
          >
            Get started
            <Rocket size={20} />
          </Link>

          <p className="mt-6 text-sm text-white/35">
            No credit card required • Free to start
          </p>
        </div>
      </section>
    </main>
  );
}
