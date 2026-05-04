"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback } from "react";

/* ================= SECURITY HELPERS (ADDED) ================= */

// 🔐 prevents javascript: / data: injection in links
const safeHref = (href: string) => {
  if (typeof href !== "string") return "/";
  if (href.trim().toLowerCase().startsWith("javascript:")) return "/";
  if (href.trim().toLowerCase().startsWith("data:")) return "/";
  return href;
};

// 🔐 sanitize text output (defensive UI rendering)
const safeText = (val: any) => {
  if (typeof val !== "string") return "";
  return val
    .replace(/<script.*?>.*?<\/script>/gi, "")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

/* STATIC DATA (imutável) */
const FEATURES = Object.freeze([
  {
    icon: "🎨",
    title: "Design in minutes",
    desc: "Create stunning products with intuitive tools, live previews, and zero design skills required.",
  },
  {
    icon: "📦",
    title: "Zero inventory",
    desc: "We print, pack, and ship your products worldwide — you focus only on selling.",
  },
  {
    icon: "🚀",
    title: "Scale without limits",
    desc: "From your first sale to thousands — MYNIFY grows with your business effortlessly.",
  },
]);

const PRODUCTS = Object.freeze([
  {
    name: "T-Shirts",
    image:
      "https://images.unsplash.com/photo-1626160200951-fc4b4f8d4de9?q=80&w=687&auto=format&fit=crop",
  },
  {
    name: "Hoodies",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=687&auto=format&fit=crop",
  },
  {
    name: "Mugs",
    image:
      "https://images.unsplash.com/photo-1614940403522-a8c829e7eb82?q=80&w=689&auto=format&fit=crop",
  },
  {
    name: "Caps",
    image:
      "https://images.unsplash.com/photo-1521369909029-2afed882baee?q=80&w=689&auto=format&fit=crop",
  },
]);

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80";

export default function HomePage() {
  /**
   * 🔐 SAFE IMAGE HANDLER (anti-loop + validation)
   */
  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const target = e.currentTarget;

      try {
        if (target && target.src !== FALLBACK_IMAGE) {
          target.src = FALLBACK_IMAGE;
        }
      } catch {
        // silent fail (no UI break)
      }
    },
    []
  );

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 text-gray-900">

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-10 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            Create and sell{" "}
            <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              custom products
            </span>{" "}
            your way
          </h1>

          <p className="text-gray-600 mb-8 text-lg">
            Design your own products, customize everything, and build your brand with MYNIFY.
          </p>

          <div className="flex gap-4">
            <Link
              href={safeHref("/login")}
              aria-label="Start creating"
              className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-6 py-3 rounded-xl font-medium shadow-md hover:scale-105 hover:shadow-lg transition inline-block"
            >
              Start creating
            </Link>

            <button
              type="button"
              className="border border-gray-300 px-6 py-3 rounded-xl hover:bg-gray-100 transition"
            >
              See examples
            </button>
          </div>
        </div>

        <div className="relative h-80 w-full">
          <Image
            src={FALLBACK_IMAGE}
            alt="Creative thinking and ideas"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover rounded-2xl shadow-lg"
          />
        </div>
      </section>

      {/* CUSTOMIZATION */}
      <section className="py-20 bg-gradient-to-r from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 grid md:grid-cols-2 gap-10 items-center">

          <div className="relative h-80 w-full">
            <Image
              src="https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=1200&q=80"
              alt="Designing custom products"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover rounded-2xl shadow-md"
            />
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-4">
              Fully customizable products
            </h2>

            <p className="text-gray-600 mb-6">
              Let your customers personalize products the way they want — from design to details.
            </p>

            <ul className="space-y-3 text-gray-700">
              <li>✔ Upload your own designs</li>
              <li>✔ Customize colors and styles</li>
              <li>✔ Preview before selling</li>
            </ul>
          </div>

        </div>
      </section>

      {/* FEATURES */}
      <section className="py-28 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">

          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Why creators choose{" "}
              <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                MYNIFY
              </span>
            </h2>

            <p className="text-gray-600 text-lg leading-relaxed">
              Everything you need to launch, grow, and scale your custom product business — without complexity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((item) => (
              <div
                key={item.title}
                className="group relative bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300 bg-gradient-to-br from-green-400/10 to-emerald-500/10" />

                <div className="relative z-10">
                  <div className="mb-5 text-3xl">{item.icon}</div>

                  <h3 className="text-xl font-semibold mb-3">
                    {safeText(item.title)}
                  </h3>

                  <p className="text-gray-600 leading-relaxed">
                    {safeText(item.desc)}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* PRODUCTS */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            What you can create
          </h2>

          <p className="text-center text-gray-600 mb-12">
            Create and sell unique products with your own designs.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {PRODUCTS.map((product) => (
              <div
                key={product.name}
                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition duration-300"
              >
                <div className="relative h-44 w-full">
                  <Image
                    src={product.image}
                    alt={safeText(product.name)}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    onError={handleImageError}
                    className="object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>

                <div className="p-4 text-center font-medium">
                  {safeText(product.name)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative overflow-hidden">

        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_#10b981,_transparent_70%)]" />

        <div className="relative max-w-5xl mx-auto px-4 md:px-8 lg:px-12 text-center">

          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight tracking-tight">
            Turn your ideas into{" "}
            <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              real products
            </span>
          </h2>

          <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Start your brand, sell custom products worldwide, and grow without inventory.
            Everything you need — in one powerful platform.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">

            <Link
              href={safeHref("/login")}
              aria-label="Start for free"
              className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-10 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:scale-105 hover:shadow-2xl transition duration-300 inline-block"
            >
              🚀 Start for free
            </Link>

            <a href={safeHref("/how-mynify-works")}>
              <button
                type="button"
                className="px-10 py-4 rounded-2xl border border-white/20 text-white hover:bg-white/10 transition text-lg"
              >
                See how it works
              </button>
            </a>

          </div>

          <p className="mt-6 text-sm text-gray-400">
            No credit card required • Free to start
          </p>

        </div>
      </section>
    </div>
  );
}