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

const STEPS = Object.freeze([
  {
    step: "01",
    title: "Create your product",
    desc: "Upload your design, customize products, and preview everything in real-time.",
  },
  {
    step: "02",
    title: "Publish your store",
    desc: "Launch your products instantly and start selling to customers worldwide.",
  },
  {
    step: "03",
    title: "We handle fulfillment",
    desc: "We print, pack, and ship orders directly to your customers — hassle-free.",
  },
  {
    step: "04",
    title: "Scale your business",
    desc: "Focus on marketing and growth while we handle operations behind the scenes.",
  },
]);

const BENEFITS = Object.freeze([
  "No inventory needed",
  "Global shipping",
  "Easy product customization",
  "Automated fulfillment",
  "Scalable infrastructure",
]);

export default function HowItWorksPage() {
  return (
    <div className="bg-gradient-to-b from-white to-gray-50 text-gray-900 min-h-screen">

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-4 md:px-8 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          How{" "}
          <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            MYNIFY works
          </span>
        </h1>

        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Start your custom product business in just a few simple steps.
        </p>
      </section>

      {/* STEPS */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        <div className="grid md:grid-cols-2 gap-10">

          {STEPS.map((item) => (
            <div
              key={item.step}
              className="bg-white p-8 rounded-3xl shadow-md border border-gray-100 hover:shadow-xl transition"
            >
              <div className="text-green-500 font-bold text-lg mb-2">
                {safeText(item.step)}
              </div>

              <h3 className="text-2xl font-semibold mb-3">
                {safeText(item.title)}
              </h3>

              <p className="text-gray-600">
                {safeText(item.desc)}
              </p>
            </div>
          ))}

        </div>
      </section>

      {/* VISUAL FLOW */}
      <section className="py-20 bg-gradient-to-r from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">

          <h2 className="text-3xl font-bold mb-6">
            Simple. Fast. Powerful.
          </h2>

          <div className="flex flex-wrap justify-center items-center gap-4 text-gray-700 font-medium">
            <span>Create</span>
            <span>→</span>
            <span>Sell</span>
            <span>→</span>
            <span>We fulfill</span>
            <span>→</span>
            <span>You grow 🚀</span>
          </div>

        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-8 text-center">

          <h2 className="text-3xl md:text-4xl font-bold mb-10">
            Why MYNIFY?
          </h2>

          <div className="grid md:grid-cols-3 gap-6 text-left">

            {BENEFITS.map((benefit) => (
              <div
                key={benefit}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
              >
                ✔ {safeText(benefit)}
              </div>
            ))}

          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-gray-900 to-black text-white text-center">

        <h2 className="text-4xl font-extrabold mb-4">
          Ready to start?
        </h2>

        <p className="text-gray-300 mb-8">
          Launch your brand and start selling custom products today.
        </p>

        <div className="flex justify-center gap-4 flex-wrap">

          <Link
            href={safeHref("/login")}
            className="bg-gradient-to-r from-green-400 to-emerald-500 px-10 py-4 rounded-2xl font-semibold hover:scale-105 transition"
          >
            Start now 🚀
          </Link>

          <Link
            href={safeHref("/contact")}
            className="border border-white/20 px-10 py-4 rounded-2xl hover:bg-white/10 transition"
          >
            Contact us
          </Link>

        </div>

      </section>
    </div>
  );
}