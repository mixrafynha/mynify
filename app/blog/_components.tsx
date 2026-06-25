import Link from "next/link";
import { ArrowRight, Calendar, CheckCircle2, Clock, Sparkles, Zap } from "lucide-react";
import type { BlogPost } from "./_content";
import { BLOG_POSTS } from "./_content";

const accentByCategory: Record<string, string> = {
  "Brand launch": "from-violet-500 to-fuchsia-500",
  "Business model": "from-cyan-400 to-violet-500",
  "Product ideas": "from-emerald-400 to-cyan-400",
  Design: "from-fuchsia-500 to-orange-400",
  "AI design": "from-purple-500 to-cyan-400",
  "Selling online": "from-indigo-500 to-fuchsia-500",
  "Beginner guide": "from-sky-400 to-violet-500",
  "Launch strategy": "from-purple-500 to-emerald-400",
  SEO: "from-cyan-400 to-blue-500",
};

function accent(post: BlogPost) {
  return accentByCategory[post.category] ?? "from-purple-500 to-fuchsia-500";
}

export function BlogVisual({ post, large = false }: { post: BlogPost; large?: boolean }) {
  const initial = post.title.replace(/^(How|Print|Best|AI|Product)\s+/i, "").charAt(0).toUpperCase();
  return (
    <div className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#080812] ${large ? "min-h-[300px] sm:min-h-[420px]" : "min-h-[210px]"}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${accent(post)} opacity-45`} />
      <div className="absolute -left-20 -top-20 h-52 w-52 rounded-full bg-white/20 blur-3xl animate-[pulse_7s_ease-in-out_infinite] motion-reduce:animate-none" />
      <div className="absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-black/35 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.055)_1px,transparent_1px)] bg-[size:34px_34px] opacity-30" />
      <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-6">
        <div>
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-white/65">Ryfio guide</p>
          <div className="h-2 w-24 rounded-full bg-white/20" />
        </div>
        <div className="grid h-24 w-24 place-items-center rounded-[1.6rem] border border-white/15 bg-white/10 text-5xl font-black text-white shadow-[0_20px_80px_rgba(0,0,0,.35)] backdrop-blur-xl transition duration-500 group-hover:scale-105 sm:h-32 sm:w-32 sm:text-7xl">
          {initial}
        </div>
      </div>
    </div>
  );
}

