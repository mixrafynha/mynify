"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Gamepad2,
  ShoppingBag,
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

const safeImg = (url: string, w = 1200) => {
  if (typeof url !== "string") return "";
  const clean = url.trim();

  if (!clean.startsWith("https://images.unsplash.com/")) return "";

  return `${clean}?auto=format&fit=crop&w=${w}&q=80`;
};

/* ================= DATA ================= */

const hero1Images = Object.freeze([
  "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf",
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b",
  "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c",
]);

const hero2Images = Object.freeze([
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f",
  "https://images.unsplash.com/photo-1520975916090-3105956dac38",
]);

const popularProducts = Object.freeze([
  {
    id: 1,
    name: "Minimal Hoodie",
    price: "€34.99",
    image: "https://images.unsplash.com/photo-1544441893-675973e31985",
  },
  {
    id: 2,
    name: "Classic T-Shirt",
    price: "€19.99",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
  },
  {
    id: 3,
    name: "Street Cap",
    price: "€14.99",
    image: "https://images.unsplash.com/photo-1514996937319-344454492b37",
  },
  {
    id: 4,
    name: "Coffee Mug",
    price: "€9.99",
    image: "https://images.unsplash.com/photo-1511920170033-f8396924c348",
  },
]);

const newProducts = Object.freeze([
  {
    id: 5,
    name: "White Sneakers",
    price: "€49.99",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772",
  },
  {
    id: 6,
    name: "Backpack",
    price: "€39.99",
    image: "https://images.unsplash.com/photo-1503341733017-1901578f9f1e",
  },
  {
    id: 7,
    name: "Smart Watch",
    price: "€79.99",
    image: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b",
  },
  {
    id: 8,
    name: "Sunglasses",
    price: "€24.99",
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083",
  },
]);

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80";

