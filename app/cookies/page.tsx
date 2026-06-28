"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  ChevronUp,
  Cookie,
  CreditCard,
  Database,
  Eye,
  FileText,
  Globe2,
  LockKeyhole,
  Mail,
  MonitorCog,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserCheck,
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
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Cookies", href: "/cookies", active: true },
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

export default function CookiePolicyPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  const sections: Section[] = useMemo(
    () => [
      {
        id: "overview",
        eyebrow: "01",
        title: "Overview",
        icon: Cookie,
        content: (
          <>
            <p>
              This Cookie Policy explains how Ryfio uses cookies and similar
              technologies on our website, dashboard, product editor, checkout
              and related services.
            </p>
            <p>
              Cookies help Ryfio operate securely, remember preferences, keep
              users signed in, support carts and checkout, measure performance,
              detect errors and improve the platform.
            </p>
            <p>
              This policy should be read together with our Privacy Policy and
              Terms of Service. Where required by law, we ask for consent before
              using non-essential cookies.
            </p>
          </>
        ),
      },
      {
        id: "what-are-cookies",
        eyebrow: "02",
        title: "What Are Cookies?",
        icon: FileText,
        content: (
          <>
            <p>
              Cookies are small text files stored on your device by a website or
              application. They allow websites to remember information about your
              visit, such as whether you are logged in, your preferences, your
              cart session or how the website is being used.
            </p>
            <p>
              Similar technologies may include local storage, session storage,
              pixels, SDKs, tags, device identifiers and server-side events.
              In this policy, we use “cookies” to refer to cookies and similar
              technologies together.
            </p>
          </>
        ),
      },
      {
        id: "why-we-use-cookies",
        eyebrow: "03",
        title: "Why Ryfio Uses Cookies",
        icon: Sparkles,
        content: (
          <>
            <p>
              Ryfio uses cookies to provide a secure and reliable commerce
              experience for creators, customers and visitors.
            </p>
            <ul>
              <li>Keep users signed in and protect sessions.</li>
              <li>Remember cart, checkout and interface preferences.</li>
              <li>Detect abuse, fraud, bots and suspicious activity.</li>
              <li>Measure performance, page speed, errors and product usage.</li>
              <li>Support payments, address autocomplete and fulfilment flows.</li>
              <li>Improve the user experience and platform reliability.</li>
            </ul>
          </>
        ),
      },
      {
        id: "essential-cookies",
        eyebrow: "04",
        title: "Essential Cookies",
        icon: LockKeyhole,
        content: (
          <>
            <p>
              Essential cookies are required for Ryfio to work correctly. These
              cookies are usually set in response to actions you take, such as
              logging in, adding items to a cart, saving a design, completing
              checkout or setting privacy preferences.
            </p>
            <ul>
              <li>Authentication and account security.</li>
              <li>Session management.</li>
              <li>Cart and checkout functionality.</li>
              <li>Fraud prevention and abuse protection.</li>
              <li>Load balancing, uptime and platform security.</li>
            </ul>
            <p>
              Because these cookies are necessary to provide Ryfio, they cannot
              usually be disabled through our cookie controls. You may block
              them in your browser, but parts of Ryfio may stop working.
            </p>
          </>
        ),
      },
      {
        id: "authentication-cookies",
        eyebrow: "05",
        title: "Authentication Cookies",
        icon: UserCheck,
        content: (
          <>
            <p>
              Authentication cookies help Ryfio recognise signed-in users,
              protect accounts and maintain secure sessions. These cookies may
              be set by Ryfio or by authentication providers used by the
              platform.
            </p>
            <p>
              They may store session identifiers, login state, security tokens or
              similar information needed to verify that the correct user is
              accessing an account.
            </p>
          </>
        ),
      },
      {
        id: "checkout-payment-cookies",
        eyebrow: "06",
        title: "Checkout and Payment Cookies",
        icon: CreditCard,
        content: (
          <>
            <p>
              Ryfio may use payment and checkout providers such as Stripe or
              similar services. These providers may use cookies and related
              technologies to process payments, prevent fraud, remember checkout
              state, comply with financial rules and secure transactions.
            </p>
            <p>
              Payment cookies may be required to complete an order. Ryfio does
              not use these cookies to store full card numbers or CVC codes on
              its own servers.
            </p>
          </>
        ),
      },
      {
        id: "preference-cookies",
        eyebrow: "07",
        title: "Preference Cookies",
        icon: Settings2,
        content: (
          <>
            <p>
              Preference cookies help Ryfio remember choices you make so the
              interface feels smoother and more personal.
            </p>
            <ul>
              <li>Language or region preferences.</li>
              <li>Currency or store preferences where available.</li>
              <li>Dashboard display settings.</li>
              <li>Cookie consent choices.</li>
              <li>Interface state such as collapsed menus or recently used tools.</li>
            </ul>
          </>
        ),
      },
      {
        id: "analytics-cookies",
        eyebrow: "08",
        title: "Analytics and Performance Cookies",
        icon: BarChart3,
        content: (
          <>
            <p>
              Analytics cookies help us understand how users interact with
              Ryfio, which pages are useful, where errors happen and how the
              product can be improved.
            </p>
            <p>
              These cookies may collect information such as page visits,
              navigation paths, browser type, device type, approximate location,
              performance timings, error events and feature usage.
            </p>
            <p>
              Where required by law, analytics cookies are used only after
              consent. We aim to use analytics in a privacy-conscious way and to
              avoid collecting more information than necessary.
            </p>
          </>
        ),
      },
      {
        id: "marketing-cookies",
        eyebrow: "09",
        title: "Marketing Cookies",
        icon: Eye,
        content: (
          <>
            <p>
              Ryfio may use marketing cookies to measure campaigns, understand
              how visitors find the website and improve creator acquisition.
              These cookies may be set by Ryfio or by advertising and analytics
              partners.
            </p>
            <p>
              Marketing cookies are not essential to the core operation of
              Ryfio. Where required, they are used only with consent and can be
              disabled through cookie controls or browser settings.
            </p>
          </>
        ),
      },
      {
        id: "third-party-cookies",
        eyebrow: "10",
        title: "Third-Party Cookies",
        icon: Database,
        content: (
          <>
            <p>
              Some cookies may be set by third-party services that Ryfio uses to
              operate the platform. These may include services for hosting,
              authentication, database, storage, analytics, payments, maps,
              address autocomplete, email delivery, security and performance.
            </p>
            <p>
              Examples of providers may include Stripe, Supabase, Google, Vercel,
              Cloudflare or other infrastructure and service providers used by
              Ryfio.
            </p>
            <p>
              Third-party providers may process cookie-related information under
              their own privacy policies and cookie policies. We recommend
              reviewing those policies if you want more detail about a specific
              provider.
            </p>
          </>
        ),
      },
      {
        id: "google-services",
        eyebrow: "11",
        title: "Google Services",
        icon: Globe2,
        content: (
          <>
            <p>
              Ryfio may use Google services such as address autocomplete, maps,
              analytics, authentication or other platform tools. These services
              may use cookies or similar technologies to provide functionality,
              detect abuse, measure usage and improve service quality.
            </p>
            <p>
              For example, address autocomplete may help users enter shipping
              addresses more accurately during checkout. Google may process
              technical information needed to provide that feature.
            </p>
          </>
        ),
      },
      {
        id: "local-storage",
        eyebrow: "12",
        title: "Local Storage and Similar Technologies",
        icon: MonitorCog,
        content: (
          <>
            <p>
              Ryfio may use local storage or session storage in your browser to
              remember interface state, temporary cart data, editor settings,
              recently selected options or checkout progress.
            </p>
            <p>
              Local storage is stored on your device and may remain until it is
              deleted by the website, browser or user. Clearing your browser data
              may remove these settings.
            </p>
          </>
        ),
      },
      {
        id: "managing-cookies",
        eyebrow: "13",
        title: "Managing Cookies",
        icon: Settings2,
        content: (
          <>
            <p>
              You can control cookies through your browser settings. Most
              browsers allow you to block, delete or limit cookies. You can also
              usually clear local storage and site data from your browser.
            </p>
            <ul>
              <li>Blocking essential cookies may prevent login, cart or checkout from working.</li>
              <li>Deleting cookies may sign you out or reset preferences.</li>
              <li>Disabling analytics or marketing cookies should not prevent core features.</li>
              <li>Cookie settings may need to be configured separately on each browser or device.</li>
            </ul>
          </>
        ),
      },
      {
        id: "consent",
        eyebrow: "14",
        title: "Consent and GDPR",
        icon: ShieldCheck,
        content: (
          <>
            <p>
              Where required by GDPR, ePrivacy rules or other applicable laws,
              Ryfio asks for consent before setting non-essential cookies such as
              analytics or marketing cookies.
            </p>
            <p>
              Essential cookies may be used without consent where they are
              strictly necessary to provide the service requested by the user,
              such as authentication, security, cart and checkout.
            </p>
            <p>
              You may withdraw or change consent where cookie controls are
              available. You can also manage cookies through browser settings.
            </p>
          </>
        ),
      },
      {
        id: "updates",
        eyebrow: "15",
        title: "Changes to This Policy",
        icon: FileText,
        content: (
          <>
            <p>
              We may update this Cookie Policy from time to time to reflect
              changes in our services, technology, legal requirements or cookie
              practices.
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
        eyebrow: "16",
        title: "Contact",
        icon: Mail,
        content: (
          <>
            <p>
              If you have questions about this Cookie Policy or how Ryfio uses
              cookies, contact us through the Contact page or by email.
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
            <Cookie size={15} />
            Legal Center
          </div>

          <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-7xl">
            Cookie Policy
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-white/58 sm:text-lg">
            How Ryfio uses cookies and similar technologies for security,
            authentication, checkout, analytics and platform performance.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-white/45">
            <span className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2">
              Last updated: {LAST_UPDATED}
            </span>
            <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-purple-200">
              Cookie controls
            </span>
            <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-cyan-200">
              GDPR aware
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
                    Ryfio Cookies
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
