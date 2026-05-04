"use client";

import Sidebar from "@/app/components/sidebar";
import { useState } from "react";

/* ================= SAFE HELPERS ================= */

const safeText = (val: string) =>
  typeof val === "string"
    ? val.replace(/</g, "&lt;").replace(/>/g, "&gt;")
    : "";

/* ================= PAGE ================= */

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setSuccess(false);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (res.ok) {
      setSuccess(true);
      setForm({ name: "", email: "", message: "" });
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f6f4] flex">

      {/* SIDEBAR */}
      <Sidebar />

      {/* CONTENT */}
      <div className="flex-1 md:pl-[280px]">

        <div className="max-w-6xl mx-auto px-6 py-10">

          {/* HEADER (PRINTIFY STYLE) */}
          <div className="mb-10">

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Contact Support
            </h1>

            <p className="text-gray-500 mt-2 text-sm md:text-base max-w-2xl">
              Get help from our team. We usually respond within a few hours.
            </p>

          </div>

          {/* GRID LAYOUT (DESKTOP UPGRADE) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* LEFT INFO PANEL */}
            <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm">

              <h2 className="font-semibold text-lg mb-4">
                💡 Need help?
              </h2>

              <ul className="space-y-3 text-sm text-gray-600">
                <li>✔ Account & billing support</li>
                <li>✔ Product & store questions</li>
                <li>✔ Technical issues</li>
                <li>✔ Partnership requests</li>
              </ul>

              <div className="mt-6 p-4 bg-gray-50 rounded-2xl text-xs text-gray-500">
                Tip: include screenshots for faster support 🚀
              </div>

            </div>

            {/* FORM CARD (CENTER - MAIN FOCUS) */}
            <div className="lg:col-span-2 bg-white border border-black/5 rounded-3xl p-8 shadow-sm">

              <h2 className="text-xl font-bold mb-1">
                Send a message
              </h2>

              <p className="text-sm text-gray-500 mb-6">
                Fill the form and we’ll get back to you.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">

                <div className="grid md:grid-cols-2 gap-4">

                  <input
                    type="text"
                    name="name"
                    placeholder="Your name"
                    value={safeText(form.name)}
                    onChange={handleChange}
                    className="w-full border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
                  />

                  <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={safeText(form.email)}
                    onChange={handleChange}
                    className="w-full border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
                  />

                </div>

                <textarea
                  name="message"
                  placeholder="Describe your issue..."
                  rows={7}
                  value={safeText(form.message)}
                  onChange={handleChange}
                  className="w-full border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send message"}
                </button>

                {success && (
                  <p className="text-green-600 text-sm text-center">
                    Message sent successfully 🚀
                  </p>
                )}

              </form>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}