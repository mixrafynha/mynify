"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Gamepad2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Rocket,
  Send,
  Zap,
} from "lucide-react";

/* ================= SECURITY HELPERS ================= */

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

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Form submitted:", form);

    alert("Message sent successfully 🚀");

    setForm({
      name: "",
      email: "",
      message: "",
    });
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#03030a] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_32%,rgba(168,85,247,0.35),transparent_28%),radial-gradient(circle_at_58%_52%,rgba(14,165,233,0.25),transparent_24%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,10,0.35)_0%,#03030a_100%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 text-center md:px-8 lg:px-12 lg:pt-28">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-500/60 bg-purple-500/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-white/85 shadow-[0_0_22px_rgba(168,85,247,0.35)]">
            <Gamepad2 size={15} className="text-purple-400" />
            Support for creators & gamers
          </div>

          <h1 className="mx-auto mb-6 max-w-5xl text-5xl font-black uppercase leading-[0.9] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            Get in{" "}
            <span className="bg-gradient-to-r from-violet-300 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
              touch
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg md:text-xl">
            Have questions, feedback, or need help? Our team is here for you.
          </p>
        </div>
      </section>

      {/* CONTACT FORM */}
      <section className="relative bg-[#03030a] pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.16),transparent_28%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 md:px-8 lg:grid-cols-2 lg:px-12">
          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-[0_0_30px_rgba(168,85,247,0.08)] backdrop-blur-xl sm:p-8"
          >
            <div className="mb-8">
              <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-300 shadow-[0_0_24px_rgba(168,85,247,0.22)]">
                <MessageCircle size={28} />
              </div>

              <h2 className="text-2xl font-black uppercase">
                Send a message
              </h2>
            </div>

            <div className="space-y-5">
              <input
                type="text"
                name="name"
                placeholder="Your name"
                value={safeText(form.name)}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-white placeholder:text-white/35 outline-none transition focus:border-purple-500/60 focus:bg-white/10 focus:ring-2 focus:ring-purple-500/20"
              />

              <input
                type="email"
                name="email"
                placeholder="Your email"
                value={safeText(form.email)}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-white placeholder:text-white/35 outline-none transition focus:border-purple-500/60 focus:bg-white/10 focus:ring-2 focus:ring-purple-500/20"
              />

              <textarea
                name="message"
                placeholder="Your message"
                rows={5}
                value={safeText(form.message)}
                onChange={handleChange}
                required
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-white placeholder:text-white/35 outline-none transition focus:border-purple-500/60 focus:bg-white/10 focus:ring-2 focus:ring-purple-500/20"
              />

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-8 py-4 font-bold text-white shadow-[0_0_35px_rgba(168,85,247,0.45)] transition hover:scale-[1.02]"
              >
                Send message
                <Send size={18} />
              </button>
            </div>
          </form>

          {/* INFO */}
          <div className="flex flex-col justify-center rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-[0_0_30px_rgba(168,85,247,0.08)] backdrop-blur-xl sm:p-8">
            <div className="mb-4 text-sm font-black uppercase tracking-widest text-purple-400">
              Contact information
            </div>

            <h2 className="mb-4 text-3xl font-black uppercase md:text-4xl">
              Let’s build something great
            </h2>

            <p className="mb-8 leading-relaxed text-white/60">
              Prefer direct contact? Reach us through the channels below.
            </p>

            <div className="space-y-4">
              <a
                href="mailto:support@mynify.com"
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-white/75 transition hover:border-purple-500/40 hover:bg-purple-500/10"
              >
                <Mail className="text-purple-400" size={24} />
                <div>
                  <p className="text-sm text-white/40">Email</p>
                  <p className="font-semibold">support@mynify.com</p>
                </div>
              </a>

              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-white/75">
                <Phone className="text-purple-400" size={24} />
                <div>
                  <p className="text-sm text-white/40">Phone</p>
                  <p className="font-semibold">+351 999 999 999</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-white/75">
                <MapPin className="text-purple-400" size={24} />
                <div>
                  <p className="text-sm text-white/40">Location</p>
                  <p className="font-semibold">Lisbon, Portugal</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href={safeHref("/")}
                className="inline-flex items-center gap-2 font-bold text-fuchsia-400 transition hover:text-purple-300"
              >
                <ArrowLeft size={18} />
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* HELP STRIP */}
      <section className="relative overflow-hidden bg-[#05050d] py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.14),transparent_40%)]" />

        <div className="relative mx-auto max-w-5xl px-4 text-center md:px-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-purple-300">
            <CheckCircle2 size={14} />
            Fast support
          </div>

          <h3 className="mb-4 text-3xl font-black uppercase md:text-4xl">
            Need help getting started?
          </h3>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/60">
            Check our guides or start building your first product today.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#03030a] py-28 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.35),transparent_45%)]" />

        <div className="relative mx-auto max-w-5xl px-4 md:px-8 lg:px-12">
          <h2 className="mb-6 text-4xl font-black uppercase leading-tight tracking-tight md:text-6xl">
            Start your{" "}
            <span className="bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
              brand today
            </span>
          </h2>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/60 md:text-xl">
            Create custom products, launch your store, and grow with MYNIFY.
          </p>

          <Link
            href={safeHref("/login")}
            className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-10 py-4 text-lg font-bold text-white shadow-[0_0_35px_rgba(168,85,247,0.55)] transition hover:scale-105"
          >
            Start now
            <Rocket size={20} />
          </Link>

          <p className="mt-6 text-sm text-white/35">
            No credit card required • Free to start
          </p>
        </div>
      </section>
    </main>
  );
}
