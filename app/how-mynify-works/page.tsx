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

const CREATE_HREF = "/dashboard/create";

const safeHref = (href: string) => {
  if (typeof href !== "string") return "/";
  const clean = href.trim().toLowerCase();

  if (clean.startsWith("javascript:") || clean.startsWith("data:")) {
    return "/";
  }

  return href.trim() || "/";
};

const safeText = (val: unknown) => {
  if (typeof val !== "string") return "";

  return val
    .replace(/<script.*?>.*?<\/script>/gi, "")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

const STEPS = Object.freeze([
  {
    title: "Choose a product",
    desc: "Start with a hoodie, t-shirt, cap, mug or another product.",
    image: "/how/01-editor.webp",
    icon: Store,
  },
  {
    title: "Create your design",
    desc: "Use AI, upload your artwork, or customize the product your way.",
    image: "/how/02-save-product.webp",
    icon: Sparkles,
  },
  {
    title: "Preview the final look",
    desc: "Check the mockup, make changes, and get your product ready.",
    image: "/how/03-preview.webp",
    icon: PackageCheck,
  },
  {
    title: "Sell or order",
    desc: "Publish it online, sell through Mynify or Shopify, or buy it for yourself.",
    image: "/how/04-my-products.webp",
    icon: Rocket,
  },
]);

const BENEFITS = Object.freeze([
  "Start free — no upfront costs",
  "Create products in minutes",
  "Use AI or upload your own design",
  "Sell without inventory or shipping headaches",
  "Sell on Mynify or Shopify",
  "Order products for yourself anytime",
]);

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#03030a] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden px-4 py-14 text-center md:px-8 lg:px-12 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.28),transparent_34%),linear-gradient(180deg,#03030a_0%,#050511_60%,#03030a_100%)]" />

        <div className="relative mx-auto max-w-5xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/80">
            <Sparkles size={14} className="text-purple-400" aria-hidden="true" />
            Create • Customize • Sell
          </div>

          <h1 className="mx-auto max-w-4xl text-[42px] font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-6xl md:text-7xl lg:text-8xl">
            How{" "}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
              MYNIFY
            </span>{" "}
            works
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-lg md:text-xl">
            Create custom products, preview them instantly, then sell online or
            order your own design.
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              href={safeHref(CREATE_HREF)}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-8 font-bold text-white shadow-[0_0_28px_rgba(168,85,247,0.35)] transition hover:scale-[1.02]"
            >
              Create your product
              <Zap size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="relative bg-[#03030a] px-4 py-10 md:px-8 lg:px-12 lg:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.14),transparent_28%)]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-8 flex items-center gap-4">
            <div className="h-[2px] w-10 bg-purple-500 sm:w-12" />
            <h2 className="text-xl font-black uppercase italic tracking-tight sm:text-2xl md:text-3xl">
              From idea to product
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="group overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.035] p-3 shadow-[0_0_20px_rgba(168,85,247,0.06)] transition duration-300 hover:-translate-y-1 hover:border-purple-500/40 sm:p-4"
                >
                  <div className="relative mb-4 flex h-[240px] items-center justify-center overflow-hidden rounded-[22px] bg-black/20 sm:h-[290px] lg:h-[340px]">
                    <Image
                      src={item.image}
                      alt={safeText(item.title)}
                      fill
                      priority={index === 0}
                      quality={82}
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                      className="object-contain transition duration-300 group-hover:scale-[1.02]"
                    />

                    <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-xs font-black text-white/80 backdrop-blur-md">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-purple-500/25 bg-purple-500/10 text-purple-300">
                      <Icon size={18} aria-hidden="true" />
                    </div>

                    <div>
                      <h3 className="text-sm font-black uppercase text-white sm:text-lg">
                        {safeText(item.title)}
                      </h3>

                      <p className="mt-1 text-xs leading-relaxed text-white/58 sm:text-sm">
                        {safeText(item.desc)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mx-auto mt-8 flex max-w-3xl items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4 text-center text-sm font-semibold text-white/65">
            No inventory. No upfront costs. Create once, then sell or order.
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="relative bg-[#03030a] px-4 py-12 md:px-8 lg:px-12">
        <div className="mx-auto mb-8 max-w-7xl text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight md:text-5xl">
            Why creators choose Mynify
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/55">
            Create products fast, customize your way, and sell without inventory.
          </p>
        </div>

        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <div
              key={benefit}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5"
            >
              <CheckCircle2 className="shrink-0 text-purple-400" size={22} />

              <span className="font-semibold leading-relaxed text-white/85">
                {safeText(benefit)}
              </span>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl justify-center">
          <Link
            href={safeHref(CREATE_HREF)}
            className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-fuchsia-300 transition hover:text-white"
          >
            Start creating now
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
