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

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 🔐 aqui podes integrar API segura depois
    console.log("Form submitted:", form);

    alert("Message sent successfully 🚀");

    setForm({
      name: "",
      email: "",
      message: "",
    });
  };

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 text-gray-900 min-h-screen">

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-4 md:px-8 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          Get in{" "}
          <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            touch
          </span>
        </h1>

        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Have questions, feedback, or need help? Our team is here for you.
        </p>
      </section>

      {/* CONTACT FORM */}
      <section className="max-w-5xl mx-auto px-4 md:px-8 pb-20 grid md:grid-cols-2 gap-10">

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-3xl shadow-md border border-gray-100"
        >
          <h2 className="text-2xl font-bold mb-6">Send a message</h2>

          <div className="space-y-5">

            <input
              type="text"
              name="name"
              placeholder="Your name"
              value={safeText(form.name)}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
            />

            <input
              type="email"
              name="email"
              placeholder="Your email"
              value={safeText(form.email)}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
            />

            <textarea
              name="message"
              placeholder="Your message"
              rows={5}
              value={safeText(form.message)}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
            />

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white py-3 rounded-xl font-medium hover:scale-105 transition"
            >
              Send message 🚀
            </button>

          </div>
        </form>

        {/* INFO */}
        <div className="flex flex-col justify-center">

          <h2 className="text-2xl font-bold mb-4">
            Contact information
          </h2>

          <p className="text-gray-600 mb-6">
            Prefer direct contact? Reach us through the channels below.
          </p>

          <div className="space-y-4 text-gray-700">

            <div>
              <strong>Email:</strong>{" "}
              <a
                href="mailto:support@mynify.com"
                className="text-green-500 hover:underline"
              >
                support@mynify.com
              </a>
            </div>

            <div>
              <strong>Phone:</strong> +351 999 999 999
            </div>

            <div>
              <strong>Location:</strong> Lisbon, Portugal
            </div>

          </div>

          <div className="mt-8">
            <Link
              href={safeHref("/")}
              className="text-green-500 hover:underline"
            >
              ← Back to home
            </Link>
          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-black text-white text-center">

        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Need help getting started?
        </h2>

        <p className="text-gray-300 mb-6">
          Check our guides or start building your first product today.
        </p>

        <Link
          href={safeHref("/login")}
          className="bg-gradient-to-r from-green-400 to-emerald-500 px-8 py-3 rounded-xl font-semibold hover:scale-105 transition inline-block"
        >
          Start now
        </Link>

      </section>
    </div>
  );
}