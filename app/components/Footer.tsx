"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowUpRight, Gamepad2, ShieldCheck, Sparkles } from "lucide-react";

const safeHref = (href: string) => {
  if (typeof href !== "string") return "/";
  const clean = href.trim().toLowerCase();

  if (clean.startsWith("javascript:")) return "/";
  if (clean.startsWith("data:")) return "/";

  return href;
};

const safeText = (val: unknown) => {
  if (typeof val !== "string") return "";
  return val
    .replace(/<script.*?>.*?<\/script>/gi, "")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

const LINKS = Object.freeze({
  platform: [
    { label: "How it Works", href: "/how-ryfio-works" },
    { label: "Features", href: "/" },
    { label: "Start Selling", href: "/login" },
    { label: "Promo Codes", href: "/promo" },
  ],

  resources: [
    { label: "FAQ", href: "/faq" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],

  company: [
    { label: "About Ryfio", href: "/about" },
    { label: "Creator Program", href: "/login" },
  ],

  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Refund Policy", href: "/refund-policy" },
    { label: "Shipping Policy", href: "/shipping-policy" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
});

const TRUST_BADGES = Object.freeze([
  "Secure payments",
  "Worldwide shipping",
  "GDPR aware",
  "AI powered",
]);

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = useCallback(() => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      alert("Enter a valid email");
      return;
    }

    console.log("Subscribed:", normalizedEmail);
    alert("Subscribed successfully 🚀");
    setEmail("");
  }, [email]);

  const handleCookieSettings = useCallback(() => {
    alert("Open cookie preferences 🍪");
  }, []);

  return (
    <footer className="relative overflow-x-hidden border-t border-white/10 bg-[#03030a] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.16),transparent_30%),radial-gradient(circle_at_85%_100%,rgba(14,165,233,0.12),transparent_28%)]"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_1fr]">
          <div className="min-w-0">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 via-fuchsia-500 to-cyan-500 shadow-[0_0_35px_rgba(168,85,247,0.45)]">
                <Gamepad2 size={24} />
              </div>

              <div className="min-w-0">
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  RYFIO
                </h2>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-400">
                  AI Commerce
                </p>
              </div>
            </div>

            <p className="mb-7 max-w-md text-sm leading-relaxed text-white/55">
              Build, customize and sell premium print-on-demand products
              worldwide using AI-powered tools. No inventory. No upfront stock.
              Just create and grow your brand.
            </p>

            <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 w-full min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm text-white placeholder:text-white/30 outline-none backdrop-blur-xl transition focus:border-purple-500/50 sm:flex-1"
              />

              <button
                type="button"
                onClick={handleSubscribe}
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 px-6 text-sm font-black uppercase tracking-wide text-white shadow-[0_0_30px_rgba(168,85,247,0.4)] transition hover:scale-[1.02] sm:w-auto"
              >
                Join
                <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {TRUST_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-white/45"
                >
                  <ShieldCheck size={14} className="text-purple-300/80" />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-4">
            {Object.entries(LINKS).map(([section, items]) => (
              <div key={section} className="min-w-0">
                <h3 className="mb-5 text-sm font-black uppercase tracking-[0.2em] text-white">
                  {safeText(section)}
                </h3>

                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={safeHref(item.href)}
                        className="text-sm text-white/50 transition hover:text-purple-400"
                      >
                        {safeText(item.label)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-5 rounded-[28px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_0_50px_rgba(168,85,247,0.10)] backdrop-blur-xl md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-300">
              <Sparkles size={20} />
            </div>

            <div className="min-w-0">
              <h4 className="font-black text-white">Start Selling with Ryfio</h4>
              <p className="mt-1 text-sm text-white/50">
                Launch your brand, create custom products and start selling
                worldwide from one platform.
              </p>
            </div>
          </div>

          <Link
            href={safeHref("/login")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-6 py-3 text-sm font-black text-white shadow-[0_0_28px_rgba(168,85,247,0.35)] transition hover:scale-105 sm:w-auto"
          >
            Get Started
            <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-5 border-t border-white/10 pt-6 text-center text-sm text-white/35 md:flex-row md:text-left">
          <p>© {new Date().getFullYear()} RYFIO. All rights reserved.</p>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link href={safeHref("/privacy")} className="transition hover:text-purple-400">
              Privacy
            </Link>

            <Link href={safeHref("/terms")} className="transition hover:text-purple-400">
              Terms
            </Link>

            <Link href={safeHref("/refund-policy")} className="transition hover:text-purple-400">
              Refunds
            </Link>

            <Link href={safeHref("/shipping-policy")} className="transition hover:text-purple-400">
              Shipping
            </Link>

            <Link href={safeHref("/cookies")} className="transition hover:text-purple-400">
              Cookies
            </Link>

            <Link href={safeHref("/contact")} className="transition hover:text-purple-400">
              Contact
            </Link>

            <button
              type="button"
              onClick={handleCookieSettings}
              className="transition hover:text-purple-400"
            >
              Cookie settings 🍪
            </button>

            <span>Made in Europe • Global Fulfilment</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
