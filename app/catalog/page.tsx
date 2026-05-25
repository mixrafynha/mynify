"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles, Zap } from "lucide-react";

const safeHref = (href: string) => {
  if (typeof href !== "string") return "/";
  const clean = href.trim().toLowerCase();
  if (clean.startsWith("javascript:") || clean.startsWith("data:")) return "/";
  return href.trim() || "/";
};

const safeText = (val: unknown) => {
  if (typeof val !== "string") return "";
  return val
    .replace(/<script.*?>.*?<\/script>/gi, "")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

type Product = {
  name: string;
  price: string;
  image: string;
  category: string;
};

const products: {
  tshirts: Product[];
  hoodies: Product[];
  accessories: Product[];
} = {
  tshirts: [
    { name: "Cyber Wolf", price: "€24.99", image: "/catalog/cyber-wolf-shirt.webp", category: "tshirt" },
    { name: "Samurai Mask", price: "€24.99", image: "/catalog/samurai-shirt.webp", category: "tshirt" },
    { name: "Red Sun Temple", price: "€24.99", image: "/catalog/red-sun-shirt.webp", category: "tshirt" },
    { name: "XO Drip", price: "€24.99", image: "/catalog/xo-shirt.webp", category: "tshirt" },
  ],

  hoodies: [
    { name: "Purple Dragon", price: "€49.99", image: "/catalog/purple-dragon-hoodie.webp", category: "hoodie" },
    { name: "Create Your Legacy", price: "€49.99", image: "/catalog/legacy-hoodie.webp", category: "hoodie" },
    { name: "Rise Warrior", price: "€49.99", image: "/catalog/rise-hoodie.webp", category: "hoodie" },
    { name: "Angel Baby", price: "€44.99", image: "/catalog/angel-sweatshirt.webp", category: "hoodie" },
  ],

  accessories: [
    { name: "Astronaut Tote Bag", price: "€19.99", image: "/catalog/astronaut-tote.webp", category: "tote" },
    { name: "Level Up Mug", price: "€14.99", image: "/catalog/level-up-mug.webp", category: "mug" },
    { name: "X Smile Cap", price: "€19.99", image: "/catalog/x-smile-cap.webp", category: "cap" },
    { name: "Skull Reaper Case", price: "€15.99", image: "/catalog/skull-phone.webp", category: "phonecase" },
  ],
};

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={safeHref(`/dashboard/design/${product.category}`)}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-3 shadow-[0_0_30px_rgba(168,85,247,0.08)] transition duration-300 hover:-translate-y-1 hover:border-purple-500/40"
    >
      <div className="relative mb-4 h-[210px] overflow-hidden rounded-xl bg-black/40 sm:h-[260px]">
        <Image
          src={product.image}
          alt={safeText(product.name)}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </div>

      <h3 className="text-sm font-black text-white sm:text-base">
        {safeText(product.name)}
      </h3>

      <p className="mt-1 text-sm font-bold text-white/70">
        {safeText(product.price)}
      </p>

      <div className="mt-4 flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 font-bold text-white transition group-hover:scale-[1.02]">
        Design now
      </div>
    </Link>
  );
}

function ProductSection({
  title,
  items,
  category,
}: {
  title: string;
  items: Product[];
  category: string;
}) {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-8 md:px-8 lg:px-12">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-3xl font-black uppercase tracking-tight md:text-5xl">
          {title}
        </h2>

        <Link
          href={safeHref(`/dashboard/design/${category}`)}
          className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white/80 transition hover:border-purple-500/40 sm:inline-flex"
        >
          Design now <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.name} product={p} />
        ))}
      </div>
    </section>
  );
}

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#03030a] text-white">
      <section className="relative overflow-hidden px-4 py-12 md:px-8 lg:px-12 lg:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.26),transparent_32%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-500/35 bg-purple-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/80">
            <Sparkles size={14} className="text-purple-400" />
            AI-powered products
          </div>

          <h1 className="mx-auto max-w-4xl text-[40px] font-black uppercase leading-[0.9] tracking-[-0.04em] text-white sm:text-6xl md:text-7xl">
            Create products.
            <span className="block bg-gradient-to-r from-purple-400 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
              Sell your brand.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-lg md:text-xl">
            Generate designs with AI, place them on products and start selling without inventory.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={safeHref("/dashboard/design/tshirt")}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-8 font-bold text-white shadow-[0_0_28px_rgba(168,85,247,0.35)] transition hover:scale-[1.02]"
            >
              Start designing
              <Zap size={18} />
            </Link>

            <Link
              href={safeHref("/dashboard/design/hoodie")}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-8 font-bold text-white/85 transition hover:border-purple-500/40 hover:bg-white/[0.08]"
            >
              Design hoodie
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold text-white/55">
            <span>10 free AI generations</span>
            <span className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" />
            <span>No inventory</span>
            <span className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" />
            <span>Global shipping</span>
          </div>
        </div>
      </section>

      <ProductSection title="T-Shirts" items={products.tshirts} category="tshirt" />
      <ProductSection title="Hoodies & Sweatshirts" items={products.hoodies} category="hoodie" />
      <ProductSection title="Accessories" items={products.accessories} category="cap" />

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8 lg:px-12">
        <div className="rounded-3xl border border-purple-500/20 bg-purple-500/10 p-8 md:flex md:items-center md:justify-between">
          <div className="mb-6 md:mb-0">
            <h2 className="text-3xl font-black md:text-4xl">
              Ready to create{" "}
              <span className="bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
                your own products?
              </span>
            </h2>
            <p className="mt-3 text-white/60">
              Start with 10 free AI generations and publish your first product.
            </p>
          </div>

          <Link
            href={safeHref("/dashboard/design/tshirt")}
            className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-8 py-4 font-bold text-white shadow-[0_0_35px_rgba(168,85,247,0.45)]"
          >
            Start designing now <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-16 sm:grid-cols-2 md:grid-cols-4 md:px-8 lg:px-12">
        {[
          "10 free AI generations",
          "No inventory needed",
          "Global shipping",
          "Secure payments",
        ].map((benefit) => (
          <div
            key={benefit}
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5"
          >
            <CheckCircle2 className="text-purple-400" size={22} />
            <span className="font-bold text-white/80">
              {safeText(benefit)}
            </span>
          </div>
        ))}
      </section>
    </main>
  );
}
