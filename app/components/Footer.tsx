"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Gamepad2, Sparkles } from "lucide-react";

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
    { label: "How it works", href: "/how-mynify-works" },
    { label: "Features", href: "/" },
  ],
  creators: [
    { label: "Start selling", href: "/login" },
    { label: "Promo codes", href: "/promo" },
  ],
  company: [
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookies", href: "/cookies" },
  ],
});

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = () => {
    if (!email || !email.includes("@")) {
      alert("Enter a valid email");
      return;
    }

    console.log("Subscribed:", email);
    alert("Subscribed successfully 🚀");
    setEmail("");
  };

  const handleCookieSettings = () => {
    alert("Open cookie preferences 🍪");
  };

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#03030a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.16),transparent_30%),radial-gradient(circle_at_85%_100%,rgba(14,165,233,0.12),transparent_28%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 via-fuchsia-500 to-cyan-500 shadow-[0_0_35px_rgba(168,85,247,0.45)]">
                <Gamepad2 size={24} />
              </div>

              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  MYNIFY
                </h2>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-400">
                  AI Commerce
                </p>
              </div>
            </div>

            <p className="mb-7 max-w-md text-sm leading-relaxed text-white/55">
              Build, customize, and sell your own products worldwide — without inventory.
            </p>

            <div className="flex max-w-md flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm text-white placeholder:text-white/30 outline-none backdrop-blur-xl transition focus:border-purple-500/50"
              />

              <button
                type="button"
                onClick={handleSubscribe}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 px-6 text-sm font-black uppercase tracking-wide text-white shadow-[0_0_30px_rgba(168,85,247,0.4)] transition hover:scale-[1.02]"
              >
                Join
                <ArrowUpRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-4">
            {Object.entries(LINKS).map(([section, items]) => (
              <div key={section}>
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

            <div>
              <h4 className="font-black text-white">
                Earn with MYNIFY 🎟️
              </h4>
              <p className="mt-1 text-sm text-white/50">
                Join our creator program and monetize your audience.
              </p>
            </div>
          </div>

          <Link
            href={safeHref("/login")}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-6 py-3 text-sm font-black text-white shadow-[0_0_28px_rgba(168,85,247,0.35)] transition hover:scale-105"
          >
            Start earning
            <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-5 border-t border-white/10 pt-6 text-center text-sm text-white/35 md:flex-row md:text-left">
          <p>© {new Date().getFullYear()} MYNIFY. All rights reserved.</p>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link href={safeHref("/privacy")} className="transition hover:text-purple-400">
              Privacy
            </Link>

            <Link href={safeHref("/terms")} className="transition hover:text-purple-400">
              Terms
            </Link>

            <Link href={safeHref("/cookies")} className="transition hover:text-purple-400">
              Cookies
            </Link>

            <button
              type="button"
              onClick={handleCookieSettings}
              className="transition hover:text-purple-400"
            >
              Cookie settings 🍪
            </button>

            <span>🌍 Europe / EN</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
