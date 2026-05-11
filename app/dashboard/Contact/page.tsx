"use client";

import { useCallback, useState } from "react";
import {
  CheckCircle2,
  Headphones,
  Mail,
  MessageCircle,
  Send,
  Sparkles,
  User,
  Zap,
} from "lucide-react";

const safeText = (val: string) =>
  typeof val === "string"
    ? val.replace(/</g, "&lt;").replace(/>/g, "&gt;")
    : "";

const inputClass =
  "h-12 w-full rounded-2xl border border-white bg-white/90 px-4 text-sm font-semibold text-slate-700 shadow-[0_12px_35px_rgba(101,85,143,0.10)] outline-none placeholder:text-slate-400 transition focus:ring-4 focus:ring-purple-500/15";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      setForm((prev) => ({
        ...prev,
        [name]: value.slice(0, name === "message" ? 1200 : 120),
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      setLoading(true);
      setSuccess(false);

      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        if (res.ok) {
          setSuccess(true);
          setForm({ name: "", email: "", message: "" });
        }
      } finally {
        setLoading(false);
      }
    },
    [form]
  );

  return (
    <div className="min-h-screen bg-[#f8f6ff] text-[#060817]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(168,85,247,0.16),transparent_28%),radial-gradient(circle_at_85%_8%,rgba(14,165,233,0.09),transparent_26%),linear-gradient(180deg,#ffffff_0%,#f8f6ff_48%,#f2efff_100%)]" />

      <main className="relative z-10 min-h-screen">
        <div className="px-3 py-5 sm:px-5 md:px-8 md:py-7">
          <div className="mx-auto max-w-[1500px] space-y-5">
            <header className="sticky top-0 z-30 -mx-3 bg-[#f8f6ff]/90 px-3 pb-4 pt-0 backdrop-blur-2xl sm:-mx-5 sm:px-5 md:-mx-8 md:px-8">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-purple-600 via-violet-600 to-fuchsia-500 text-white shadow-[0_18px_35px_rgba(124,58,237,0.24)]">
                  <Headphones size={22} />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-600">
                    Support
                  </p>

                  <h1 className="truncate text-3xl font-black tracking-[-0.06em] text-[#060817] sm:text-4xl">
                    Contact Support
                  </h1>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Get help from our team. We usually respond within a few
                    hours.
                  </p>
                </div>
              </div>
            </header>

            <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <aside className="space-y-4">
                <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-purple-600 via-violet-600 to-fuchsia-500 p-5 text-white shadow-[0_20px_60px_rgba(124,58,237,0.25)] sm:p-6">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(255,255,255,0.25),transparent_32%)]" />

                  <div className="relative">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
                      <Sparkles size={13} />
                      Fast support
                    </div>

                    <h2 className="text-3xl font-black leading-tight tracking-[-0.055em]">
                      Need help with your brand?
                    </h2>

                    <p className="mt-3 text-sm font-semibold leading-6 text-white/80">
                      Send us your question and our team will help with account,
                      products, stores or technical issues.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {[
                    {
                      icon: Zap,
                      title: "Fast answers",
                      desc: "We usually reply within a few hours.",
                    },
                    {
                      icon: MessageCircle,
                      title: "Clear support",
                      desc: "Tell us what happened and we will guide you.",
                    },
                    {
                      icon: CheckCircle2,
                      title: "Useful details",
                      desc: "Screenshots help us solve issues faster.",
                    },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div
                      key={title}
                      className="rounded-[24px] bg-white/90 p-4 shadow-[0_12px_35px_rgba(101,85,143,0.10)] backdrop-blur-xl"
                    >
                      <div className="mb-3 grid h-10 w-10 place-items-center rounded-2xl bg-purple-500/10 text-purple-600">
                        <Icon size={19} />
                      </div>

                      <h3 className="text-base font-black tracking-[-0.035em]">
                        {title}
                      </h3>

                      <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
                        {desc}
                      </p>
                    </div>
                  ))}
                </div>
              </aside>

              <section className="rounded-[28px] bg-white/90 p-4 shadow-[0_12px_35px_rgba(101,85,143,0.12)] backdrop-blur-xl sm:p-6 md:p-7">
                <div className="mb-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-600">
                    Message
                  </p>

                  <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                    Send a message
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Fill the form and we’ll get back to you.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="relative block">
                      <User
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="text"
                        name="name"
                        placeholder="Your name"
                        value={safeText(form.name)}
                        onChange={handleChange}
                        className={`${inputClass} pl-11`}
                      />
                    </label>

                    <label className="relative block">
                      <Mail
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="email"
                        name="email"
                        placeholder="Email address"
                        value={safeText(form.email)}
                        onChange={handleChange}
                        className={`${inputClass} pl-11`}
                      />
                    </label>
                  </div>

                  <textarea
                    name="message"
                    placeholder="Describe your issue..."
                    rows={8}
                    value={safeText(form.message)}
                    onChange={handleChange}
                    className="w-full resize-none rounded-2xl border border-white bg-white/90 px-4 py-4 text-sm font-semibold leading-6 text-slate-700 shadow-[0_12px_35px_rgba(101,85,143,0.10)] outline-none placeholder:text-slate-400 transition focus:ring-4 focus:ring-purple-500/15"
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-500 text-sm font-black text-white shadow-[0_18px_35px_rgba(124,58,237,0.24)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send size={16} />
                    {loading ? "Sending..." : "Send message"}
                  </button>

                  {success && (
                    <p className="flex items-center justify-center gap-2 text-sm font-black text-emerald-600">
                      <CheckCircle2 size={16} />
                      Message sent successfully
                    </p>
                  )}
                </form>
              </section>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
