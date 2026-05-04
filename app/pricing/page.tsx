"use client";

import Link from "next/link";

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

/* ================= DATA ================= */

const PLANS = Object.freeze([
  {
    name: "Starter",
    price: "Free",
    desc: "Perfect to start your first products.",
    features: [
      "Basic product creation",
      "Limited store customization",
      "Community support",
    ],
    button: "Start free",
    highlight: false,
    href: "/signup",
  },
  {
    name: "Pro",
    price: "€19 / month",
    desc: "Best for growing creators.",
    features: [
      "Unlimited products",
      "Advanced customization",
      "Priority support",
      "Discount codes",
    ],
    button: "Go Pro",
    highlight: true,
    href: "/signup",
  },
  {
    name: "Business",
    price: "€49 / month",
    desc: "For serious brands and scaling stores.",
    features: [
      "Everything in Pro",
      "Automation tools",
      "Analytics dashboard",
      "Dedicated support",
    ],
    button: "Contact sales",
    highlight: false,
    href: "/contact",
  },
]);

export default function PricingPage() {
  return (
    <div className="bg-gradient-to-b from-white to-gray-50 text-gray-900 min-h-screen">

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-4 md:px-8 py-16 text-center">

        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          Simple{" "}
          <span className="bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent">
            pricing
          </span>
        </h1>

        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Start free and scale as you grow. No hidden fees, no surprises.
        </p>

      </section>

      {/* PLANS */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 pb-24">

        <div className="grid md:grid-cols-3 gap-8">

          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`
                rounded-3xl p-8 border transition shadow-sm hover:shadow-xl
                ${plan.highlight
                  ? "bg-black text-white border-black scale-105"
                  : "bg-white border-gray-200"
                }
              `}
            >

              <h2 className="text-xl font-bold mb-2">
                {safeText(plan.name)}
              </h2>

              <p className={`text-3xl font-extrabold mb-3 ${
                plan.highlight ? "text-white" : ""
              }`}>
                {plan.price}
              </p>

              <p className={`text-sm mb-6 ${
                plan.highlight ? "text-gray-300" : "text-gray-600"
              }`}>
                {safeText(plan.desc)}
              </p>

              <ul className="space-y-2 text-sm mb-8">
                {plan.features.map((f) => (
                  <li key={f}>✔ {safeText(f)}</li>
                ))}
              </ul>

              <Link
                href={safeHref(plan.href)}
                className={`
                  w-full block text-center py-3 rounded-xl font-semibold transition
                  ${plan.highlight
                    ? "bg-white text-black hover:scale-105"
                    : "bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:scale-105"
                  }
                `}
              >
                {safeText(plan.button)}
              </Link>

            </div>
          ))}

        </div>

      </section>

      {/* COMPARISON STRIP */}
      <section className="py-16 bg-gray-50 border-t border-gray-100">

        <div className="max-w-5xl mx-auto px-4 md:px-8 text-center">

          <h3 className="text-2xl font-bold mb-3">
            No hidden fees
          </h3>

          <p className="text-gray-600">
            You only pay when you grow. Cancel anytime.
          </p>

        </div>

      </section>

      {/* CTA */}
      <section className="py-24 bg-black text-white text-center">

        <h2 className="text-4xl font-extrabold mb-4">
          Ready to start selling?
        </h2>

        <p className="text-gray-400 mb-8">
          Join thousands of creators building their brand with MYNIFY.
        </p>

        <Link
          href={safeHref("/signup")}
          className="bg-gradient-to-r from-indigo-500 to-blue-500 px-10 py-4 rounded-2xl font-semibold hover:scale-105 transition inline-block"
        >
          Get started 🚀
        </Link>

      </section>

    </div>
  );
}