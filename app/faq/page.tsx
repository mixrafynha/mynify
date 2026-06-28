"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bot,
  ChevronDown,
  ChevronUp,
  CreditCard,
  FileText,
  HelpCircle,
  LockKeyhole,
  Mail,
  PackageCheck,
  RotateCcw,
  Search,
  ShieldCheck,
  Shirt,
  Sparkles,
  Truck,
  UserRound,
} from "lucide-react";

type FaqItem = {
  question: string;
  answer: React.ReactNode;
};

type Section = {
  id: string;
  eyebrow: string;
  title: string;
  icon: React.ElementType;
  items: FaqItem[];
};

const LAST_UPDATED = "June 2026";
const CONTACT_EMAIL = "support@ryfio.com";

const pageLinks = [
  { label: "About Ryfio", href: "/about" },
  { label: "FAQ", href: "/faq", active: true },
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

function FaqRow({ item, defaultOpen = false }: { item: FaqItem; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-5 py-5 text-left"
      >
        <span className="text-base font-black text-white sm:text-lg">
          {item.question}
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/55">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {open ? (
        <div className="faq-copy pb-6 text-[15px] leading-8 text-white/58 sm:text-base">
          {item.answer}
        </div>
      ) : null}
    </div>
  );
}

export default function FAQPage() {
  const [activeSection, setActiveSection] = useState("general");
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [query, setQuery] = useState("");

  const sections: Section[] = useMemo(
    () => [
      {
        id: "general",
        eyebrow: "01",
        title: "General",
        icon: HelpCircle,
        items: [
          {
            question: "What is Ryfio?",
            answer: (
              <p>
                Ryfio is an AI-powered print-on-demand platform that helps
                creators design, customize and sell products without holding
                inventory.
              </p>
            ),
          },
          {
            question: "Who is Ryfio for?",
            answer: (
              <p>
                Ryfio is built for creators, small brands, designers,
                entrepreneurs, influencers and anyone who wants to launch custom
                products without managing stock or fulfilment manually.
              </p>
            ),
          },
          {
            question: "Do I need inventory to use Ryfio?",
            answer: (
              <p>
                No. Ryfio is based on a print-on-demand model. Products can be
                produced after an order is placed, which reduces the need for
                upfront stock.
              </p>
            ),
          },
        ],
      },
      {
        id: "account",
        eyebrow: "02",
        title: "Account",
        icon: UserRound,
        items: [
          {
            question: "Do I need an account?",
            answer: (
              <p>
                Some public pages can be viewed without an account, but creating
                designs, saving products, using dashboard features and moving to
                checkout may require you to sign in.
              </p>
            ),
          },
          {
            question: "Can I use Ryfio as a business?",
            answer: (
              <p>
                Yes. If you use Ryfio for a business, brand or organisation, you
                are responsible for making sure you have authority to use the
                platform and accept the applicable terms.
              </p>
            ),
          },
          {
            question: "How do I contact support?",
            answer: (
              <p>
                You can contact support through the Contact page or by email at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
              </p>
            ),
          },
        ],
      },
      {
        id: "products",
        eyebrow: "03",
        title: "Products",
        icon: Shirt,
        items: [
          {
            question: "What products can I create?",
            answer: (
              <p>
                Ryfio is designed for print-on-demand products such as apparel,
                mugs and other customizable items. Product availability may vary
                by region, supplier and fulfilment coverage.
              </p>
            ),
          },
          {
            question: "Can I create my own product designs?",
            answer: (
              <p>
                Yes. You can use Ryfio’s editor to create and customize designs.
                You are responsible for making sure you have the rights to use
                any images, logos, fonts, text or artwork you upload.
              </p>
            ),
          },
          {
            question: "Will the final product look exactly like the mockup?",
            answer: (
              <p>
                Mockups are previews. Final print results can vary slightly due
                to material, print method, colour profile, lighting, screen
                settings, product texture and production limitations.
              </p>
            ),
          },
        ],
      },
      {
        id: "ai-design",
        eyebrow: "04",
        title: "AI and Design",
        icon: Bot,
        items: [
          {
            question: "Does Ryfio use AI?",
            answer: (
              <p>
                Ryfio may include AI-assisted tools for product creation,
                mockups, text suggestions, workflow support or design
                assistance.
              </p>
            ),
          },
          {
            question: "Can I sell AI-generated designs?",
            answer: (
              <p>
                You are responsible for reviewing any AI-assisted output before
                using it commercially. You should make sure the content is
                suitable, lawful and does not infringe third-party rights.
              </p>
            ),
          },
          {
            question: "Do I own my uploaded designs?",
            answer: (
              <p>
                You retain ownership of your uploaded content, subject to any
                rights held by others. Ryfio needs a limited licence to process,
                display, store, preview, export and fulfil your designs as part
                of the service.
              </p>
            ),
          },
        ],
      },
      {
        id: "checkout",
        eyebrow: "05",
        title: "Checkout and Payments",
        icon: CreditCard,
        items: [
          {
            question: "How does checkout work?",
            answer: (
              <p>
                After creating or selecting products, items can be reviewed in
                the cart, shipping details can be entered and payment can be
                completed through the available checkout flow.
              </p>
            ),
          },
          {
            question: "Does Ryfio store my card details?",
            answer: (
              <p>
                Ryfio does not store full card numbers or CVC codes on its own
                servers. Payments may be processed by third-party providers such
                as Stripe.
              </p>
            ),
          },
          {
            question: "Can promo codes be used?",
            answer: (
              <p>
                Promo codes may be available during selected campaigns. Codes
                may expire, be limited to certain products, regions or users and
                may not be combinable with other offers.
              </p>
            ),
          },
        ],
      },
      {
        id: "shipping",
        eyebrow: "06",
        title: "Shipping",
        icon: Truck,
        items: [
          {
            question: "How long does shipping take?",
            answer: (
              <p>
                Shipping time depends on production, product type, destination
                and carrier. Production usually takes 2–7 business days before
                shipping. Delivery estimates vary by region.
              </p>
            ),
          },
          {
            question: "Do orders include tracking?",
            answer: (
              <p>
                Tracking is provided when available. Some economy shipping
                methods may have limited tracking or delayed carrier scans.
              </p>
            ),
          },
          {
            question: "Can orders arrive separately?",
            answer: (
              <p>
                Yes. Products may ship separately if they are produced in
                different facilities, require different production times or use
                different carriers.
              </p>
            ),
          },
        ],
      },
      {
        id: "refunds",
        eyebrow: "07",
        title: "Refunds and Returns",
        icon: RotateCcw,
        items: [
          {
            question: "Can I return a custom product?",
            answer: (
              <p>
                Custom print-on-demand products are usually not returnable for
                change of mind. Refunds or replacements may be available for
                damaged, defective or incorrectly produced items.
              </p>
            ),
          },
          {
            question: "What should I do if my item arrives damaged?",
            answer: (
              <p>
                Contact support as soon as possible with your order details and
                clear photos of the item and packaging so the issue can be
                reviewed.
              </p>
            ),
          },
          {
            question: "Can I cancel an order?",
            answer: (
              <p>
                Cancellation may not be possible once an order has entered
                production. Print-on-demand products can move into production
                quickly after payment confirmation.
              </p>
            ),
          },
        ],
      },
      {
        id: "privacy",
        eyebrow: "08",
        title: "Privacy and Security",
        icon: LockKeyhole,
        items: [
          {
            question: "How does Ryfio handle personal data?",
            answer: (
              <p>
                Ryfio collects and uses information needed to operate the
                platform, secure accounts, process orders, provide support and
                comply with legal obligations. More detail is available in the
                Privacy Policy.
              </p>
            ),
          },
          {
            question: "Does Ryfio use cookies?",
            answer: (
              <p>
                Yes. Ryfio may use essential, preference, analytics and
                marketing cookies depending on the feature and consent
                requirements. See the Cookie Policy for details.
              </p>
            ),
          },
          {
            question: "Is Ryfio secure?",
            answer: (
              <p>
                Ryfio uses technical and organisational measures designed to
                protect accounts and platform data, including HTTPS, provider
                security controls and access protections.
              </p>
            ),
          },
        ],
      },
    ],
    []
  );

  const filteredSections = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return sections;

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          const question = item.question.toLowerCase();
          return question.includes(clean) || section.title.toLowerCase().includes(clean);
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [query, sections]);

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
            <HelpCircle size={15} />
            Support Center
          </div>

          <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-7xl">
            FAQ
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-white/58 sm:text-lg">
            Answers to common questions about Ryfio, print-on-demand products,
            AI tools, checkout, shipping, refunds and privacy.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-white/45">
            <span className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2">
              Updated: {LAST_UPDATED}
            </span>
            <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-purple-200">
              Creator support
            </span>
            <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-cyan-200">
              Fast answers
            </span>
          </div>

          <div className="relative mt-8 max-w-2xl">
            <Search
              size={18}
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search questions..."
              className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-12 pr-5 text-sm text-white outline-none backdrop-blur-xl transition placeholder:text-white/30 focus:border-purple-500/50"
            />
          </div>
        </div>
      </section>

      <section className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-24 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <div className="rounded-[30px] border border-white/10 bg-white/[0.035] p-4 shadow-[0_0_55px_rgba(168,85,247,0.10)] backdrop-blur-2xl">
              <p className="mb-4 px-3 text-xs font-black uppercase tracking-[0.22em] text-white/35">
                Categories
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
                    Ryfio FAQ
                  </p>
                  <p className="mt-2 text-sm text-white/45">
                    Quick answers for creators, customers and early users.
                  </p>
                </div>

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(168,85,247,0.32)] transition hover:scale-[1.02]"
                >
                  Contact Support
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>

            <div className="divide-y divide-white/10">
              {filteredSections.length > 0 ? (
                filteredSections.map((section, sectionIndex) => {
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

                      <div className="rounded-[26px] border border-white/10 bg-white/[0.025] px-5 sm:px-6">
                        {section.items.map((item, itemIndex) => (
                          <FaqRow
                            key={item.question}
                            item={item}
                            defaultOpen={sectionIndex === 0 && itemIndex === 0}
                          />
                        ))}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="px-5 py-12 text-white/55 sm:px-8 lg:px-10">
                  No FAQ results found. Try another search or contact support.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {showTop ? (
        <button
          type="button"
          onClick={() => safeScrollTo("general")}
          className="fixed bottom-5 right-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-white shadow-[0_0_30px_rgba(168,85,247,0.18)] backdrop-blur-xl transition hover:scale-105 hover:text-purple-200"
          aria-label="Back to top"
        >
          <ChevronUp size={22} />
        </button>
      ) : null}

      <style jsx global>{`
        .faq-copy p {
          margin-bottom: 1.25rem;
        }

        .faq-copy p:last-child {
          margin-bottom: 0;
        }

        .faq-copy a {
          color: rgb(216 180 254);
          font-weight: 800;
          text-underline-offset: 4px;
        }

        .faq-copy a:hover {
          text-decoration: underline;
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </main>
  );
}
