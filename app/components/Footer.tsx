"use client";

import Link from "next/link";
import { useState } from "react";

/* ================= SECURITY HELPERS ================= */

const safeHref = (href: string) => {
  if (typeof href !== "string") return "/";
  if (href.trim().toLowerCase().startsWith("javascript:")) return "/";
  if (href.trim().toLowerCase().startsWith("data:")) return "/";
  return href;
};

const safeText = (val: any) => {
  if (typeof val !== "string") return "";
  return val
    .replace(/<script.*?>.*?<\/script>/gi, "")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

/* ================= DATA (ALINHADO COM A TUA APP) ================= */

const LINKS = Object.freeze({
  product: [
    { label: "How it works", href: "/how-mynify-works" },
    { label: "Features", href: "/" },
  ],
  creators: [
    { label: "Start selling", href: "/login" },
    { label: "Promo codes", href: "/promo" }, // cria depois se quiseres
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

  /* ================= ACTIONS ================= */

  const handleSubscribe = () => {
    if (!email || !email.includes("@")) {
      alert("Enter a valid email");
      return;
    }

    // 🔐 aqui depois ligas API real
    console.log("Subscribed:", email);

    alert("Subscribed successfully 🚀");
    setEmail("");
  };

  const handleCookieSettings = () => {
    // 🔥 aqui depois ligas um cookie manager real
    alert("Open cookie preferences 🍪");
  };

  return (
    <footer className="bg-[#0b0b0c] text-gray-300 border-t border-white/10">

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-16">

        {/* TOP */}
        <div className="grid md:grid-cols-5 gap-10">

          {/* BRAND */}
          <div className="md:col-span-2">

            <h2 className="text-2xl font-extrabold text-white mb-4">
              MYNIFY
            </h2>

            <p className="text-gray-400 text-sm mb-6 max-w-sm">
              Build, customize, and sell your own products worldwide — without inventory.
            </p>

            {/* NEWSLETTER */}
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                value={safeText(email)}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSubscribe}
                className="bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm hover:scale-105 transition"
              >
                Join
              </button>
            </div>

          </div>

          {/* LINKS */}
          {Object.entries(LINKS).map(([section, items]) => (
            <div key={section}>
              <h3 className="font-semibold mb-4 text-white capitalize">
                {safeText(section)}
              </h3>

              <ul className="space-y-2 text-sm text-gray-400">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={safeHref(item.href)}
                      className="hover:text-white transition"
                    >
                      {safeText(item.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* PROMO */}
        <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">

          <div>
            <h4 className="font-semibold text-white">
              Earn with MYNIFY 🎟️
            </h4>
            <p className="text-sm text-gray-400">
              Join our creator program and monetize your audience.
            </p>
          </div>

          <Link
            href={safeHref("/login")}
            className="bg-indigo-500 px-5 py-2 rounded-xl text-sm text-white hover:scale-105 transition"
          >
            Start earning
          </Link>

        </div>

        {/* BOTTOM */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">

          <p>
            © {new Date().getFullYear()} MYNIFY. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-4">

            <Link href={safeHref("/privacy")} className="hover:text-white">
              Privacy
            </Link>

            <Link href={safeHref("/terms")} className="hover:text-white">
              Terms
            </Link>

            <Link href={safeHref("/cookies")} className="hover:text-white">
              Cookies
            </Link>

            <button
              onClick={handleCookieSettings}
              className="hover:text-white"
            >
              Cookie settings 🍪
            </button>

            <span className="text-gray-600">
              🌍 Europe / EN
            </span>

          </div>

        </div>

      </div>
    </footer>
  );
}