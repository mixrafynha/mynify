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
  "h-14 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold text-white outline-none placeholder:text-white/30 transition focus:border-purple-400 focus:bg-white/[0.08]";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const { name, value } = e.target;

      setForm((prev) => ({
        ...prev,
        [name]: value.slice(
          0,
          name === "message" ? 1200 : 120
        ),
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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        if (res.ok) {
          setSuccess(true);
          setForm({
            name: "",
            email: "",
            message: "",
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [form]
  );

  return (
    <div className="min-h-screen overflow-hidden bg-[#03030a] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(168,85,247,0.16),transparent_30%),radial-gradient(circle_at_88%_4%,rgba(14,165,233,0.1),transparent_28%),linear-gradient(180deg,#03030a_0%,#070711_52%,#03030a_100%)]" />

      <main className="relative z-10 min-h-screen">
        <div className="px-4 py-5 sm:px-6 md:px-8 md:py-7">
          <div className="mx-auto max-w-[1400px] space-y-5">
            <header className="sticky top-0 z-30 -mx-4 border-b border-white/10 px-4 pb-5 pt-0 backdrop-blur-2xl sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[22px] bg-gradient-to-br from-purple-600 via-violet-600 to-fuchsia-500 text-white shadow-[0_18px_35px_rgba(124,58,237,0.28)]">
                  <Headphones size={24} />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-300">
                    Support
                  </p>

                  <h1 className="truncate text-3xl font-black tracking-[-0.06em] text-white sm:text-5xl">
                    Contact Support
                  </h1>

                  <p className="mt-2 text-sm font-medium text-white/55 sm:text-base">
                    Get help from our team. We usually respond
                    within a few hours.
                  </p>
                </div>
              </div>
            </header>

            <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
              <aside className="space-y-4">
                <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-br from-purple-600 via-violet-600 to-fuchsia-500 p-6 text-white shadow-[0_20px_60px_rgba(124,58,237,0.28)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(255,255,255,0.25),transparent_32%)]" />

                  <div className="relative">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
                      <Sparkles size={13} />
                      Fast support
                    </div>

                    <h2 className="text-3xl font-black leading-tight tracking-[-0.055em]">
                      Need help with your brand?
                    </h2>

                    <p className="mt-4 text-sm font-medium leading-7 text-white/85">
                      Send us your question and our team will help
                      with account, products, stores or technical
                      issues.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
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
                  ].map(
                    ({ icon: Icon, title, desc }) => (
                      <div
                        key={title}
                        className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
                      >
                        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/10 text-purple-300">
                          <Icon size={20} />
                        </div>

                        <h3 className="text-lg font-black tracking-[-0.035em] text-white">
                          {title}
                        </h3>

                        <p className="mt-2 text-sm font-medium leading-6 text-white/55">
                          {desc}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </aside>

              <section className="rounded-[34px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:p-7">
                <div className="mb-7">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-300">
                    Message
                  </p>

                  <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-white">
                    Send a message
                  </h2>

                  <p className="mt-2 text-base font-medium text-white/55">
                    Fill the form and we’ll get back to you.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="relative block">
                      <User
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                      />

                      <input
                        type="text"
                        name="name"
                        placeholder="Your name"
                        value={safeText(form.name)}
                        onChange={handleChange}
                        maxLength={120}
                        className={`${inputClass} pl-12`}
                      />
                    </label>

                    <label className="relative block">
                      <Mail
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                      />

                      <input
                        type="email"
                        name="email"
                        placeholder="Email address"
                        value={safeText(form.email)}
                        onChange={handleChange}
                        maxLength={120}
                        className={`${inputClass} pl-12`}
                      />
                    </label>
                  </div>

                  <textarea
                    name="message"
                    placeholder="Describe your issue..."
                    rows={8}
                    value={safeText(form.message)}
                    onChange={handleChange}
                    maxLength={1200}
                    className="w-full resize-none rounded-[28px] border border-white/10 bg-white/[0.06] px-5 py-4 text-sm font-medium leading-7 text-white outline-none placeholder:text-white/30 transition focus:border-purple-400 focus:bg-white/[0.08]"
                  />

                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-white/35">
                      {form.message.length}/1200
                    </p>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-500 px-7 text-sm font-black text-white shadow-[0_18px_35px_rgba(124,58,237,0.28)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send size={17} />

                      {loading
                        ? "Sending..."
                        : "Send message"}
                    </button>
                  </div>

                  {success && (
                    <p className="flex items-center gap-2 text-sm font-black text-emerald-400">
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
