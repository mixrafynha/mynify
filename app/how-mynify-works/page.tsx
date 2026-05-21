"use client";

import Image from "next/image";
import Link from "next/link";
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
  if (clean.startsWith("javascript:") || clean.startsWith("data:")) return "/";
  return href.trim() || "/";
};

const safeText = (val: unknown) => {
  if (typeof val !== "string") return "";
  return val.replace(/<script.*?>.*?<\/script>/gi, "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

const STEPS = Object.freeze([
  {
    step: "01",
    title: "Create in the editor",
    desc: "Generate or upload a design and place it on your product.",
    image: "/how/01-editor.webp",
    icon: Sparkles,
  },
  {
    step: "02",
    title: "Save as a product",
    desc: "Choose the product type and save your design as a real item.",
    image: "/how/02-save-product.webp",
    icon: Store,
  },
  {
    step: "03",
    title: "Preview & edit",
    desc: "Check the final mockup and adjust it before publishing.",
    image: "/how/03-preview.webp",
    icon: PackageCheck,
  },
  {
    step: "04",
    title: "Manage products",
    desc: "Publish, track and manage everything from your dashboard.",
    image: "/how/04-my-products.webp",
    icon: Rocket,
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
      <section className="relative overflow-hidden px-4 py-14 text-center md:px-8 lg:px-12 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.28),transparent_34%),linear-gradient(180deg,#03030a_0%,#050511_60%,#03030a_100%)]" />

        <div className="relative mx-auto max-w-5xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/80">
            <Sparkles size={14} className="text-purple-400" />
            Simple. Fast. Powerful.
          </div>

          <h1 className="mx-auto max-w-4xl text-[42px] font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-6xl md:text-7xl lg:text-8xl">
            How{" "}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
              MYNIFY
            </span>{" "}
            works
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-lg md:text-xl">
            Create a product with AI, preview the final mockup and publish it from your dashboard.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={safeHref("/login")}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-8 font-bold text-white shadow-[0_0_28px_rgba(168,85,247,0.35)] transition hover:scale-[1.02]"
            >
              Start free
              <Zap size={18} />
            </Link>

            <Link
              href={safeHref("/catalog")}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-8 font-bold text-white/85 transition hover:border-purple-500/40 hover:bg-white/[0.08]"
            >
              View catalog
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="relative bg-[#03030a] px-4 py-10 md:px-8 lg:px-12 lg:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.14),transparent_28%)]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.step}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-4 shadow-[0_0_24px_rgba(168,85,247,0.08)] transition duration-300 hover:-translate-y-1 hover:border-purple-500/40 sm:p-5"
                >
                  <div className="relative mb-5 aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                    <Image
                      src={item.image}
                      alt={safeText(item.title)}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 text-base font-black text-white shadow-[0_0_22px_rgba(168,85,247,0.4)]">
                      {safeText(item.step)}
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-purple-500/25 bg-purple-500/10 text-purple-300">
                      <Icon size={21} />
                    </div>
                  </div>

                  <h3 className="mb-2 text-xl font-black uppercase text-white">
                    {safeText(item.title)}
                  </h3>

                  <p className="text-sm leading-relaxed text-white/58">
                    {safeText(item.desc)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mx-auto mt-8 flex max-w-3xl items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4 text-center text-sm font-semibold text-white/65">
            No inventory. No upfront costs. Just your creativity.
          </div>
        </div>
      </section>

      <section className="relative bg-[#03030a] px-4 py-12 md:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <div
              key={benefit}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5"
            >
              <CheckCircle2 className="shrink-0 text-purple-400" size={22} />
              <span className="font-bold text-white/80">{safeText(benefit)}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
