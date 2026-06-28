"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bot,
  Boxes,
  ChevronUp,
  FileText,
  Globe2,
  HeartHandshake,
  Lightbulb,
  Mail,
  Rocket,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
  Wand2,
  Zap,
} from "lucide-react";

type Section = {
  id: string;
  eyebrow: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
};

const LAST_UPDATED = "June 2026";
const CONTACT_EMAIL = "support@ryfio.com";

const pageLinks = [
  { label: "About Ryfio", href: "/about", active: true },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Cookies", href: "/cookies" },
];

const safeScrollTo = (id: string) => {
  if (typeof window === "undefined") return;
  const element = document.getElementById(id);
  if (!element) return;

  element.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

export default function AboutRyfioPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  const sections: Section[] = useMemo(
    () => [
      {
        id: "overview",
        eyebrow: "01",
        title: "Overview",
        icon: Sparkles,
        content: (
          <>
            <p>
              Ryfio is an AI-powered print-on-demand platform built to help
              creators, brands and businesses design, publish and sell custom
              products without holding inventory.
            </p>
            <p>
              The platform brings product design, mockups, commerce workflows,
              checkout and fulfilment support into one modern experience. Our
              goal is to make launching a product feel fast, visual and simple,
              even for people who do not want to manage stock, warehouses or
              complex technical systems.
            </p>
            <p>
              Ryfio is designed for creators who want to move quickly: choose a
              product, create a design, preview it, save it, add it to cart and
              prepare it for checkout.
            </p>
          </>
        ),
      },
      {
        id: "mission",
        eyebrow: "02",
        title: "Our Mission",
        icon: Target,
        content: (
          <>
            <p>
              Our mission is to make product creation and online selling more
              accessible. We believe anyone with an idea should be able to turn
              that idea into a real product without needing inventory,
              manufacturing knowledge or a large upfront budget.
            </p>
            <p>
              Print-on-demand makes this possible, but many tools still feel
              slow, complicated or disconnected. Ryfio exists to make the whole
              flow cleaner, faster and more creator-friendly.
            </p>
          </>
        ),
      },
      {
        id: "what-we-build",
        eyebrow: "03",
        title: "What We Build",
        icon: Wand2,
        content: (
          <>
            <p>
              Ryfio focuses on the core workflows that a modern creator commerce
              platform needs.
            </p>
            <ul>
              <li>Product catalogues for print-on-demand items.</li>
              <li>A browser-based editor for custom designs.</li>
              <li>AI-assisted tools for product creation and mockups.</li>
              <li>Saved products and design previews.</li>
              <li>Cart, checkout and order flows.</li>
              <li>Legal, trust and customer support pages for a safer experience.</li>
            </ul>
            <p>
              The product is built to be visual first. Users should understand
              what they are creating and what the final product may look like
              before moving to checkout.
            </p>
          </>
        ),
      },
      {
        id: "for-creators",
        eyebrow: "04",
        title: "Built for Creators",
        icon: Store,
        content: (
          <>
            <p>
              Ryfio is for independent creators, small brands, designers,
              influencers, community owners and entrepreneurs who want to launch
              merchandise or custom products without managing operations
              manually.
            </p>
            <p>
              A creator should be able to focus on the brand, audience and
              product idea. Ryfio works to reduce the friction around product
              setup, visual editing, product previews and the steps required to
              turn a design into something ready to purchase.
            </p>
          </>
        ),
      },
      {
        id: "why-print-on-demand",
        eyebrow: "05",
        title: "Why Print-on-Demand",
        icon: Boxes,
        content: (
          <>
            <p>
              Traditional commerce often requires stock, storage, forecasting
              and upfront production costs. Print-on-demand changes that model by
              producing products after an order is placed.
            </p>
            <p>
              This helps creators test ideas faster, reduce waste and avoid
              buying inventory before they know what customers want. It also
              makes it easier to launch small collections, seasonal drops,
              niche designs and experimental products.
            </p>
          </>
        ),
      },
      {
        id: "ai-commerce",
        eyebrow: "06",
        title: "AI Commerce",
        icon: Bot,
        content: (
          <>
            <p>
              Ryfio uses AI and automation to make product creation easier. AI
              can support ideation, mockup generation, product workflows and
              creative decisions, but the creator remains in control.
            </p>
            <p>
              Our approach is practical: AI should reduce repetitive work, speed
              up creation and help users get closer to a finished product, not
              make the process harder to understand.
            </p>
          </>
        ),
      },
      {
        id: "experience",
        eyebrow: "07",
        title: "User Experience",
        icon: Zap,
        content: (
          <>
            <p>
              Ryfio is designed with a premium, mobile-first interface. We care
              about speed, clarity, visual consistency and reducing unnecessary
              steps.
            </p>
            <p>
              The platform uses a dark interface with strong contrast, subtle
              gradients and focused layouts so users can concentrate on the
              product they are building.
            </p>
            <p>
              Performance matters. A good commerce tool should feel fast when
              opening the dashboard, editing a product, saving a design or
              moving to checkout.
            </p>
          </>
        ),
      },
      {
        id: "trust",
        eyebrow: "08",
        title: "Trust and Transparency",
        icon: ShieldCheck,
        content: (
          <>
            <p>
              Trust matters in commerce. Ryfio is building clear policies,
              support flows and transparent information around privacy, terms,
              refunds, shipping and cookies.
            </p>
            <p>
              We want users to understand what happens with their data, how
              orders work, when refunds may apply and how shipping is handled.
              Clear information helps creators and customers make better
              decisions.
            </p>
          </>
        ),
      },
      {
        id: "global-vision",
        eyebrow: "09",
        title: "Global Vision",
        icon: Globe2,
        content: (
          <>
            <p>
              Ryfio is built with a global mindset. The goal is to support
              creators who want to sell beyond their local market and reach
              customers in different regions.
            </p>
            <p>
              Global fulfilment can involve multiple partners, shipping regions,
              currencies, taxes and delivery rules. Ryfio’s long-term vision is
              to make those complexities easier for creators to manage.
            </p>
          </>
        ),
      },
      {
        id: "values",
        eyebrow: "10",
        title: "Our Values",
        icon: HeartHandshake,
        content: (
          <>
            <p>
              Ryfio is guided by product principles that shape how we build and
              improve the platform.
            </p>
            <ul>
              <li><strong>Clarity:</strong> users should understand what each step does.</li>
              <li><strong>Speed:</strong> creation and checkout should feel responsive.</li>
              <li><strong>Ownership:</strong> creators should stay in control of their products.</li>
              <li><strong>Trust:</strong> policies and product flows should be transparent.</li>
              <li><strong>Quality:</strong> design tools should feel modern and reliable.</li>
              <li><strong>Accessibility:</strong> commerce should be easier to start.</li>
            </ul>
          </>
        ),
      },
      {
        id: "roadmap",
        eyebrow: "11",
        title: "Where Ryfio Is Going",
        icon: Rocket,
        content: (
          <>
            <p>
              Ryfio is being built step by step, with a focus on completing the
              core commerce flow first: product creation, cart, checkout,
              orders, fulfilment and customer trust.
            </p>
            <p>
              Over time, the platform can grow into more advanced tools for
              creators: better analytics, store pages, automation, integrations,
              AI workflows, product recommendations and more fulfilment options.
            </p>
            <p>
              The goal is not just to make another print-on-demand website. The
              goal is to make a creator commerce platform that feels fast,
              premium and easy to use.
            </p>
          </>
        ),
      },
      {
        id: "contact",
        eyebrow: "12",
        title: "Contact",
        icon: Mail,
        content: (
          <>
            <p>
              If you have questions about Ryfio, want to report an issue or want
              to discuss a partnership, contact us through the Contact page or
              by email.
            </p>
            <p>
              Email:{" "}
              <a
                className="font-bold text-purple-300 underline-offset-4 hover:underline"
                href={`mailto:${CONTACT_EMAIL}`}
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </>
        ),
      },
    ],
    []
  );

  const updateReadingProgress = useCallback(() => {
    if (typeof window === "undefined") return;

    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;

    setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    setShowTop(scrollTop > 560);
  }, []);

  useEffect(() => {
    updateReadingProgress();

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target?.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -65% 0px",
        threshold: [0.08, 0.2, 0.5],
      }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    window.addEventListener("scroll", updateReadingProgress, { passive: true });
    window.addEventListener("resize", updateReadingProgress);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateReadingProgress);
      window.removeEventListener("resize", updateReadingProgress);
    };
  }, [sections, updateReadingProgress]);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#03030a] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1 bg-white/5"
      >
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-cyan-400 transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_4%,rgba(168,85,247,0.22),transparent_30%),radial-gradient(circle_at_85%_12%,rgba(14,165,233,0.14),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(217,70,239,0.10),transparent_32%)]"
      />

      <section className="relative mx-auto max-w-7xl px-4 pb-10 pt-24 sm:px-6 lg:px-8 lg:pb-16 lg:pt-28">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-purple-300 shadow-[0_0_34px_rgba(168,85,247,0.12)] backdrop-blur-xl">
            <Lightbulb size={15} />
            Company
          </div>

          <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-7xl">
            About Ryfio
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-white/58 sm:text-lg">
            Ryfio helps creators build, customize and sell print-on-demand
            products worldwide with AI-powered tools and a premium commerce
            experience.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-white/45">
            <span className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2">
              Updated: {LAST_UPDATED}
            </span>
            <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-purple-200">
              AI commerce
            </span>
            <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-cyan-200">
              Print-on-demand
            </span>
          </div>
        </div>
      </section>

      <section className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-24 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <div className="rounded-[30px] border border-white/10 bg-white/[0.035] p-4 shadow-[0_0_55px_rgba(168,85,247,0.10)] backdrop-blur-2xl">
              <p className="mb-4 px-3 text-xs font-black uppercase tracking-[0.22em] text-white/35">
                Contents
              </p>

              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => safeScrollTo(section.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition ${
                      activeSection === section.id
                        ? "bg-purple-500/15 text-purple-200 shadow-[0_0_22px_rgba(168,85,247,0.12)]"
                        : "text-white/45 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <span className="text-xs font-black text-white/25">
                      {section.eyebrow}
                    </span>
                    <span className="truncate font-bold">{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="mt-5 rounded-[28px] border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-white/35">
                Ryfio Pages
              </p>

              <div className="flex flex-col gap-2">
                {pageLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-2xl px-3 py-2 text-sm font-bold transition ${
                      item.active
                        ? "bg-white/10 text-white"
                        : "text-white/45 hover:bg-white/[0.04] hover:text-purple-300"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => safeScrollTo(section.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wide transition ${
                  activeSection === section.id
                    ? "border-purple-400/40 bg-purple-500/15 text-purple-200"
                    : "border-white/10 bg-white/[0.035] text-white/45"
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.025] shadow-[0_0_80px_rgba(168,85,247,0.09)] backdrop-blur-xl">
            <div className="border-b border-white/10 p-5 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-purple-300">
                    Ryfio Company
                  </p>
                  <p className="mt-2 text-sm text-white/45">
                    Creator commerce, AI tools and print-on-demand workflows.
                  </p>
                </div>

                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(168,85,247,0.32)] transition hover:scale-[1.02]"
                >
                  Start Creating
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>

            <div className="divide-y divide-white/10">
              {sections.map((section) => {
                const Icon = section.icon;

                return (
                  <article
                    key={section.id}
                    id={section.id}
                    className="scroll-mt-24 px-5 py-10 sm:px-8 lg:px-10 lg:py-12"
                  >
                    <div className="mb-6 flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-500/10 text-purple-200">
                        <Icon size={22} />
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-purple-300/80">
                          {section.eyebrow}
                        </p>
                        <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                          {section.title}
                        </h2>
                      </div>
                    </div>

                    <div className="about-copy max-w-3xl text-[15px] leading-8 text-white/58 sm:text-base">
                      {section.content}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {showTop ? (
        <button
          type="button"
          onClick={() => safeScrollTo("overview")}
          className="fixed bottom-5 right-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-white shadow-[0_0_30px_rgba(168,85,247,0.18)] backdrop-blur-xl transition hover:scale-105 hover:text-purple-200"
          aria-label="Back to top"
        >
          <ChevronUp size={22} />
        </button>
      ) : null}

      <style jsx global>{`
        .about-copy p {
          margin-bottom: 1.25rem;
        }

        .about-copy p:last-child {
          margin-bottom: 0;
        }

        .about-copy ul {
          margin: 1.25rem 0;
          display: grid;
          gap: 0.7rem;
          padding-left: 1.15rem;
        }

        .about-copy li {
          padding-left: 0.25rem;
        }

        .about-copy strong {
          color: rgba(255, 255, 255, 0.88);
          font-weight: 800;
        }

        .about-copy a {
          color: rgb(216 180 254);
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </main>
  );
}
