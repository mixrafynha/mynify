"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  PackageCheck,
  Rocket,
  Sparkles,
  Store,
  Zap,
} from "lucide-react";

const safeHref = (href: string) => {
  if (typeof href !== "string") return "/";
  const clean = href.trim().toLowerCase();
  if (clean.startsWith("javascript:")) return "/";
  if (clean.startsWith("data:")) return "/";
  return href.trim() || "/";
};

const safeText = (val: unknown) => {
  if (typeof val !== "string") return "";
  return val.replace(/<script.*?>.*?<\/script>/gi, "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

const STEPS = Object.freeze([
  {
    icon: Sparkles,
    step: "01",
    title: "Describe your idea",
    desc: "Tell Mynify what you want to create and turn your idea into a product concept.",
  },
  {
    icon: Store,
    step: "02",
    title: "AI creates the design",
    desc: "Generate product visuals with AI and customize them before publishing.",
  },
  {
    icon: PackageCheck,
    step: "03",
    title: "Publish your product",
    desc: "Launch your product page and start selling without handling inventory.",
  },
  {
    icon: Rocket,
    step: "04",
    title: "Grow your brand",
    desc: "Focus on marketing while Mynify helps you create, sell and scale.",
  },
]);

const BENEFITS = Object.freeze([
  "10 free AI generations",
  "No inventory needed",
  "Global shipping",
  "AI product creation",
  "Easy customization",
  "Free to start",
]);

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#03030a] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_32%,rgba(168,85,247,0.35),transparent_28%),radial-gradient(circle_at_58%_52%,rgba(14,165,233,0.25),transparent_24%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,10,0.35)_0%,#03030a_100%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 text-center md:px-8 lg:px-12 lg:pb-20 lg:pt-28">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-500/60 bg-purple-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/85 shadow-[0_0_22px_rgba(168,85,247,0.35)] sm:text-xs">
            <Sparkles size={15} className="text-purple-400" />
            Create products with AI
          </div>

          <h1 className="mx-auto mb-6 max-w-5xl text-4xl font-black uppercase leading-[0.9] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            How{" "}
            <span className="bg-gradient-to-r from-violet-300 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
              MYNIFY
            </span>{" "}
            works
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg md:text-xl">
            Turn an idea into a product with AI, launch your store and start selling — no inventory or design skills needed.
          </p>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={safeHref("/login")}
              className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-8 py-4 font-bold text-white shadow-[0_0_35px_rgba(168,85,247,0.55)] transition hover:scale-105"
            >
              Start free
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

          <p className="mt-5 text-sm text-white/40">
            No credit card required • 10 free AI generations
          </p>
        </div>
      </section>

      {/* STEPS */}
      <section className="relative bg-[#03030a] py-14 sm:py-20">
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
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-[0_0_30px_rgba(168,85,247,0.08)] transition duration-300 hover:-translate-y-1 hover:border-purple-500/45 hover:bg-purple-500/10 sm:p-8"
                >
                  <div className="absolute right-5 top-4 text-5xl font-black text-white/[0.04] sm:text-6xl">
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

      {/* VISUAL DEMO */}
      <section className="relative overflow-hidden bg-[#05050d] py-16 sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_45%,rgba(14,165,233,0.18),transparent_25%),radial-gradient(circle_at_15%_30%,rgba(168,85,247,0.22),transparent_28%)]" />

        <div className="relative mx-auto max-w-6xl px-4 text-center md:px-8 lg:px-12">
          <div className="mb-4 text-sm font-black uppercase tracking-widest text-purple-400">
            Live example
          </div>

          <h2 className="mb-4 text-3xl font-black uppercase md:text-5xl">
            From prompt to product
          </h2>

          <p className="mx-auto mb-10 max-w-2xl text-white/60">
            Write what you want to create, generate the design with AI, then publish it as a real product.
          </p>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 text-left shadow-[0_0_30px_rgba(168,85,247,0.08)] sm:p-6">
              <div className="mb-4 inline-flex rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-purple-300">
                Step 01
              </div>

              <h3 className="mb-3 text-2xl font-black text-white">
                Describe your idea
              </h3>

              <p className="mb-5 text-white/60">
                Start with a simple product prompt.
              </p>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="mb-2 text-xs font-black uppercase tracking-widest text-purple-400">
                  Example prompt
                </p>

                <p className="text-white/85">
                  “Streetwear hoodie with a cyber dragon design”
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-5 text-left shadow-[0_0_30px_rgba(168,85,247,0.08)] sm:p-6">
              <div className="mb-4 inline-flex rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-purple-300">
                Step 02
              </div>

              <h3 className="mb-3 text-2xl font-black text-white">
                AI creates the design
              </h3>

              <p className="mb-5 text-white/60">
                Generate a visual you can use on products.
              </p>

              <div className="relative h-[220px] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                <Image
                  src="/demo-design.png"
                  alt="AI generated product design"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-5 text-left shadow-[0_0_30px_rgba(168,85,247,0.08)] sm:p-6">
              <div className="mb-4 inline-flex rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-fuchsia-300">
                Step 03
              </div>

              <h3 className="mb-3 text-2xl font-black text-white">
                Launch & sell
              </h3>

              <p className="mb-5 text-white/60">
                Turn the design into a product ready to publish.
              </p>

              <div className="relative h-[220px] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                <Image
                  src="/demo-product.png"
                  alt="Final product preview"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href={safeHref("/login")}
              className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-8 py-4 font-bold text-white shadow-[0_0_35px_rgba(168,85,247,0.45)] transition hover:scale-105"
            >
              Try it free
              <Zap size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="relative bg-[#03030a] py-16 sm:py-20">
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
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-white/75 shadow-[0_0_30px_rgba(168,85,247,0.08)] transition hover:border-purple-500/40 hover:bg-purple-500/10 sm:p-6"
              >
                <CheckCircle2 className="shrink-0 text-purple-400" size={24} />
                <span className="font-semibold">{safeText(benefit)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#03030a] py-20 text-center sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.35),transparent_45%)]" />

        <div className="relative mx-auto max-w-5xl px-4 md:px-8 lg:px-12">
          <h2 className="mb-6 text-4xl font-black uppercase leading-tight tracking-tight md:text-6xl">
            Ready to{" "}
            <span className="bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
              start?
            </span>
          </h2>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/60 md:text-xl">
            Create your first AI product and start building your brand today.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={safeHref("/login")}
              className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-10 py-4 text-lg font-bold text-white shadow-[0_0_35px_rgba(168,85,247,0.55)] transition hover:scale-105"
            >
              Start free
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
