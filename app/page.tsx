"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback } from "react";
import {
  ArrowUpRight,
  Gamepad2,
  Headphones,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Zap,
} from "lucide-react";

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

const FEATURES = Object.freeze([
  {
    icon: Zap,
    title: "Fast creation",
    desc: "Customize your products in seconds with our editor.",
  },
  {
    icon: ShieldCheck,
    title: "Premium quality",
    desc: "High-quality products made to last.",
  },
  {
    icon: Truck,
    title: "Worldwide shipping",
    desc: "We deliver wherever you are, fast and secure.",
  },
  {
    icon: Headphones,
    title: "Made for gamers",
    desc: "Exclusive designs for people who live the game.",
  },
]);

const PRODUCTS = Object.freeze([
  {
    name: "Custom Gamer Hoodie",
    price: "€49.99",
    tag: "BEST SELLER",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=900&auto=format&fit=crop",
  },
  {
    name: "Premium Gamer T-Shirt",
    price: "€24.99",
    image:
      "https://images.unsplash.com/photo-1626160200951-fc4b4f8d4de9?q=80&w=900&auto=format&fit=crop",
  },
  {
    name: "Custom Gaming Poster",
    price: "€15.99",
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Custom Gamer Mug",
    price: "€14.99",
    image:
      "https://images.unsplash.com/photo-1614940403522-a8c829e7eb82?q=80&w=900&auto=format&fit=crop",
  },
]);

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80";

export default function HomePage() {
  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const target = e.currentTarget;
      if (target.src !== FALLBACK_IMAGE) target.src = FALLBACK_IMAGE;
    },
    []
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#03030a] text-white">
     {/* HERO */}
<section className="relative overflow-hidden">
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_32%,rgba(168,85,247,0.35),transparent_28%),radial-gradient(circle_at_58%_52%,rgba(14,165,233,0.25),transparent_24%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />
  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,10,0.35)_0%,#03030a_100%)] lg:bg-[linear-gradient(90deg,#03030a_0%,rgba(3,3,10,0.9)_34%,rgba(3,3,10,0.35)_72%,#03030a_100%)]" />

  <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-10 pt-14 sm:pt-16 md:px-8 lg:min-h-[690px] lg:grid-cols-2 lg:px-12 lg:pt-24">
    <div className="z-10 text-center lg:text-left">
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-500/60 bg-purple-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white/85 shadow-[0_0_22px_rgba(168,85,247,0.35)] sm:px-4 sm:text-xs">
        <Gamepad2 size={15} className="text-purple-400" />
        Made for gamers & streamers
      </div>

      <h1 className="mb-6 text-[48px] font-black uppercase leading-[0.88] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
        <span className="block">Customize.</span>
        <span className="block">Play.</span>
        <span className="block bg-gradient-to-r from-violet-300 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
          Stand out.
        </span>
      </h1>

      <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg md:text-xl lg:mx-0">
        Create unique products with your name, tag, or style and take your gamer identity to the next level.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
        <Link
          href={safeHref("/login")}
          className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-7 py-4 font-bold text-white shadow-[0_0_35px_rgba(168,85,247,0.55)] transition hover:scale-105"
        >
          Create my design
          <Zap size={18} />
        </Link>

        <Link
          href={safeHref("/login")}
          className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-7 py-4 font-bold text-white/90 backdrop-blur-xl transition hover:border-purple-500/40 hover:bg-white/10"
        >
          View products
          <ShoppingBag size={18} />
        </Link>
      </div>
    </div>

    {/* HERO IMAGE */}
    <div className="relative z-0 mx-auto h-[300px] w-full max-w-[520px] sm:h-[380px] md:h-[460px] lg:h-[560px] lg:max-w-none">
      <div className="absolute inset-0 rounded-full bg-purple-600/20 blur-[80px]" />

      <Link
        href={safeHref("/login")}
        className="absolute inset-0 overflow-visible lg:right-[-120px] lg:left-auto lg:w-[900px]"
      >
        <Image
          src="/hero2.png"
          alt="Mynify products"
          fill
          priority
          quality={100}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 900px"
          className="object-contain object-center drop-shadow-[0_0_55px_rgba(168,85,247,0.45)]"
        />
      </Link>
    </div>
  </div>

  {/* FEATURES BAR */}
  <div className="relative mx-auto max-w-7xl px-4 pb-12 md:px-8 lg:px-12">
    <div className="grid overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-[0_0_50px_rgba(168,85,247,0.12)] backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4">
      {FEATURES.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.title}
            href={safeHref("/login")}
            className="flex items-center gap-4 border-b border-white/10 p-5 transition hover:bg-purple-500/10 sm:p-6 lg:border-b-0 lg:border-r lg:p-7 lg:last:border-r-0"
          >
            <Icon
              className="shrink-0 text-purple-400 drop-shadow-[0_0_16px_rgba(168,85,247,0.85)]"
              size={38}
            />
            <div>
              <h3 className="mb-1 font-bold text-white">
                {safeText(item.title)}
              </h3>
              <p className="text-sm leading-relaxed text-white/55">
                {safeText(item.desc)}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  </div>
