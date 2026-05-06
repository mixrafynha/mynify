"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Calendar,
  Gamepad2,
  Rocket,
  Sparkles,
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

/* ================= STATIC DATA ================= */

const POSTS = Object.freeze([
  {
    slug: "how-to-start-print-on-demand",
    title: "How to start a print-on-demand business",
    excerpt:
      "Learn how to launch your first product and start selling online without inventory.",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop",
    date: "March 10, 2026",
  },
  {
    slug: "design-tips-that-sell",
    title: "Design tips that actually sell",
    excerpt:
      "Simple design principles that can dramatically increase your product sales.",
    image:
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1200&auto=format&fit=crop",
    date: "March 5, 2026",
  },
  {
    slug: "scaling-your-brand",
    title: "Scaling your brand to 6 figures",
    excerpt:
      "Strategies to grow your store from first sales to a consistent income stream.",
    image:
      "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=1200&auto=format&fit=crop",
    date: "February 28, 2026",
  },
]);

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80";

export default function BlogPage() {
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

  return (
    <main className="min-h-screen overflow-hidden bg-[#03030a] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_32%,rgba(168,85,247,0.35),transparent_28%),radial-gradient(circle_at_58%_52%,rgba(14,165,233,0.25),transparent_24%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,10,0.35)_0%,#03030a_100%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 text-center md:px-8 lg:px-12 lg:pt-28">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-500/60 bg-purple-500/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-white/85 shadow-[0_0_22px_rgba(168,85,247,0.35)]">
            <Gamepad2 size={15} className="text-purple-400" />
            Tips for creators & gamer brands
          </div>

          <h1 className="mx-auto mb-6 max-w-5xl text-5xl font-black uppercase leading-[0.9] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            MYNIFY{" "}
            <span className="bg-gradient-to-r from-violet-300 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
              Blog
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg md:text-xl">
            Tips, strategies, and insights to help you grow your brand and sell
            more.
          </p>
        </div>
      </section>

      {/* POSTS GRID */}
      <section className="relative bg-[#03030a] pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.16),transparent_28%)]" />

        <div className="relative mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
          <div className="mb-10 flex items-center gap-4">
            <div className="h-[2px] w-10 bg-purple-500 sm:w-12" />
            <h2 className="text-xl font-black uppercase italic tracking-tight sm:text-2xl md:text-3xl">
              Latest articles
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {POSTS.map((post) => (
              <article
                key={post.slug}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-[0_0_30px_rgba(168,85,247,0.08)] transition duration-300 hover:-translate-y-1 hover:border-purple-500/45"
              >
                {/* IMAGE */}
                <Link
                  href={safeHref(`/blog/${post.slug}`)}
                  className="relative block h-56 w-full overflow-hidden"
                >
                  <Image
                    src={post.image}
                    alt={safeText(post.title)}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    onError={handleImageError}
                    className="object-cover opacity-70 transition duration-500 group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#03030a] via-black/30 to-transparent" />
                </Link>

                {/* CONTENT */}
                <div className="p-6">
                  <p className="mb-3 flex items-center gap-2 text-sm text-white/40">
                    <Calendar size={15} className="text-purple-400" />
                    {safeText(post.date)}
                  </p>

                  <h2 className="mb-3 text-xl font-black text-white">
                    {safeText(post.title)}
                  </h2>

                  <p className="mb-6 leading-relaxed text-white/60">
                    {safeText(post.excerpt)}
                  </p>

                  <Link
                    href={safeHref(`/blog/${post.slug}`)}
                    className="inline-flex items-center gap-2 font-bold text-fuchsia-400 transition hover:text-purple-300"
                  >
                    Read more
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE STRIP */}
      <section className="relative overflow-hidden bg-[#05050d] py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.14),transparent_40%)]" />

        <div className="relative mx-auto max-w-5xl px-4 text-center md:px-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-purple-300">
            <BookOpen size={14} />
            Learn & grow
          </div>

          <h3 className="mb-4 text-3xl font-black uppercase md:text-4xl">
            Build smarter, sell better
          </h3>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/60">
            Discover practical guides about product design, marketing, branding,
            and scaling your custom product business.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#03030a] py-28 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.35),transparent_45%)]" />

        <div className="relative mx-auto max-w-5xl px-4 md:px-8 lg:px-12">
          <h2 className="mb-6 text-4xl font-black uppercase leading-tight tracking-tight md:text-6xl">
            Want to{" "}
            <span className="bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
              grow faster?
            </span>
          </h2>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/60 md:text-xl">
            Start building your brand and apply what you learn today.
          </p>

          <Link
            href={safeHref("/login")}
            className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-10 py-4 text-lg font-bold text-white shadow-[0_0_35px_rgba(168,85,247,0.55)] transition hover:scale-105"
          >
            Start now
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
