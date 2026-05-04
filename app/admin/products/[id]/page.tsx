"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

type Product = {
  id: string;
  title: string;
  price: number;
  image?: string;
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ================= LOAD ================= */
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);

      const res = await fetch(`/api/admin/products/${id}`);
      const json = await res.json();

      setProduct(json?.data || null);
      setLoading(false);
    };

    load();
  }, [id]);

  const updateField = (field: keyof Product, value: any) => {
    setProduct((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!product) return;

    setSaving(true);

    await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: product.title,
        price: product.price,
        image: product.image,
      }),
    });

    setSaving(false);
    router.push("/admin/products");
    router.refresh();
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-sm text-gray-400 animate-pulse">
          Loading product...
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <p className="text-sm text-red-400">Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 text-gray-900">

      {/* HEADER */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/60 border-b border-white/40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">

          <h1 className="text-sm font-medium tracking-wide text-gray-700">
            Edit product
          </h1>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-black text-white text-sm hover:opacity-90 transition shadow-sm"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>

        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* IMAGE CARD */}
        <div className="rounded-3xl overflow-hidden bg-white/60 backdrop-blur-xl shadow-sm">
          <div className="relative w-full aspect-square sm:aspect-[4/3]">
            <Image
              src={product.image || "/placeholder.png"}
              alt={product.title}
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* FORM */}
        <div className="space-y-4">

          {/* TITLE */}
          <div className="rounded-2xl bg-white/60 backdrop-blur-xl p-4 shadow-sm">
            <label className="text-xs text-gray-400">Title</label>

            <input
              value={product.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full mt-2 bg-transparent outline-none text-sm text-gray-800"
            />
          </div>

          {/* PRICE */}
          <div className="rounded-2xl bg-white/60 backdrop-blur-xl p-4 shadow-sm">
            <label className="text-xs text-gray-400">Price</label>

            <input
              type="number"
              value={product.price}
              onChange={(e) => updateField("price", Number(e.target.value))}
              className="w-full mt-2 bg-transparent outline-none text-sm text-gray-800"
            />
          </div>

          {/* IMAGE */}
          <div className="rounded-2xl bg-white/60 backdrop-blur-xl p-4 shadow-sm">
            <label className="text-xs text-gray-400">Image URL</label>

            <input
              value={product.image || ""}
              onChange={(e) => updateField("image", e.target.value)}
              className="w-full mt-2 bg-transparent outline-none text-sm text-gray-800"
            />
          </div>

        </div>

        {/* MOBILE SAVE */}
        <div className="sm:hidden fixed bottom-4 left-0 right-0 px-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-2xl bg-black text-white text-sm shadow-lg"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>

      </div>
    </div>
  );
}