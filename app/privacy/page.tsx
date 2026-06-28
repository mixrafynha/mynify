"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ChevronUp,
  Cookie,
  CreditCard,
  Database,
  FileText,
  Globe2,
  LockKeyhole,
  Mail,
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
  { label: "Privacy", href: "/privacy", active: true },
  { label: "Terms", href: "/terms" },
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

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  const sections: Section[] = useMemo(
    () => [
      {
        id: "overview",
        eyebrow: "01",
        title: "Overview",
        icon: ShieldCheck,
        content: (
          <>
            <p>
              This Privacy Policy explains how Ryfio collects, uses, stores and
              protects personal information when you use our website, dashboard,
              product editor, checkout, customer support tools and related
              services.
            </p>
            <p>
              Ryfio is an AI-powered print-on-demand and commerce platform. We
              use information only where it is necessary to provide the service,
              protect accounts, process orders, improve product quality, comply
              with legal obligations and communicate with users.
            </p>
            <p>
              This policy is written for users in Europe and worldwide. Where
              applicable, we process personal data in accordance with GDPR
              principles: lawfulness, fairness, transparency, data minimisation,
              accuracy, storage limitation, integrity and confidentiality.
            </p>
          </>
        ),
      },
      {
        id: "information-we-collect",
        eyebrow: "02",
        title: "Information We Collect",
        icon: UserRound,
        content: (
          <>
            <p>
              We collect information that you provide directly, information
              created while you use Ryfio and technical information needed to
              keep the platform secure and reliable.
            </p>
            <ul>
              <li>
                <strong>Account information:</strong> name, email address,
                login method, profile preferences and account status.
              </li>
              <li>
                <strong>Design and product information:</strong> uploaded
                images, text, product settings, mockups, product names,
                descriptions, colours, variants and saved designs.
              </li>
              <li>
                <strong>Order and checkout information:</strong> cart items,
                quantities, shipping details, billing references, fulfilment
                status and order history.
              </li>
              <li>
                <strong>Support information:</strong> messages, bug reports,
                refund requests, screenshots and other details you send to us.
              </li>
              <li>
                <strong>Technical information:</strong> device type, browser,
                IP address, approximate location, pages visited, performance
                events, errors and security logs.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "how-we-use-information",
        eyebrow: "03",
        title: "How We Use Information",
        icon: Sparkles,
        content: (
          <>
            <p>
              We use personal information to operate Ryfio and provide a smooth,
              secure and reliable commerce experience.
            </p>
            <ul>
              <li>Create and manage user accounts.</li>
              <li>Save designs, products, mockups and dashboard settings.</li>
              <li>Process carts, checkout sessions, payments and orders.</li>
              <li>Send transactional emails, confirmations and support replies.</li>
              <li>Detect abuse, fraud, suspicious behaviour and security risks.</li>
              <li>Improve performance, user experience and product reliability.</li>
              <li>Comply with tax, accounting, consumer protection and legal obligations.</li>
            </ul>
            <p>
              We do not sell personal information. We do not use your private
              designs to advertise another user’s products.
            </p>
          </>
        ),
      },
      {
        id: "payments",
        eyebrow: "04",
        title: "Payments",
        icon: CreditCard,
        content: (
          <>
            <p>
              Payments may be processed by third-party payment providers such as
              Stripe. Ryfio does not store full card numbers, CVC codes or
              complete payment credentials on its own servers.
            </p>
            <p>
              Payment providers may collect payment details, billing
              information, fraud signals and transaction metadata to process the
              payment, prevent fraud and comply with financial regulations.
            </p>
            <p>
              Ryfio may store payment references, checkout session identifiers,
              order totals, currency, payment status and invoice-related
              metadata so we can confirm purchases, support users and reconcile
              orders.
            </p>
          </>
        ),
      },
      {
        id: "orders-and-shipping",
        eyebrow: "05",
        title: "Orders, Fulfilment and Shipping",
        icon: Globe2,
        content: (
          <>
            <p>
              To produce and ship print-on-demand products, Ryfio may share the
              necessary order details with fulfilment, logistics or print
              partners. This can include product details, print files, recipient
              name, shipping address, phone number where required and delivery
              preferences.
            </p>
            <p>
              We only share the information required to fulfil the order.
              Fulfilment partners may process this information under their own
              security, retention and legal obligations.
            </p>
          </>
        ),
      },
      {
        id: "cookies-and-analytics",
        eyebrow: "06",
        title: "Cookies and Analytics",
        icon: Cookie,
        content: (
          <>
            <p>
              Ryfio may use cookies and similar technologies to keep you signed
              in, protect the platform, remember preferences, measure
              performance and understand how users interact with the website.
            </p>
            <ul>
              <li>
                <strong>Essential cookies:</strong> required for login,
                security, checkout and core functionality.
              </li>
              <li>
                <strong>Preference cookies:</strong> used to remember choices
                such as language, region or interface preferences.
              </li>
              <li>
                <strong>Analytics cookies:</strong> used to understand traffic,
                performance, bugs and product usage.
              </li>
              <li>
                <strong>Marketing cookies:</strong> used only where enabled or
                legally permitted.
              </li>
            </ul>
            <p>
              You can manage cookies through your browser settings. Some
              essential features may not work correctly if essential cookies are
              disabled.
            </p>
          </>
        ),
      },
      {
        id: "third-party-services",
        eyebrow: "07",
        title: "Third-Party Services",
        icon: Database,
        content: (
          <>
            <p>
              Ryfio relies on trusted infrastructure and service providers to
              operate the platform. Depending on the features you use, these may
              include authentication, database, storage, analytics, payments,
              email delivery, address autocomplete and hosting providers.
            </p>
            <p>
              Examples may include services such as Supabase, Stripe, Google,
              Vercel or other providers used for hosting, payments, maps,
              authentication, analytics, storage, security and platform
              operations.
            </p>
            <p>
              These providers process data only for the services they provide to
              Ryfio, according to their own terms, security standards and data
              protection commitments.
            </p>
          </>
        ),
      },
      {
        id: "security",
        eyebrow: "08",
        title: "Security",
        icon: LockKeyhole,
        content: (
          <>
            <p>
              We use technical and organisational measures designed to protect
              your information from unauthorised access, misuse, loss or
              disclosure. These measures may include HTTPS encryption, access
              controls, authentication protections, monitoring, logging and
              provider-level security controls.
            </p>
            <p>
              No online service can guarantee absolute security. You are
              responsible for keeping your login credentials secure and for
              contacting us immediately if you believe your account has been
              compromised.
            </p>
          </>
        ),
      },
      {
        id: "data-retention",
        eyebrow: "09",
        title: "Data Retention",
        icon: FileText,
        content: (
          <>
            <p>
              We keep personal information only for as long as needed to provide
              Ryfio, comply with legal obligations, resolve disputes, prevent
              abuse, support users and maintain accurate business records.
            </p>
            <p>
              Account data may be kept while your account is active. Order,
              payment and tax-related records may need to be retained for longer
              periods where required by law. Deleted accounts may leave limited
              records where retention is necessary for legal, fraud prevention or
              accounting reasons.
            </p>
          </>
        ),
      },
      {
        id: "your-rights",
        eyebrow: "10",
        title: "Your Rights",
        icon: ShieldCheck,
        content: (
          <>
            <p>
              Depending on your location, including if you are in the European
              Economic Area, you may have rights over your personal information.
            </p>
            <ul>
              <li>Access the personal information we hold about you.</li>
              <li>Request correction of inaccurate or incomplete data.</li>
              <li>Request deletion of data where legally possible.</li>
              <li>Object to or restrict certain processing activities.</li>
              <li>Request portability of certain data.</li>
              <li>Withdraw consent where processing is based on consent.</li>
              <li>Contact a data protection authority if you have concerns.</li>
            </ul>
            <p>
              To make a privacy request, contact us using the details below. We
              may need to verify your identity before completing the request.
            </p>
          </>
        ),
      },
      {
        id: "children",
        eyebrow: "11",
        title: "Children",
        icon: UserRound,
        content: (
          <>
            <p>
              Ryfio is not intended for children under the age required to use
              online commerce services in their country. We do not knowingly
              collect personal information from children. If you believe a child
              has provided personal information to Ryfio, please contact us so we
              can review and remove it where appropriate.
            </p>
          </>
        ),
      },
      {
        id: "changes",
        eyebrow: "12",
        title: "Changes to This Policy",
        icon: FileText,
        content: (
          <>
            <p>
              We may update this Privacy Policy from time to time to reflect
              changes in our services, legal requirements or operational
              practices. When we make important changes, we may notify users
              through the website, dashboard or email where appropriate.
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
        eyebrow: "13",
        title: "Contact",
        icon: Mail,
        content: (
          <>
            <p>
              If you have questions about this Privacy Policy or how Ryfio
              handles personal information, contact us through the Contact page
              or by email.
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
            <ShieldCheck size={15} />
            Legal Center
          </div>

          <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-7xl">
            Privacy Policy
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-white/58 sm:text-lg">
            Clear information about how Ryfio collects, uses and protects data
            when creators design products, manage their account, checkout and
            use our print-on-demand tools.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-white/45">
            <span className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2">
              Last updated: {LAST_UPDATED}
            </span>
            <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-purple-200">
              GDPR aware
            </span>
            <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-cyan-200">
              Secure payments
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
                    Ryfio Privacy Notice
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
