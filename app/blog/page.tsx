import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Rocket, Search, Sparkles, Zap } from "lucide-react";
import { BLOG_POSTS } from "./_content";
import { BlogCard, BlogVisual } from "./_components";

export const metadata: Metadata = {
  title: "Print-on-Demand Blog | Ryfio",
  description: "Practical guides about print on demand, custom products, AI product design, ecommerce, and launching a brand without inventory.",
  alternates: { canonical: "https://www.ryfio.com/blog" },
  openGraph: {
    title: "Print-on-Demand Blog | Ryfio",
    description: "Learn how to design, launch, and sell custom products online with print-on-demand fulfillment.",
    url: "https://www.ryfio.com/blog",
    siteName: "Ryfio",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Ryfio Blog" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Print-on-Demand Blog | Ryfio",
    description: "Guides for custom products, ecommerce, AI design, and print-on-demand brands.",
    images: ["/og-image.png"],
  },
};

export default function BlogPage() {
  const featured = BLOG_POSTS[0];
  const rest = BLOG_POSTS.slice(1);

  return (
    <main className="min-h-screen overflow-hidden bg-[#03030a] text-white">
      <section className="relative overflow-hidden px-4 pb-10 pt-14 sm:pt-20 md:px-8 lg:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_25%,rgba(168,85,247,0.38),transparent_28%),radial-gradient(circle_at_18%_42%,rgba(14,165,233,0.22),transparent_24%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:42px_42px] opacity-20" />
        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-500/60 bg-purple-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/85 shadow-[0_0_22px_rgba(168,85,247,0.35)]">
              <Sparkles size={15} className="text-purple-300" aria-hidden="true" /> Print-on-demand guides
            </div>
            <h1 className="mx-auto mb-6 max-w-5xl text-5xl font-black uppercase leading-[0.9] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
              Build products
              <span className="block bg-gradient-to-r from-violet-300 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">people want</span>
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg md:text-xl">Practical, mobile-friendly guides about custom products, AI design, ecommerce, and launching a print-on-demand brand without inventory.</p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[{ icon: BookOpen, label: "10 SEO guides" }, { icon: Search, label: "Built for discovery" }, { icon: Rocket, label: "Launch focused" }].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 text-center shadow-[0_0_28px_rgba(168,85,247,0.06)] backdrop-blur-xl">
                  <Icon className="mx-auto mb-3 text-purple-300" size={22} aria-hidden="true" />
                  <p className="text-sm font-black uppercase tracking-[0.12em] text-white/75">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative bg-[#03030a] pb-12">
        <div className="relative mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
          <Link href={`/blog/${featured.slug}`} className="group grid overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-3 shadow-[0_0_45px_rgba(168,85,247,0.12)] transition duration-300 hover:-translate-y-1 hover:border-purple-500/45 lg:grid-cols-[1.08fr_0.92fr]">
            <BlogVisual post={featured} large />
            <div className="flex flex-col justify-center p-5 sm:p-8 lg:p-10">
              <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-white/45">
                <span className="rounded-full border border-purple-400/25 bg-purple-500/10 px-3 py-1 text-purple-200">Featured</span>
                <span>{featured.category}</span>
                <span>{featured.readTime}</span>
              </div>
              <h2 className="mb-4 text-3xl font-black uppercase leading-[0.96] tracking-tight sm:text-4xl lg:text-5xl">{featured.title}</h2>
              <p className="mb-8 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">{featured.excerpt}</p>
              <span className="inline-flex w-fit items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-3 text-sm font-black text-white shadow-[0_0_28px_rgba(168,85,247,0.35)] transition group-hover:gap-3">
                Read featured guide <ArrowRight size={17} aria-hidden="true" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      <section className="relative bg-[#03030a] py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.16),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
          <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.26em] text-purple-300">Ryfio knowledge base</p>
              <h2 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">Latest guides</h2>
            </div>
            <Link href="/catalog" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/75 transition hover:border-purple-500/40 hover:text-white">
              Browse products <Zap size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => <BlogCard key={post.slug} post={post} />)}
          </div>
        </div>
      </section>
    </main>
  );
}