</section>

{/* POPULAR PRODUCTS */}
<section className="relative bg-[#03030a] py-16 sm:py-20">
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.16),transparent_28%)]" />

  <div className="relative mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
    <div className="mb-8 flex items-center gap-4">
      <div className="h-[2px] w-10 bg-purple-500 sm:w-12" />
      <h2 className="text-xl font-black uppercase italic tracking-tight sm:text-2xl md:text-3xl">
        Popular products
      </h2>
    </div>

    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {PRODUCTS.map((product) => (
        <Link
          key={product.name}
          href={safeHref("/login")}
          className="group relative min-h-[220px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-[0_0_30px_rgba(168,85,247,0.08)] transition duration-300 hover:-translate-y-1 hover:border-purple-500/45"
        >
          {"tag" in product && product.tag && (
            <div className="absolute left-4 top-4 z-20 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 px-3 py-1 text-xs font-black">
              {safeText(product.tag)}
            </div>
          )}

          <Image
            src={product.image}
            alt={safeText(product.name)}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onError={handleImageError}
            className="object-cover opacity-55 transition duration-500 group-hover:scale-110"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-transparent" />

          <div className="relative z-10 flex min-h-[220px] flex-col justify-end p-6">
            <h3 className="mb-5 max-w-[190px] font-bold text-white">
              {safeText(product.name)}
            </h3>

            <div className="flex items-center justify-between">
              <p className="text-lg font-black text-fuchsia-400">
                {safeText(product.price)}
              </p>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-purple-300 transition group-hover:bg-purple-500/20">
                <ArrowUpRight size={18} />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  </div>
</section>
      {/* CUSTOMIZATION */}
      <section className="relative overflow-hidden bg-[#05050d] py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_45%,rgba(14,165,233,0.18),transparent_25%),radial-gradient(circle_at_15%_30%,rgba(168,85,247,0.22),transparent_28%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 md:px-8 lg:grid-cols-2 lg:px-12">
          <Link
            href={safeHref("/login")}
            className="relative h-[360px] overflow-hidden rounded-[36px] border border-purple-500/20 shadow-[0_0_60px_rgba(168,85,247,0.18)] transition hover:scale-[1.01] md:h-[420px]"
          >
            <Image
              src="https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=1200&q=80"
              alt="Designing custom products"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover opacity-75"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/35 to-purple-600/20" />
          </Link>

          <div>
            <div className="mb-4 text-sm font-black uppercase tracking-widest text-purple-400">
              Customize
            </div>

            <h2 className="mb-6 text-4xl font-black uppercase leading-tight md:text-6xl">
              Create your gamer style
            </h2>

            <p className="mb-8 text-lg leading-relaxed text-white/60">
              Let your customers customize products with names, tags, colors, and unique visuals.
            </p>

            <div className="space-y-4 text-white/75">
              <Link href={safeHref("/login")} className="block transition hover:text-purple-300">
                ✔ Upload your own designs
              </Link>
              <Link href={safeHref("/login")} className="block transition hover:text-purple-300">
                ✔ Customize colors and styles
              </Link>
              <Link href={safeHref("/login")} className="block transition hover:text-purple-300">
                ✔ Preview before buying
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#03030a] py-28 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.35),transparent_45%)]" />

        <div className="relative mx-auto max-w-5xl px-4 text-center md:px-8 lg:px-12">
          <h2 className="mb-6 text-4xl font-black uppercase leading-tight tracking-tight md:text-6xl">
            Turn ideas into{" "}
            <span className="bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
              real products
            </span>
          </h2>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/60 md:text-xl">
            Start your gamer brand, sell custom products, and grow without inventory.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={safeHref("/login")}
              className="inline-block rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-10 py-4 text-lg font-bold text-white shadow-[0_0_35px_rgba(168,85,247,0.55)] transition hover:scale-105"
            >
              🚀 Start now
            </Link>

            <Link
              href={safeHref("/login")}
              className="rounded-2xl border border-white/15 px-10 py-4 text-lg text-white transition hover:border-purple-500/40 hover:bg-white/10"
            >
              See how it works
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