export function BlogCard({ post, priority = false }: { post: BlogPost; priority?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-3 shadow-[0_0_28px_rgba(168,85,247,0.06)] transition duration-300 hover:-translate-y-1 hover:border-purple-400/50 hover:bg-white/[0.055]"
    >
      <BlogVisual post={post} />
      <div className="p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
          <span className="rounded-full border border-purple-400/25 bg-purple-500/10 px-2.5 py-1 text-purple-200">{post.category}</span>
          <span>{post.readTime}</span>
        </div>
        <h2 className="mb-3 text-xl font-black leading-tight tracking-tight text-white sm:text-2xl">{post.title}</h2>
        <p className="line-clamp-3 text-sm leading-6 text-white/55">{post.excerpt}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-purple-200 transition group-hover:gap-3 group-hover:text-white">
          Read guide <ArrowRight size={16} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

function paragraphFor(section: string, post: BlogPost) {
  const lower = section.toLowerCase();
  if (lower.includes("customer") || lower.includes("niche")) {
    return `The strongest ${post.category.toLowerCase()} decisions start with a specific audience. Define what the buyer wants to express, what products they already trust, and what would make your offer feel different. This turns a generic product into a brand asset with a clear reason to exist.`;
  }
  if (lower.includes("product") || lower.includes("collection")) {
    return "Keep the first range focused. A smaller collection loads faster, looks more premium, and is easier for customers to understand on mobile. Start with a few strong products, validate demand, then expand into variations only when the data supports it.";
  }
  if (lower.includes("print") || lower.includes("inventory") || lower.includes("stock")) {
    return "Print-on-demand fulfillment reduces upfront risk because products are produced after purchase. That makes it ideal for testing designs, learning what customers want, and avoiding money trapped in unsold stock. Quality control and clear delivery expectations still matter.";
  }
  if (lower.includes("page") || lower.includes("seo") || lower.includes("title")) {
    return "A high-performing page needs clarity before decoration. Use direct titles, short benefit-led copy, visible calls to action, and internal links that help both customers and search engines understand the next step.";
  }
  if (lower.includes("feedback") || lower.includes("test") || lower.includes("launch")) {
    return "Launch before you overbuild. Watch saves, clicks, comments, add-to-cart behavior, and questions from real users. Improve the designs that attract attention and remove anything that does not support the brand direction.";
  }
  return "The goal is not to add complexity. The goal is to make the product easier to understand, easier to trust, and easier to buy. Good execution is usually simple, visual, and consistent across the full customer journey.";
}

export function ArticlePage({ post }: { post: BlogPost }) {
  const related = BLOG_POSTS.filter((item) => item.slug !== post.slug).slice(0, 3);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    author: { "@type": "Organization", name: "Ryfio" },
    publisher: { "@type": "Organization", name: "Ryfio", logo: { "@type": "ImageObject", url: "https://ryfio.com/favicon.ico" } },
    mainEntityOfPage: `https://ryfio.com/blog/${post.slug}`,
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#03030a] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article>
        <section className="relative overflow-hidden px-4 pb-10 pt-10 sm:pt-16 md:px-8 lg:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(168,85,247,0.35),transparent_28%),radial-gradient(circle_at_15%_35%,rgba(14,165,233,0.20),transparent_24%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />
          <div className="relative mx-auto max-w-6xl">
            <Link href="/blog" className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/60 transition hover:border-purple-500/40 hover:text-white">← Back to blog</Link>
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_.95fr]">
              <div>
                <div className="mb-5 flex flex-wrap items-center gap-3 text-[11px] font-black uppercase tracking-[0.16em] text-white/45">
                  <span className="inline-flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-500/10 px-3 py-1 text-purple-200"><Sparkles size={13} aria-hidden="true" /> {post.category}</span>
                  <span className="inline-flex items-center gap-2"><Calendar size={14} aria-hidden="true" /> June 23, 2026</span>
                  <span className="inline-flex items-center gap-2"><Clock size={14} aria-hidden="true" /> {post.readTime}</span>
                </div>
                <h1 className="mb-6 text-4xl font-black uppercase leading-[0.92] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">{post.title}</h1>
                <p className="max-w-3xl text-lg leading-8 text-white/65 sm:text-xl">{post.excerpt}</p>
              </div>
              <div className="group">
                <BlogVisual post={post} large />
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto grid max-w-6xl gap-8 px-4 pb-20 md:px-8 lg:grid-cols-[1fr_300px]">
          <div className="space-y-5">
            <section className="rounded-3xl border border-purple-400/20 bg-purple-500/[0.08] p-6 shadow-[0_0_28px_rgba(168,85,247,0.08)] sm:p-8">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-purple-200">Quick summary</p>
              <div className="grid gap-3">
                {post.sections.slice(0, 3).map((item) => (
                  <div key={item} className="flex gap-3 text-white/72"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-purple-300" aria-hidden="true" /><p>{item}</p></div>
                ))}
              </div>
            </section>

            {post.sections.map((section, index) => (
              <section key={section} className="group rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-[0_0_28px_rgba(168,85,247,0.06)] transition duration-300 hover:border-purple-400/30 hover:bg-white/[0.045] sm:p-8">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-sm font-black text-purple-200">{index + 1}</div>
                <h2 className="mb-4 text-2xl font-black tracking-tight text-white sm:text-3xl">{section}</h2>
                <p className="text-base leading-8 text-white/64 sm:text-lg">{paragraphFor(section, post)}</p>
              </section>
            ))}

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
              <h2 className="mb-5 text-2xl font-black tracking-tight text-white sm:text-3xl">FAQ</h2>
              <div className="grid gap-3">
                {post.faqs.map((faq) => (
                  <details key={faq.question} className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition open:border-purple-400/30 open:bg-purple-500/[0.06]">
                    <summary className="cursor-pointer list-none text-base font-black text-white group-open:text-purple-200">{faq.question}</summary>
                    <p className="mt-3 leading-7 text-white/58">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-5 lg:sticky lg:top-24">
            <h2 className="mb-4 text-lg font-black uppercase tracking-tight text-white">Create with Ryfio</h2>
            <p className="mb-5 text-sm leading-7 text-white/55">Turn your idea into a custom product with AI design and print-on-demand fulfillment.</p>
            <Link href="/catalog" className="mb-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(168,85,247,0.35)] transition hover:scale-[1.02]">
              Browse catalog <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <div className="border-t border-white/10 pt-5">
              <h3 className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-white/45">Related guides</h3>
              <div className="grid gap-3">
                {related.map((item) => (
                  <Link key={item.slug} href={`/blog/${item.slug}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-purple-500/40">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-purple-300">{item.category}</p>
                    <p className="text-sm font-bold leading-6 text-white/78">{item.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </article>
    </main>
  );
}
