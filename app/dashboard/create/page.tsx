"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DesignUploader from "@/app/components/create/editor/DesignUploader";
import PreviewStudio from "@/app/components/create/editor/PreviewStudio";
import PricingPanel from "@/app/components/create/editor/PricingPanel";

const CATEGORIES = [
  { id: "tshirt", label: "T-Shirt", desc: "Everyday essentials", emoji: "👕" },
  { id: "hoodie", label: "Hoodie", desc: "Premium comfort wear", emoji: "🧥" },
  { id: "mug", label: "Mug", desc: "Custom ceramic mugs", emoji: "☕" }
];

type Product = {
  id: string;
  title: string;
  price: number;
  image?: string;
};

export default function CreatePage() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [category, setCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);

  const [loading, setLoading] = useState(false);

  const [design, setDesign] = useState<string | null>(null);
  const [markup, setMarkup] = useState(10);

  const price = (selected?.price || 0) + markup;

  /* =========================
     EXIT HANDLER (SAFE)
  ========================= */
  const handleExit = () => {
    const confirmExit = window.confirm(
      "Do you want to leave? Unsaved changes will be lost."
    );

    if (!confirmExit) return;

    router.push("/dashboard"); // muda se quiseres outra rota
  };

  /* =========================
     FETCH PRODUCTS
  ========================= */
  useEffect(() => {
    if (!category) return;

    const load = async () => {
      setLoading(true);

      const res = await fetch("/api/products/by-type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: category })
      });

      const data = await res.json();

      setProducts(data || []);
      setSelected(data?.[0] || null);
      setLoading(false);
    };

    load();
  }, [category]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] px-9 sm:px-7 lg:px-10 py-10">

        <button
          onClick={handleExit}
          className="
            fixed top-8 right-4 sm:right-40 z-50

            flex items-center gap-2

            px-4 py-2 rounded-full

            bg-white/70 backdrop-blur-md
            border border-gray-200

            text-sm font-medium text-gray-700

            hover:bg-white transition
            shadow-sm
          "
        >
          ← Exit
        </button>
      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-10">

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
          Create your product
        </h1>

        <p className="text-base sm:text-lg text-gray-500 mt-3 leading-relaxed">
          Design, customize and publish your products in seconds.
        </p>

        {/* STEP INDICATOR */}
        <div className="flex gap-2 mt-6 text-xs sm:text-sm">

          {["Choose", "Select", "Design"].map((s, i) => (
            <div
              key={s}
              className={`
                px-3 py-1 rounded-full border font-medium transition
                ${step === i + 1
                  ? "bg-white shadow-sm border-gray-200 text-black"
                  : "border-gray-200 text-gray-500"}
              `}
            >
              {s}
            </div>
          ))}

        </div>

      </div>

      <div className="max-w-6xl mx-auto">

        {/* ================= STEP 1 ================= */}
        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCategory(c.id);
                  setStep(2);
                }}
                className="
                  p-8 sm:p-10 rounded-2xl bg-white
                  border border-gray-200
                  hover:shadow-md hover:-translate-y-1
                  transition text-left
                "
              >
                <div className="text-4xl sm:text-5xl mb-4">
                  {c.emoji}
                </div>

                <p className="text-lg sm:text-xl font-semibold tracking-tight">
                  {c.label}
                </p>

                <p className="text-sm sm:text-base text-gray-500 mt-2 leading-relaxed">
                  {c.desc}
                </p>
              </button>
            ))}

          </div>
        )}

        {/* ================= STEP 2 ================= */}
        {step === 2 && (
          <div>

            <div className="flex items-center justify-between mb-8">

              <p className="text-sm sm:text-base text-gray-500">
                Choose a{" "}
                <span className="text-[#1d1d1f] font-semibold capitalize">
                  {category}
                </span>
              </p>

              <button
                onClick={() => setStep(1)}
                className="text-sm text-gray-400 hover:text-black transition"
              >
                ← Back
              </button>

            </div>

            {/* LOADING */}
            {loading && (
              <div className="text-gray-400 animate-pulse">
                Loading products...
              </div>
            )}

            {/* GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-10">

              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="text-left group"
                >
                  <div className={`
                    aspect-square rounded-2xl overflow-hidden
                    bg-white border border-gray-200
                    transition
                    ${selected?.id === p.id ? "ring-2 ring-gray-400" : ""}
                  `}>
                    <img
                      src={p.image || "/placeholder.png"}
                      className="w-full h-full object-contain p-4 group-hover:scale-105 transition"
                    />
                  </div>

                  <p className="text-sm sm:text-base font-semibold mt-3">
                    {p.title}
                  </p>

                  <p className="text-xs sm:text-sm text-gray-500">
                    €{p.price}
                  </p>
                </button>
              ))}

            </div>

            {/* ACTIONS */}
            <div className="flex justify-between mt-12">

            
              

              <button
                onClick={() => setStep(3)}
                disabled={!selected}
                className="
                  bg-black text-white px-6 py-3 rounded-xl
                  font-semibold
                  disabled:opacity-30
                "
              >
                Continue →
              </button>

            </div>

          </div>
        )}

        {/* ================= STEP 3 ================= */}
        {step === 3 && selected && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            <DesignUploader setDesign={setDesign} />

            <PreviewStudio selected={selected} design={design} />

            <PricingPanel
              selected={selected}
              markup={markup}
              setMarkup={setMarkup}
              price={price}
            />

          </div>
        )}

      </div>
    </div>
  );
}