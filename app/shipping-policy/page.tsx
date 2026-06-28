"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronUp,
  Clock3,
  FileText,
  Globe2,
  HelpCircle,
  Mail,
  MapPin,
  PackageCheck,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  Truck,
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
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Shipping Policy", href: "/shipping-policy", active: true },
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

export default function ShippingPolicyPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  const sections: Section[] = useMemo(
    () => [
      {
        id: "overview",
        eyebrow: "01",
        title: "Overview",
        icon: Truck,
        content: (
          <>
            <p>
              This Shipping Policy explains how shipping works for physical
              products ordered through Ryfio, including production times,
              estimated delivery, tracking, customs, failed deliveries and
              shipping-related support.
            </p>
            <p>
              Ryfio is a print-on-demand platform. Many products are produced
              after payment confirmation and may be fulfilled by third-party
              print, logistics or carrier partners. Shipping times can vary
              depending on product type, fulfilment location, destination,
              carrier performance and seasonal demand.
            </p>
            <p>
              Delivery estimates are provided for convenience and are not
              guaranteed unless explicitly stated at checkout or required by
              applicable law.
            </p>
          </>
        ),
      },
      {
        id: "production-times",
        eyebrow: "02",
        title: "Production Times",
        icon: Clock3,
        content: (
          <>
            <p>
              Most Ryfio products are made on demand. Production usually begins
              only after payment has been confirmed and the order details have
              been accepted by the fulfilment system.
            </p>
            <ul>
              <li>Standard production is typically 2–7 business days.</li>
              <li>Complex products, peak periods or supply issues may take longer.</li>
              <li>Production time is separate from shipping time.</li>
              <li>Orders with multiple products may be produced separately.</li>
            </ul>
            <p>
              If an order contains multiple items, they may be produced in
              different facilities and may arrive in separate shipments.
            </p>
          </>
        ),
      },
      {
        id: "delivery-estimates",
        eyebrow: "03",
        title: "Estimated Delivery Times",
        icon: PackageCheck,
        content: (
          <>
            <p>
              Delivery time begins after the product has been produced and
              handed to the carrier. Estimated delivery depends on the shipping
              destination, selected service, fulfilment location and carrier.
            </p>
            <ul>
              <li>Europe: commonly 3–10 business days after production.</li>
              <li>United States: commonly 3–8 business days after production.</li>
              <li>International destinations: delivery varies by country and customs.</li>
            </ul>
            <p>
              These are general estimates. Actual delivery may be faster or
              slower depending on local carrier operations, customs processing,
              weather, public holidays and other events outside Ryfio’s direct
              control.
            </p>
          </>
        ),
      },
      {
        id: "shipping-costs",
        eyebrow: "04",
        title: "Shipping Costs",
        icon: ReceiptText,
        content: (
          <>
            <p>
              Shipping costs may be calculated during checkout based on product
              type, quantity, destination, shipping method, fulfilment location
              and carrier availability.
            </p>
            <p>
              If taxes, duties, customs charges or other destination-specific
              fees apply, they may be charged separately by the carrier, customs
              authority or relevant provider unless clearly included during
              checkout.
            </p>
            <p>
              Promotional free shipping, discounted shipping or bundled shipping
              may be offered from time to time and may be subject to additional
              conditions.
            </p>
          </>
        ),
      },
      {
        id: "tracking",
        eyebrow: "05",
        title: "Order Tracking",
        icon: MapPin,
        content: (
          <>
            <p>
              When tracking is available, Ryfio or its fulfilment partner may
              provide a tracking number or tracking link after the order is
              shipped.
            </p>
            <ul>
              <li>Tracking may take time to update after dispatch.</li>
              <li>Some economy shipping methods may offer limited tracking.</li>
              <li>Carrier scans may be delayed during busy periods.</li>
              <li>Local carriers may handle the final delivery stage.</li>
            </ul>
            <p>
              If tracking has not updated for several business days, contact
              support so we can help review the shipment status.
            </p>
          </>
        ),
      },
      {
        id: "customs",
        eyebrow: "06",
        title: "Customs, Duties and Taxes",
        icon: Globe2,
        content: (
          <>
            <p>
              International orders may be subject to customs duties, VAT, import
              taxes, brokerage fees or other charges imposed by the destination
              country. These charges are generally the responsibility of the
              recipient unless clearly stated otherwise at checkout.
            </p>
            <p>
              Customs processing may delay delivery. Ryfio cannot control how
              long customs authorities take to review or release a shipment.
            </p>
            <p>
              If a package is refused because of unpaid customs charges, the
              order may not be eligible for a refund, especially where the
              product is custom-made or cannot be reused.
            </p>
          </>
        ),
      },
      {
        id: "incorrect-address",
        eyebrow: "07",
        title: "Incorrect or Incomplete Address",
        icon: AlertTriangle,
        content: (
          <>
            <p>
              Customers are responsible for providing a complete and accurate
              shipping address during checkout. This includes name, street,
              house number, postcode, city, country, phone number where required
              and any apartment, unit or delivery instructions.
            </p>
            <p>
              Ryfio is not responsible for failed delivery caused by incorrect,
              incomplete or outdated address information provided by the
              customer.
            </p>
            <p>
              If an order is returned, lost or undeliverable because of address
              issues, additional production, shipping or handling charges may
              apply before reshipment.
            </p>
          </>
        ),
      },
      {
        id: "lost-delayed-damaged",
        eyebrow: "08",
        title: "Lost, Delayed or Damaged Shipments",
        icon: ShieldCheck,
        content: (
          <>
            <p>
              If an order appears lost, delayed or damaged in transit, contact
              Ryfio support with your order number and any available tracking
              information.
            </p>
            <ul>
              <li>For delayed shipments, we may ask the carrier for an update.</li>
              <li>For damaged shipments, photos of the item and packaging may be required.</li>
              <li>For lost shipments, carrier confirmation may be needed before resolution.</li>
              <li>Resolution may include replacement, refund or another appropriate remedy.</li>
            </ul>
            <p>
              Shipping delays alone do not automatically qualify for a refund,
              but we will help investigate reasonable delivery concerns.
            </p>
          </>
        ),
      },
      {
        id: "failed-delivery",
        eyebrow: "09",
        title: "Failed Delivery and Returns to Sender",
        icon: RotateCcw,
        content: (
          <>
            <p>
              A shipment may fail or be returned to sender if the address is
              incomplete, the recipient is unavailable, customs charges are
              refused, the parcel is not collected or the carrier cannot
              complete delivery.
            </p>
            <p>
              If a package is returned to a fulfilment partner, we will review
              the case and advise whether reshipment is possible. Additional
              costs may apply, especially if the failed delivery was caused by
              incorrect customer information or non-collection.
            </p>
            <p>
              Custom-made products may not be eligible for refund after a failed
              delivery if they cannot reasonably be reused, resold or recovered.
            </p>
          </>
        ),
      },
      {
        id: "split-shipments",
        eyebrow: "10",
        title: "Split Shipments",
        icon: PackageCheck,
        content: (
          <>
            <p>
              Orders with multiple products may ship separately. This can happen
              when products are produced in different facilities, require
              different production times or use different packaging or carriers.
            </p>
            <p>
              If only part of your order has arrived, check the tracking details
              and contact support if you believe an item is missing or unusually
              delayed.
            </p>
          </>
        ),
      },
      {
        id: "international-shipping",
        eyebrow: "11",
        title: "International Shipping",
        icon: Globe2,
        content: (
          <>
            <p>
              Ryfio may support international shipping depending on product
              availability, fulfilment coverage and destination restrictions.
              Some products may not be available in every region.
            </p>
            <p>
              International delivery may be affected by customs, local postal
              services, import rules, sanctions, carrier limitations or
              destination-specific restrictions.
            </p>
            <p>
              If an order cannot be fulfilled or shipped to a selected
              destination, Ryfio may cancel the order and issue an appropriate
              refund.
            </p>
          </>
        ),
      },
      {
        id: "force-majeure",
        eyebrow: "12",
        title: "Events Outside Our Control",
        icon: AlertTriangle,
        content: (
          <>
            <p>
              Ryfio is not responsible for shipping delays or failures caused by
              events outside our reasonable control, including weather, strikes,
              carrier disruptions, customs delays, war, natural disasters,
              epidemics, supply chain disruption, government action or technical
              failures affecting third-party providers.
            </p>
            <p>
              We will make reasonable efforts to help resolve affected orders,
              but delivery estimates may change during these events.
            </p>
          </>
        ),
      },
      {
        id: "consumer-rights",
        eyebrow: "13",
        title: "Consumer Rights",
        icon: HelpCircle,
        content: (
          <>
            <p>
              Nothing in this Shipping Policy limits any mandatory consumer
              rights that apply under your local law. Where local law gives you
              stronger rights, those rights will apply.
            </p>
            <p>
              Shipping issues may also be reviewed together with our Refund
              Policy, Terms of Service and any mandatory consumer protection
              rules that apply to the order.
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
              We may update this Shipping Policy from time to time to reflect
              changes in products, fulfilment partners, shipping regions,
              carriers, checkout options or legal requirements.
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
              If you have questions about shipping or need help with an order,
              contact us through the Contact page or by email.
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
            <Truck size={15} />
            Legal Center
          </div>

          <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-7xl">
            Shipping Policy
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-white/58 sm:text-lg">
            Shipping, production, delivery and tracking rules for custom
            print-on-demand orders placed through Ryfio.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-white/45">
            <span className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2">
              Last updated: {LAST_UPDATED}
            </span>
            <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-purple-200">
              Print-on-demand
            </span>
            <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-cyan-200">
              Global fulfilment
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
                    Ryfio Shipping
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
