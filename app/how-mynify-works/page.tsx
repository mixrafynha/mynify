"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Gamepad2,
  PackageCheck,
  Rocket,
  Sparkles,
  Store,
  Truck,
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

const STEPS = Object.freeze([
  {
    icon: Sparkles,
    step: "01",
    title: "Create your product",
    desc: "Upload your design, customize products, and preview everything in real-time.",
  },
  {
    icon: Store,
    step: "02",
    title: "Publish your store",
    desc: "Launch your products instantly and start selling to customers worldwide.",
  },
  {
    icon: PackageCheck,
    step: "03",
    title: "We handle fulfillment",
    desc: "We print, pack, and ship orders directly to your customers — hassle-free.",
  },
  {
    icon: Rocket,
    step: "04",
    title: "Scale your business",
    desc: "Focus on marketing and growth while we handle operations behind the scenes.",
  },
]);

const BENEFITS = Object.freeze([
  "No inventory needed",
  "Global shipping",
  "Easy product customization",
  "Automated fulfillment",
  "Scalable infrastructure",
  "Built for gamer brands",
]);

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#03030a] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_32%,rgba(168,85,247,0.35),transparent_28%),radial-gradient(circle_at_58%_52%,rgba(14,165,233,0.25),transparent_24%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,10,0.35)_0%,#03030a_100%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 text-center md:px-8 lg:px-12 lg:pt-28">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-500/60 bg-purple-500/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-white/85 shadow-[0_0_22px_rgba(168,85,247,0.35)]">
            <Gamepad2 size={15} className="text-purple-400" />
            Made for creators & gamers
          </div>

          <h1 className="mx-auto mb-6 max-w-5xl text-5xl font-black uppercase leading-[0.9] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            How{" "}
            <span className="bg-gradient-to-r from-violet-300 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
              MYNIFY
            </span>{" "}
            works
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg md:text-xl">
            Start your custom product business in just a few simple steps — create,
            sell, and grow without inventory.
          </p>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={safeHref("/login")}
              className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-8 py-4 font-bold text-white shadow-[0_0_35px_rgba(168,85,247,0.55)] transition hover:scale-105"
            >
              Start now
              <Zap size={18} />
            </Link>

            <Link
              href={safeHref("/contact")}
              className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-bold text-white/90 backdrop-blur-xl transition hover:border-purple-500/40 hover:bg-white/10"
            >
              Contact us
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="relative bg-[#03030a] py-16 sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.16),transparent_28%)]" />

        <div className="relative mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
          <div className="mb-10 flex items-center gap-4">
            <div className="h-[2px] w-10 bg-purple-500 sm:w-12" />
            <h2 className="text-xl font-black uppercase italic tracking-tight sm:text-2xl md:text-3xl">
              The process
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {STEPS.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.step}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-8 shadow-[0_0_30px_rgba(168,85,247,0.08)] transition duration-300 hover:-translate-y-1 hover:border-purple-500/45 hover:bg-purple-500/10"
                >
                  <div className="absolute right-6 top-5 text-6xl font-black text-white/[0.04]">
                    {safeText(item.step)}
                  </div>

                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-300 shadow-[0_0_24px_rgba(168,85,247,0.22)]">
                    <Icon size={28} />
                  </div>

                  <p className="mb-2 text-sm font-black uppercase tracking-widest text-fuchsia-400">
                    Step {safeText(item.step)}
                  </p>

                  <h3 className="mb-3 text-2xl font-black text-white">
                    {safeText(item.title)}
                  </h3>

                  <p className="leading-relaxed text-white/60">
                    {safeText(item.desc)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* VISUAL FLOW */}
      <section className="relative overflow-hidden bg-[#05050d] py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_45%,rgba(14,165,233,0.18),transparent_25%),radial-gradient(circle_at_15%_30%,rgba(168,85,247,0.22),transparent_28%)]" />

        <div className="relative mx-auto max-w-6xl px-4 text-center md:px-8 lg:px-12">
          <h2 className="mb-8 text-3xl font-black uppercase md:text-5xl">
            Simple. Fast. Powerful.
          </h2>

          <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl sm:grid-cols-4">
            {["Create", "Sell", "We fulfill", "You grow 🚀"].map((item, index) => (
              <div
                key={item}
                className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-5 font-bold text-white/80"
              >
                <span>{safeText(item)}</span>
                {index < 3 && (
                  <ArrowRight className="hidden text-purple-400 sm:block" size={18} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="relative bg-[#03030a] py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.14),transparent_38%)]" />

        <div className="relative mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
          <div className="mb-10 text-center">
            <div className="mb-4 text-sm font-black uppercase tracking-widest text-purple-400">
              Why MYNIFY?
            </div>

            <h2 className="text-4xl font-black uppercase leading-tight md:text-6xl">
              Built to help you sell
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-white/75 shadow-[0_0_30px_rgba(168,85,247,0.08)] transition hover:border-purple-500/40 hover:bg-purple-500/10"
              >
                <CheckCircle2 className="shrink-0 text-purple-400" size={24} />
                <span className="font-semibold">{safeText(benefit)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#03030a] py-28 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.35),transparent_45%)]" />

        <div className="relative mx-auto max-w-5xl px-4 md:px-8 lg:px-12">
          <h2 className="mb-6 text-4xl font-black uppercase leading-tight tracking-tight md:text-6xl">
            Ready to{" "}
            <span className="bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
              start?
            </span>
          </h2>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/60 md:text-xl">
            Launch your brand and start selling custom products today.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={safeHref("/login")}
              className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-10 py-4 text-lg font-bold text-white shadow-[0_0_35px_rgba(168,85,247,0.55)] transition hover:scale-105"
            >
              Start now
              <Rocket size={20} />
            </Link>

            <Link
              href={safeHref("/contact")}
              className="rounded-2xl border border-white/15 px-10 py-4 text-lg text-white transition hover:border-purple-500/40 hover:bg-white/10"
            >
              Contact us
            </Link>
          </div>

          <p className="mt-6 text-sm text-white/35">
            No credit card required • Free to start
          </p>
        </div>
      </section>
    </main>
  );
}
