"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Factory,
  Layers3,
  LockKeyhole,
  PackageCheck,
  Rocket,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  Wand2,
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
    desc: "Pick a t-shirt, hoodie, mug or another product from the Ryfio catalogue.",
    image: "/how/01-editor.webp",
    icon: Store,
  },
  {
    title: "Create your design",
    desc: "Use the editor, upload artwork or build a product with AI-assisted tools.",
    image: "/how/02-save-product.webp",
    icon: Wand2,
  },
  {
    title: "Preview and save",
    desc: "Review the mockup, check the design and save the final product.",
    image: "/how/03-preview.webp",
    icon: PackageCheck,
  },
  {
    title: "Checkout or sell",
    desc: "Order a sample, sell the product or prepare it for your next drop.",
    image: "/how/04-my-products.webp",
    icon: Rocket,
  },
]);

const BENEFITS = Object.freeze([
  {
    text: "No upfront inventory",
    desc: "Create and test products without buying stock first.",
    icon: Layers3,
  },
  {
    text: "Fast product creation",
    desc: "Move from idea to product preview in a few focused steps.",
    icon: Zap,
  },
  {
    text: "AI-assisted workflow",
    desc: "Use smarter tools to speed up design and product setup.",
    icon: Sparkles,
  },
  {
    text: "Secure checkout",
    desc: "A clean checkout flow built around trust and clarity.",
    icon: LockKeyhole,
  },
  {
    text: "Production-ready flow",
    desc: "Designed for print-on-demand fulfilment after purchase.",
    icon: Factory,
  },
  {
    text: "Built for real creators",
    desc: "Made for brands, creators, drops and product testing.",
    icon: ShieldCheck,
  },
]);

const FLOW = Object.freeze([
  {
    title: "Create the design",
    desc: "Choose a product and customize it inside Ryfio.",
    icon: Wand2,
  },
  {
    title: "Save the product",
    desc: "Keep the final design attached to your account.",
    icon: PackageCheck,
  },
  {
    title: "Review the cart",
    desc: "Check items, quantity, product details and totals.",
    icon: ShoppingCart,
  },
  {
    title: "Secure checkout",
    desc: "Enter shipping details and confirm the order safely.",
    icon: CreditCard,
  },
  {
    title: "Production begins",
    desc: "The order moves into print-on-demand production.",
    icon: Factory,
  },
  {
    title: "Tracked delivery",
    desc: "The product is packed, shipped and delivered.",
    icon: Truck,
  },
]);

