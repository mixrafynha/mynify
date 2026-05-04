"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback } from "react";

/* ================= SECURITY HELPERS ================= */

const safeHref = (href: string) => {
  if (typeof href !== "string") return "/";
  if (href.trim().toLowerCase().startsWith("javascript:")) return "/";
  if (href.trim().toLowerCase().startsWith("data:")) return "/";
  return href;
};

const safeText = (val: any) => {
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
        if (target && target.src !== FALLBACK_IMAGE) {
          target.src = FALLBACK_IMAGE;
        }
      } catch {}
    },
    []
  );

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 text-gray-900 min-h-screen">

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          MYNIFY{" "}
          <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            Blog
          </span>
        </h1>

        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Tips, strategies, and insights to help you grow your brand and sell more.
        </p>
      </section>

      {/* POSTS GRID */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-20">
        <div className="grid md:grid-cols-3 gap-8">

          {POSTS.map((post) => (
            <article
              key={post.slug}
              className="group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition duration-300"
            >
              {/* IMAGE */}
              <div className="relative h-52 w-full overflow-hidden">
                <Image
                  src={post.image}
                  alt={safeText(post.title)}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  onError={handleImageError}
                  className="object-cover group-hover:scale-105 transition duration-300"
                />
              </div>

              {/* CONTENT */}
              <div className="p-6">

                <p className="text-sm text-gray-400 mb-2">
                  {safeText(post.date)}
                </p>

                <h2 className="text-xl font-semibold mb-3">
                  {safeText(post.title)}
                </h2>

                <p className="text-gray-600 mb-5">
                  {safeText(post.excerpt)}
                </p>

                <Link
                  href={safeHref(`/blog/${post.slug}`)}
                  className="text-green-500 font-medium hover:underline"
                >
                  Read more →
                </Link>

              </div>
            </article>
          ))}

        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-black text-white text-center">

        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Want to grow faster?
        </h2>

        <p className="text-gray-300 mb-6">
          Start building your brand and apply what you learn today.
        </p>

        <Link
          href={safeHref("/login")}
          className="bg-gradient-to-r from-green-400 to-emerald-500 px-8 py-3 rounded-xl font-semibold hover:scale-105 transition inline-block"
        >
          Start now 🚀
        </Link>

      </section>
    </div>
  );
}