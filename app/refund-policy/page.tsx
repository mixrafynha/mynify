"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Camera,
  CheckCircle2,
  ChevronUp,
  Clock3,
  CreditCard,
  FileText,
  HelpCircle,
  Mail,
  PackageCheck,
  RotateCcw,
  Scale,
  ShieldCheck,
  Truck,
  XCircle,
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
  { label: "Terms", href: "/terms" },
  { label: "Refund Policy", href: "/refund-policy", active: true },
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

export default function RefundPolicyPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  const sections: Section[] = useMemo(
    () => [
      {
        id: "overview",
        eyebrow: "01",
        title: "Overview",
        icon: RotateCcw,
        content: (
          <>
            <p>
              This Refund Policy explains when refunds, replacements or order
              reviews may be available for products and services purchased
              through Ryfio.
            </p>
            <p>
              Ryfio is a print-on-demand platform. Many products are made only
              after an order is placed and may be customised with user-provided
              designs, images, text, colours or product settings. Because of
              this, custom products are generally not eligible for return or
              refund simply because a customer changed their mind.
            </p>
            <p>
              We want every order to be produced correctly. If an item arrives
              damaged, defective, incorrectly produced or materially different
              from the confirmed order, we will review the issue and may offer a
              replacement, refund or other appropriate solution.
            </p>
          </>
        ),
      },
      {
        id: "custom-products",
        eyebrow: "02",
        title: "Custom and Print-on-Demand Products",
        icon: PackageCheck,
        content: (
          <>
            <p>
              Most Ryfio orders are personalised or produced on demand. This
              means production may begin shortly after payment confirmation and
              the product may be created specifically for that order.
            </p>
            <p>
              Unless required by applicable law, we usually cannot accept returns
              or issue refunds for custom products where:
            </p>
            <ul>
              <li>The customer changed their mind after ordering.</li>
              <li>The wrong size, colour or variant was selected by the customer.</li>
              <li>The shipping address was entered incorrectly.</li>
              <li>The customer no longer wants the product.</li>
              <li>The design was uploaded with low resolution or incorrect details.</li>
              <li>The final print has minor differences caused by material, screen or print method variations.</li>
            </ul>
          </>
        ),
      },
      {
        id: "eligible-refunds",
        eyebrow: "03",
        title: "When a Refund or Replacement May Be Available",
        icon: CheckCircle2,
        content: (
          <>
            <p>
              You may be eligible for a refund, replacement or order review if
              the issue is caused by production, fulfilment, shipping damage or
              a confirmed error outside your control.
            </p>
            <ul>
              <li>The item arrived damaged.</li>
              <li>The product has a manufacturing defect.</li>
              <li>The wrong product, size, colour or variant was sent.</li>
              <li>The print is materially different from the confirmed design file.</li>
              <li>Part of the order is missing.</li>
              <li>The order is confirmed as lost by the carrier or fulfilment partner.</li>
            </ul>
            <p>
              Each case is reviewed individually. We may require photos, order
              details, packaging photos, delivery information or additional
              evidence before approving a refund or replacement.
            </p>
          </>
        ),
      },
      {
        id: "not-eligible",
        eyebrow: "04",
        title: "When Refunds Are Usually Not Available",
        icon: XCircle,
        content: (
          <>
            <p>
              Refunds are usually not available when the issue was caused by
              customer input, design choices or information provided during
              checkout.
            </p>
            <ul>
              <li>Incorrect shipping address entered at checkout.</li>
              <li>Wrong size, colour, product type or quantity selected.</li>
              <li>Design mistakes, typos or artwork issues confirmed by the customer.</li>
              <li>Low-resolution uploads, transparent background issues or poor image quality.</li>
              <li>Minor colour variation between screen preview and printed product.</li>
              <li>Normal differences caused by fabric, mug coating, print area, lighting or material texture.</li>
              <li>Buyer’s remorse or change of mind after the order has entered production.</li>
            </ul>
          </>
        ),
      },
      {
        id: "reporting-window",
        eyebrow: "05",
        title: "Reporting Window",
        icon: Clock3,
        content: (
          <>
            <p>
              Please contact us as soon as possible if there is a problem with
              your order. To help us investigate effectively, refund or
              replacement requests should normally be submitted within 14 days of
              delivery.
            </p>
            <p>
              If the order appears lost, delayed or marked as delivered but not
              received, contact us promptly so we can review the tracking status
              and ask the fulfilment or shipping partner for more information.
            </p>
            <p>
              Requests submitted after the reporting window may be harder to
              verify and may not be eligible for a refund or replacement, unless
              required by applicable law.
            </p>
          </>
        ),
      },
      {
        id: "evidence",
        eyebrow: "06",
        title: "Evidence Required",
        icon: Camera,
        content: (
          <>
            <p>
              To review a refund or replacement request, we may ask for evidence
              showing the issue clearly.
            </p>
            <ul>
              <li>Order number or checkout reference.</li>
              <li>Clear photos of the full product.</li>
              <li>Close-up photos of the defect, print issue or damage.</li>
              <li>Photos of packaging if the item arrived damaged.</li>
              <li>Tracking information or delivery screenshots where relevant.</li>
              <li>A short explanation of what is wrong with the item.</li>
            </ul>
            <p>
              Please do not return products before contacting support. In many
              print-on-demand cases, we can review the issue using photos and do
              not need the product to be sent back.
            </p>
          </>
        ),
      },
      {
        id: "replacements",
        eyebrow: "07",
        title: "Replacements",
        icon: PackageCheck,
        content: (
          <>
            <p>
              If the issue is confirmed, we may offer a replacement instead of a
              refund. A replacement may be appropriate when the product was
              damaged, defective, incorrectly printed or incorrectly fulfilled.
            </p>
            <p>
              Replacement production and delivery times may depend on product
              availability, fulfilment partner capacity, destination and carrier
              performance.
            </p>
            <p>
              If a replacement cannot reasonably be produced or delivered, we may
              offer a refund or another suitable solution.
            </p>
          </>
        ),
      },
      {
        id: "shipping-issues",
        eyebrow: "08",
        title: "Shipping Issues",
        icon: Truck,
        content: (
          <>
            <p>
              Shipping delays do not automatically qualify for a refund. Delivery
              times can vary because of carrier delays, customs processing,
              weather, holidays, address issues or other events outside Ryfio’s
              control.
            </p>
            <p>
              If tracking shows that an order is lost, returned, damaged in
              transit or undeliverable, we will review the case with the relevant
              fulfilment or shipping partner.
            </p>
            <p>
              If an order is returned because the shipping address was incorrect,
              incomplete or not accepted by the carrier, additional shipping or
              reprocessing costs may apply.
            </p>
          </>
        ),
      },
      {
        id: "digital-services",
        eyebrow: "09",
        title: "Digital Services and Platform Fees",
        icon: CreditCard,
        content: (
          <>
            <p>
              Ryfio may offer digital features, platform services, subscriptions,
              credits or paid tools in addition to physical products. Refunds for
              digital services may depend on the type of service, whether it was
              already used and the applicable law.
            </p>
            <p>
              If a digital feature, credit or platform service is purchased and
              immediately consumed, generated, exported or used, it may not be
              refundable unless required by law or caused by a confirmed platform
              error.
            </p>
          </>
        ),
      },
      {
        id: "refund-processing",
        eyebrow: "10",
        title: "Refund Processing",
        icon: CreditCard,
        content: (
          <>
            <p>
              Approved refunds are usually returned to the original payment
              method. Processing times can vary depending on the payment
              provider, card issuer, bank, currency and country.
            </p>
            <p>
              Ryfio may refund the full order amount or a partial amount
              depending on the issue. Shipping costs, taxes, duties and fees may
              be refundable only where required by law or where the issue was
              caused by a confirmed production or fulfilment error.
            </p>
            <p>
              We cannot control how long your bank or payment provider takes to
              make funds available after a refund has been issued.
            </p>
          </>
        ),
      },
      {
        id: "chargebacks",
        eyebrow: "11",
        title: "Chargebacks and Payment Disputes",
        icon: AlertTriangle,
        content: (
          <>
            <p>
              If you have an issue with an order, please contact Ryfio support
              first so we can review the problem. Opening a chargeback or payment
              dispute without contacting us may delay the resolution process.
            </p>
            <p>
              We reserve the right to provide order evidence, design approvals,
              tracking information, support history and payment records to the
              payment provider when responding to a dispute.
            </p>
          </>
        ),
      },
      {
        id: "consumer-rights",
        eyebrow: "12",
        title: "Consumer Rights",
        icon: Scale,
        content: (
          <>
            <p>
              Nothing in this policy limits any mandatory consumer rights that
              apply under your local law. Some jurisdictions provide specific
              cancellation, refund, warranty or defect rights that cannot be
              excluded.
            </p>
            <p>
              Custom-made and personalised products may be treated differently
              from standard products under consumer protection laws. Where local
              law gives you rights that are stronger than this policy, those
              rights will apply.
            </p>
          </>
        ),
      },
      {
        id: "how-to-request",
        eyebrow: "13",
        title: "How to Request a Refund or Replacement",
        icon: HelpCircle,
        content: (
          <>
            <p>
              To request a refund, replacement or order review, contact us with
              the details needed to investigate the issue.
            </p>
            <ul>
              <li>Your order number or checkout reference.</li>
              <li>The email address used for the order.</li>
              <li>A clear description of the issue.</li>
              <li>Photos or other evidence where relevant.</li>
              <li>Your preferred resolution, such as replacement or refund.</li>
            </ul>
            <p>
              We will review the request and respond with the next steps. In
              some cases, we may need additional information from you or from a
              fulfilment partner.
            </p>
          </>
        ),
      },
      {
        id: "changes",
        eyebrow: "14",
        title: "Changes to This Policy",
        icon: FileText,
        content: (
          <>
            <p>
              We may update this Refund Policy from time to time to reflect
              changes in Ryfio, fulfilment partners, payment providers, consumer
              protection requirements or operational practices.
            </p>
            <p>
              The “Last updated” date at the top of this page shows when this
              policy was last revised.
            </p>
          </>
        ),
      },
      {
        id: "contact",
        eyebrow: "15",
        title: "Contact",
        icon: Mail,
        content: (
          <>
            <p>
              If you have questions about this Refund Policy or need help with
              an order, contact us through the Contact page or by email.
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
            <RotateCcw size={15} />
            Legal Center
          </div>

          <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-7xl">
            Refund Policy
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-white/58 sm:text-lg">
            Clear rules for refunds, replacements, damaged items, custom
            products and print-on-demand orders placed through Ryfio.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-white/45">
            <span className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2">
              Last updated: {LAST_UPDATED}
            </span>
            <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-purple-200">
              Custom products
            </span>
            <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-cyan-200">
              Order protection
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
                    Ryfio Refunds
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