export default function Home() {
  const [hero1Index, setHero1Index] = useState(0);
  const [hero2Index, setHero2Index] = useState(0);

  const hero1Length = useMemo(() => hero1Images.length, []);
  const hero2Length = useMemo(() => hero2Images.length, []);

  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const target = e.currentTarget;

      try {
        if (target.src !== FALLBACK_IMAGE) {
          target.src = FALLBACK_IMAGE;
        }
      } catch {}
    },
    []
  );

  useEffect(() => {
    if (!hero1Length || !hero2Length) return;

    const interval = setInterval(() => {
      setHero1Index((prev) => (prev + 1) % hero1Length);
      setHero2Index((prev) => (prev + 1) % hero2Length);
    }, 3000);

    return () => clearInterval(interval);
  }, [hero1Length, hero2Length]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#03030a] text-white">
      {/* HERO 1 */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_32%,rgba(168,85,247,0.35),transparent_28%),radial-gradient(circle_at_58%_52%,rgba(14,165,233,0.25),transparent_24%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,10,0.35)_0%,#03030a_100%)] lg:bg-[linear-gradient(90deg,#03030a_0%,rgba(3,3,10,0.9)_34%,rgba(3,3,10,0.35)_72%,#03030a_100%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-16 md:px-8 lg:min-h-[680px] lg:grid-cols-2 lg:px-12 lg:pt-24">
          <div className="z-10 text-center lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-500/60 bg-purple-500/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-white/85 shadow-[0_0_22px_rgba(168,85,247,0.35)]">
              <Gamepad2 size={15} className="text-purple-400" />
              Custom products for creators
            </div>

            <h1 className="mb-6 text-[48px] font-black uppercase leading-[0.88] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
              <span className="block">Create your</span>
              <span className="block">own brand</span>
              <span className="block bg-gradient-to-r from-violet-300 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                products.
              </span>
            </h1>

            <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg md:text-xl lg:mx-0">
              Build a modern store with custom products, powerful design, and a
              gamer-inspired brand experience.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href={safeHref("/catalog")}
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-7 py-4 font-bold text-white shadow-[0_0_35px_rgba(168,85,247,0.55)] transition hover:scale-105"
              >
                Shop now
                <ShoppingBag size={18} />
              </Link>

              <Link
                href={safeHref("/login")}
                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-7 py-4 font-bold text-white/90 backdrop-blur-xl transition hover:border-purple-500/40 hover:bg-white/10"
              >
                Start designing
                <Zap size={18} />
              </Link>
            </div>
          </div>

          <div className="relative z-0 mx-auto h-[320px] w-full max-w-[560px] sm:h-[400px] lg:h-[540px] lg:max-w-none">
            <div className="absolute inset-0 rounded-full bg-purple-600/20 blur-[80px]" />

            <div className="relative h-full overflow-hidden rounded-[36px] border border-purple-500/20 shadow-[0_0_60px_rgba(168,85,247,0.18)]">
              {hero1Images.map((img, index) => (
                <Image
                  key={img}
                  src={safeImg(img, 1200)}
                  alt="Custom brand products"
                  fill
                  priority={index === 0}
                  quality={90}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onError={handleImageError}
                  className={`absolute inset-0 object-cover opacity-75 transition-opacity duration-1000 ${
                    index === hero1Index ? "opacity-75" : "opacity-0"
                  }`}
                />
              ))}

              <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/25 to-purple-600/20" />
            </div>
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
            {popularProducts.map((product) => (
              <Link
                key={product.id}
                href={safeHref("/catalog")}
                className="group relative min-h-[240px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-[0_0_30px_rgba(168,85,247,0.08)] transition duration-300 hover:-translate-y-1 hover:border-purple-500/45"
              >
                <Image
                  src={safeImg(product.image, 700)}
                  alt={safeText(product.name)}
                  fill
                  quality={80}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  onError={handleImageError}
                  className="object-cover opacity-55 transition duration-500 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-transparent" />

                <div className="relative z-10 flex min-h-[240px] flex-col justify-end p-6">
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

      {/* HERO 2 */}
      <section className="relative overflow-hidden bg-[#05050d] py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_45%,rgba(14,165,233,0.18),transparent_25%),radial-gradient(circle_at_15%_30%,rgba(168,85,247,0.22),transparent_28%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 md:px-8 lg:grid-cols-2 lg:px-12">
          <div className="relative h-[360px] overflow-hidden rounded-[36px] border border-purple-500/20 shadow-[0_0_60px_rgba(168,85,247,0.18)] md:h-[420px]">
            {hero2Images.map((img, index) => (
              <Image
                key={img}
                src={safeImg(img, 1200)}
                alt="New product trends"
                fill
                quality={90}
                sizes="(max-width: 1024px) 100vw, 50vw"
                onError={handleImageError}
                className={`absolute inset-0 object-cover opacity-75 transition-opacity duration-1000 ${
                  index === hero2Index ? "opacity-75" : "opacity-0"
                }`}
              />
            ))}

            <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/35 to-purple-600/20" />
          </div>

          <div>
            <div className="mb-4 text-sm font-black uppercase tracking-widest text-purple-400">
              New trends
            </div>

            <h2 className="mb-6 text-4xl font-black uppercase leading-tight md:text-6xl">
              Discover designs that stand out
            </h2>

            <p className="mb-8 text-lg leading-relaxed text-white/60">
              Stay ahead with the latest products, modern designs, and unique
              pieces made for your audience.
            </p>

            <Link
              href={safeHref("/catalog")}
              className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-7 py-4 font-bold text-white/90 backdrop-blur-xl transition hover:border-purple-500/40 hover:bg-white/10"
            >
              Explore products
              <Sparkles size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* NEW PRODUCTS */}
      <section className="relative bg-[#03030a] py-16 sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.14),transparent_38%)]" />

        <div className="relative mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
          <div className="mb-8 flex items-center gap-4">
            <div className="h-[2px] w-10 bg-purple-500 sm:w-12" />
            <h2 className="text-xl font-black uppercase italic tracking-tight sm:text-2xl md:text-3xl">
              New products
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {newProducts.map((product) => (
              <Link
                key={product.id}
                href={safeHref("/catalog")}
                className="group relative min-h-[240px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-[0_0_30px_rgba(168,85,247,0.08)] transition duration-300 hover:-translate-y-1 hover:border-purple-500/45"
              >
                <Image
                  src={safeImg(product.image, 700)}
                  alt={safeText(product.name)}
                  fill
                  quality={80}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  onError={handleImageError}
                  className="object-cover opacity-55 transition duration-500 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-transparent" />

                <div className="relative z-10 flex min-h-[240px] flex-col justify-end p-6">
                  <h3 className="mb-5 max-w-[190px] font-bold text-white">
                    {safeText(product.name)}
                  </h3>

                  <div className="flex items-center justify-between">
                    <p className="text-lg font-black text-fuchsia-400">
                      {safeText(product.price)}
                    </p>

                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-purple-300 transition group-hover:bg-purple-500/20">
                      <Star size={18} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