export default function HowRyfioWorksPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#03030a] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.24),transparent_32%),radial-gradient(circle_at_85%_8%,rgba(14,165,233,0.14),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(217,70,239,0.10),transparent_34%)]"
      />

      {/* HERO */}
      <section className="relative mx-auto max-w-7xl px-4 pb-10 pt-20 sm:px-6 md:pb-14 md:pt-24 lg:px-8 lg:pt-28">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="text-center lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-purple-300 shadow-[0_0_34px_rgba(168,85,247,0.12)] backdrop-blur-xl">
              <Sparkles size={14} aria-hidden="true" />
              Create • Customize • Sell
            </div>

            <h1 className="mx-auto max-w-4xl text-[42px] font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-6xl md:text-7xl lg:mx-0 lg:text-8xl">
              How{" "}
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
                RYFIO
              </span>{" "}
              works
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/60 sm:text-base md:text-lg lg:mx-0">
              Build custom print-on-demand products with a fast editor, preview
              the final look, then order, test or sell without holding stock.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href={safeHref(CREATE_HREF)}
                className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 px-7 text-sm font-black text-white shadow-[0_0_34px_rgba(168,85,247,0.34)] transition active:scale-[0.98] sm:text-base md:hover:scale-[1.02]"
              >
                Create your product
                <Zap size={18} aria-hidden="true" />
              </Link>

              <Link
                href="/faq"
                className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-7 text-sm font-black text-white/75 backdrop-blur-xl transition active:scale-[0.98] hover:bg-white/[0.07] hover:text-white"
              >
                Read FAQ
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
              {["No stock", "AI tools", "Secure checkout", "Global fulfilment"].map((item) => (
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

          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <div className="rounded-[34px] border border-white/10 bg-white/[0.035] p-3 shadow-[0_0_80px_rgba(168,85,247,0.12)] backdrop-blur-2xl sm:p-4">
              <div className="relative h-[360px] overflow-hidden rounded-[28px] bg-black/25 sm:h-[430px] lg:h-[520px]">
                <Image
                  src="/how/01-editor.webp"
                  alt="Ryfio product editor preview"
                  fill
                  priority
                  quality={82}
                  sizes="(max-width: 768px) 92vw, 46vw"
                  className="object-contain"
                />
                <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-xl">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-300">
                    Step 01
                  </p>
                  <p className="mt-1 text-sm font-black text-white">
                    Start from the product catalogue
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
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
              <article
                key={item.title}
                className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] p-3 shadow-[0_0_28px_rgba(168,85,247,0.06)] backdrop-blur-xl transition md:hover:-translate-y-1 md:hover:border-purple-500/40 sm:p-4"
              >
                <div className="relative mb-4 flex h-[220px] items-center justify-center overflow-hidden rounded-[24px] bg-black/25 sm:h-[260px] lg:h-[300px] xl:h-[330px]">
                  <Image
                    src={item.image}
                    alt={safeText(item.title)}
                    fill
                    priority={index === 0}
                    quality={78}
                    sizes="(max-width: 640px) 92vw, (max-width: 1280px) 45vw, 23vw"
                    className="object-contain transition duration-300 md:group-hover:scale-[1.02]"
                  />

                  <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-xs font-black text-white/80 backdrop-blur-md">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-purple-500/25 bg-purple-500/10 text-purple-300">
                    <Icon size={18} aria-hidden="true" />
                  </div>

                  <div>
                    <h3 className="text-sm font-black uppercase text-white sm:text-base">
                      {safeText(item.title)}
                    </h3>

                    <p className="mt-1 text-xs leading-relaxed text-white/58 sm:text-sm">
                      {safeText(item.desc)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* FLOW */}
      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[34px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_0_70px_rgba(168,85,247,0.09)] backdrop-blur-xl sm:p-8">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-purple-300">
              Print-on-demand flow
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              From design to delivery, without the operational mess.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/55 sm:text-base">
              Ryfio connects product creation, cart review, secure checkout and
              print-on-demand fulfilment into one simple flow, so creators can
              focus on the product, brand and audience.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FLOW.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-purple-400/30 hover:bg-white/[0.045]"
                >
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-200">
                      <Icon size={20} aria-hidden="true" />
                    </div>

                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-black text-white/35">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-white/50">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:pb-24">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight md:text-5xl">
            Why creators trust Ryfio
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
            A cleaner way to create, test and sell custom products, with fewer
            risks, clearer checkout and a workflow designed for real commerce.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <div
                key={benefit.text}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition hover:border-purple-400/30 hover:bg-white/[0.05]"
              >
                <div className="mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-300">
                  <Icon size={22} aria-hidden="true" />
                </div>

                <h3 className="font-black leading-relaxed text-white">
                  {safeText(benefit.text)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/50">
                  {safeText(benefit.desc)}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-[34px] border border-white/10 bg-gradient-to-br from-purple-500/12 via-fuchsia-500/8 to-cyan-500/10 p-6 text-center shadow-[0_0_70px_rgba(168,85,247,0.10)] sm:p-8">
          <h2 className="text-2xl font-black sm:text-3xl">
            Ready to launch your first product with confidence?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/55">
            Start with one product, preview the design, review the cart and move
            through a cleaner checkout flow built for creators.
          </p>

          <div className="mt-6">
            <Link
              href={safeHref(CREATE_HREF)}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 px-7 text-sm font-black text-white shadow-[0_0_34px_rgba(168,85,247,0.34)] transition active:scale-[0.98] md:hover:scale-[1.02]"
            >
              Start creating now
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
