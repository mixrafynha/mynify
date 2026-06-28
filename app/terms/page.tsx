"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Ban,
  ChevronUp,
  CreditCard,
  FileCheck2,
  FileText,
  Gavel,
  Globe2,
  LockKeyhole,
  Mail,
  PackageCheck,
  Scale,
  ShieldCheck,
  Sparkles,
  UserRound,
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

const legalLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms", active: true },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Cookies", href: "/cookies" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
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

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  const sections: Section[] = useMemo(
    () => [
      {
        id: "overview",
        eyebrow: "01",
        title: "Overview",
        icon: FileCheck2,
        content: (
          <>
            <p>
              These Terms of Service govern your access to and use of Ryfio,
              including our website, dashboard, product editor, design tools,
              cart, checkout, order management features and related services.
            </p>
            <p>
              By creating an account, using Ryfio, saving a design, placing an
              order or accessing any part of the platform, you agree to these
              Terms. If you do not agree, you must not use Ryfio.
            </p>
            <p>
              Ryfio provides software and commerce tools for creating,
              customizing and selling print-on-demand products. Some features
              may rely on third-party services such as payment processors,
              hosting providers, fulfilment partners, analytics tools,
              authentication providers and address autocomplete services.
            </p>
          </>
        ),
      },
      {
        id: "eligibility",
        eyebrow: "02",
        title: "Eligibility",
        icon: UserRound,
        content: (
          <>
            <p>
              You must be legally able to enter into a binding agreement to use
              Ryfio. If you use Ryfio on behalf of a business, brand, agency or
              organisation, you confirm that you have authority to accept these
              Terms on its behalf.
            </p>
            <p>
              You may not use Ryfio if you are prohibited from receiving our
              services under applicable laws, sanctions rules, export control
              laws or platform restrictions.
            </p>
            <p>
              Ryfio is not intended for children under the minimum legal age
              required to use online commerce services in their country.
            </p>
          </>
        ),
      },
      {
        id: "accounts",
        eyebrow: "03",
        title: "Accounts and Security",
        icon: LockKeyhole,
        content: (
          <>
            <p>
              Some parts of Ryfio require an account. You agree to provide
              accurate, current and complete information when creating or using
              your account.
            </p>
            <ul>
              <li>You are responsible for maintaining the security of your account.</li>
              <li>You must not share access credentials with unauthorised users.</li>
              <li>You must notify us if you suspect unauthorised access.</li>
              <li>You are responsible for activity that occurs under your account.</li>
            </ul>
            <p>
              We may require additional verification where needed to protect the
              platform, prevent fraud, comply with legal obligations or resolve
              account ownership disputes.
            </p>
          </>
        ),
      },
      {
        id: "platform-use",
        eyebrow: "04",
        title: "Use of the Platform",
        icon: Sparkles,
        content: (
          <>
            <p>
              Ryfio gives you access to tools for creating, editing, previewing,
              saving, ordering and selling custom products. You agree to use the
              platform lawfully, responsibly and only for its intended purpose.
            </p>
            <p>
              We may update, improve, remove or limit features at any time. We
              may also introduce new functionality, change workflows or modify
              how products, designs, checkout or fulfilment operate.
            </p>
            <p>
              We try to keep Ryfio available and reliable, but we do not
              guarantee that the platform will always be uninterrupted,
              error-free or compatible with every browser, device, integration
              or third-party service.
            </p>
          </>
        ),
      },
      {
        id: "user-content",
        eyebrow: "05",
        title: "User Content and Intellectual Property",
        icon: FileText,
        content: (
          <>
            <p>
              You keep ownership of the designs, images, text, artwork,
              branding and other content you upload or create in Ryfio, subject
              to any rights held by others.
            </p>
            <p>
              By uploading, saving or using content on Ryfio, you grant Ryfio a
              limited, worldwide, non-exclusive licence to host, store, process,
              reproduce, display, resize, transform, preview, export, print,
              fulfil and otherwise use that content as necessary to provide the
              service.
            </p>
            <p>
              You confirm that you have all rights, licences and permissions
              required to use the content you upload, including logos,
              trademarks, photographs, fonts, artwork, characters, slogans and
              other protected material.
            </p>
          </>
        ),
      },
      {
        id: "ai-content",
        eyebrow: "06",
        title: "AI and Generated Content",
        icon: Sparkles,
        content: (
          <>
            <p>
              Ryfio may include AI-assisted tools for product creation, mockups,
              text generation, recommendations, design assistance or workflow
              automation. AI outputs may be inaccurate, incomplete or unsuitable
              for commercial use without review.
            </p>
            <p>
              You are responsible for reviewing AI-assisted content before using
              it, publishing it, printing it, selling it or relying on it. You
              must ensure that generated content does not infringe third-party
              rights, violate laws or breach these Terms.
            </p>
            <p>
              We do not guarantee that AI-generated content will be unique,
              protectable, free from third-party claims or legally safe for all
              commercial contexts.
            </p>
          </>
        ),
      },
      {
        id: "orders",
        eyebrow: "07",
        title: "Print-on-Demand Orders",
        icon: PackageCheck,
        content: (
          <>
            <p>
              Ryfio may allow you or your customers to order custom products
              based on saved designs. Orders may be produced by third-party
              print-on-demand, fulfilment or logistics partners.
            </p>
            <p>
              You are responsible for checking the design, product, colour,
              size, variant, quantity, shipping address and order details before
              completing checkout. Custom products may enter production quickly
              after payment confirmation and may not be cancellable once
              production begins.
            </p>
            <p>
              Product images and mockups are previews. Final colours, placement,
              scale, texture and print appearance may vary depending on product
              type, material, print method, screen settings and production
              limitations.
            </p>
          </>
        ),
      },
      {
        id: "payments",
        eyebrow: "08",
        title: "Pricing, Payments and Taxes",
        icon: CreditCard,
        content: (
          <>
            <p>
              Prices, currency, shipping costs, taxes, discounts and fees may be
              shown during checkout. Final amounts may depend on destination,
              fulfilment availability, selected product, order quantity and
              applicable tax rules.
            </p>
            <p>
              Payments may be processed by third-party payment providers such as
              Stripe. By paying through Ryfio, you also agree to the applicable
              payment provider terms and authorise the payment provider to
              process your transaction.
            </p>
            <p>
              Ryfio may refuse, cancel, refund or place orders on hold where we
              detect fraud, pricing errors, payment issues, supply problems,
              legal concerns, policy violations or fulfilment restrictions.
            </p>
          </>
        ),
      },
      {
        id: "refunds",
        eyebrow: "09",
        title: "Refunds, Returns and Cancellations",
        icon: Scale,
        content: (
          <>
            <p>
              Refunds, returns and cancellations are governed by our Refund
              Policy and Shipping Policy. Because print-on-demand products are
              often custom-made, returns for change of mind may not be available.
            </p>
            <p>
              We may offer a replacement, refund or other remedy where a product
              is defective, damaged, incorrectly produced or materially different
              from the confirmed order, subject to evidence, timing and partner
              rules.
            </p>
            <p>
              You must contact support promptly with order details, photos and a
              description of the issue so we can investigate.
            </p>
          </>
        ),
      },
      {
        id: "prohibited-uses",
        eyebrow: "10",
        title: "Prohibited Uses",
        icon: Ban,
        content: (
          <>
            <p>You must not use Ryfio to create, upload, sell or distribute content that:</p>
            <ul>
              <li>Infringes copyrights, trademarks, publicity rights or other rights.</li>
              <li>Contains illegal, hateful, abusive, exploitative or violent material.</li>
              <li>Promotes scams, fraud, deception, malware or unlawful activity.</li>
              <li>Violates sanctions, export controls or other applicable restrictions.</li>
              <li>Attempts to bypass security, rate limits, authentication or platform controls.</li>
              <li>Interferes with Ryfio, our users, infrastructure or third-party providers.</li>
            </ul>
            <p>
              We may remove content, block orders, limit features or suspend
              accounts where we believe these Terms have been violated.
            </p>
          </>
        ),
      },
      {
        id: "suspension",
        eyebrow: "11",
        title: "Suspension and Termination",
        icon: AlertTriangle,
        content: (
          <>
            <p>
              We may suspend, restrict or terminate access to Ryfio if we
              believe you violated these Terms, created legal risk, abused the
              platform, failed to pay amounts owed, infringed third-party rights
              or created security concerns.
            </p>
            <p>
              You may stop using Ryfio at any time. Some information may remain
              stored where necessary for legal, accounting, fraud prevention,
              support, dispute resolution or legitimate business purposes.
            </p>
          </>
        ),
      },
      {
        id: "disclaimers",
        eyebrow: "12",
        title: "Disclaimers",
        icon: ShieldCheck,
        content: (
          <>
            <p>
              Ryfio is provided on an “as is” and “as available” basis. To the
              maximum extent permitted by law, we disclaim warranties of
              merchantability, fitness for a particular purpose, non-infringement
              and uninterrupted availability.
            </p>
            <p>
              We do not guarantee that every product will be available in every
              region, that every mockup will exactly match the final printed
              product, or that third-party services will operate without
              interruption.
            </p>
          </>
        ),
      },
      {
        id: "liability",
        eyebrow: "13",
        title: "Limitation of Liability",
        icon: Scale,
        content: (
          <>
            <p>
              To the maximum extent permitted by law, Ryfio will not be liable
              for indirect, incidental, special, consequential, exemplary or
              punitive damages, including lost profits, lost revenue, lost data,
              business interruption or loss of goodwill.
            </p>
            <p>
              Our total liability for any claim related to Ryfio will be limited
              to the amount you paid to Ryfio for the specific service or order
              giving rise to the claim, unless applicable law requires otherwise.
            </p>
            <p>
              Nothing in these Terms excludes liability that cannot be excluded
              under applicable law.
            </p>
          </>
        ),
      },
      {
        id: "indemnification",
        eyebrow: "14",
        title: "Indemnification",
        icon: Gavel,
        content: (
          <>
            <p>
              You agree to defend, indemnify and hold Ryfio harmless from claims,
              damages, losses, liabilities, costs and expenses arising from your
              use of the platform, your content, your products, your breach of
              these Terms, your violation of law or your infringement of
              third-party rights.
            </p>
          </>
        ),
      },
      {
        id: "governing-law",
        eyebrow: "15",
        title: "Governing Law",
        icon: Globe2,
        content: (
          <>
            <p>
              These Terms are intended to be interpreted under the laws
              applicable to Ryfio’s operations and the user’s mandatory consumer
              protection rights where required by law.
            </p>
            <p>
              If you operate Ryfio as a registered business, update this section
              with the legal entity name, registered address, governing law and
              dispute forum that apply to your company.
            </p>
          </>
        ),
      },
      {
        id: "changes",
        eyebrow: "16",
        title: "Changes to These Terms",
        icon: FileText,
        content: (
          <>
            <p>
              We may update these Terms from time to time. When changes are
              material, we may notify users through the website, dashboard or
              email where appropriate.
            </p>
            <p>
              Continued use of Ryfio after changes become effective means you
              accept the updated Terms.
            </p>
          </>
        ),
      },
      {
        id: "contact",
        eyebrow: "17",
        title: "Contact",
        icon: Mail,
        content: (
          <>
            <p>
              If you have questions about these Terms, contact us through the
              Contact page or by email.
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
            <FileCheck2 size={15} />
            Legal Center
          </div>

          <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-7xl">
            Terms of Service
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-white/58 sm:text-lg">
            The rules that govern the use of Ryfio, including accounts, designs,
            products, checkout, payments and print-on-demand orders.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-white/45">
            <span className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2">
              Last updated: {LAST_UPDATED}
            </span>
            <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-purple-200">
              Creator terms
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
                Legal Pages
              </p>

              <div className="flex flex-col gap-2">
                {legalLinks.map((item) => (
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
                    Ryfio Terms
                  </p>
                  <p className="mt-2 text-sm text-white/45">
                    This page is informational and does not replace independent
                    legal advice.
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

                    <div className="legal-copy max-w-3xl text-[15px] leading-8 text-white/58 sm:text-base">
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
        .legal-copy p {
          margin-bottom: 1.25rem;
        }

        .legal-copy p:last-child {
          margin-bottom: 0;
        }

        .legal-copy ul {
          margin: 1.25rem 0;
          display: grid;
          gap: 0.7rem;
          padding-left: 1.15rem;
        }

        .legal-copy li {
          padding-left: 0.25rem;
        }

        .legal-copy strong {
          color: rgba(255, 255, 255, 0.88);
          font-weight: 800;
        }

        .legal-copy a {
          color: rgb(216 180 254);
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </main>
  );
}
