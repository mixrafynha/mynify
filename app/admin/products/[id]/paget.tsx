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
  const [error, setError] = useState<string | null>(null);

  /* ================= LOAD ================= */
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/admin/products/${id}`);

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Failed to load product");
        }

        setProduct(json.data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error loading product");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  /* ================= UPDATE FIELD ================= */
  const updateField = (field: keyof Product, value: any) => {
    if (!product) return;

    setProduct((prev) =>
      prev
        ? {
            ...prev,
            [field]: value,
          }
        : prev
    );
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!product) return;

    setSaving(true);

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: product.title,
          price: product.price,
          image: product.image,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Save failed");
      }

      // melhor UX do que só redirect seco
      router.push("/admin/products");
      router.refresh();

    } catch (err: any) {
      alert(err.message || "Error saving product");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 animate-pulse text-sm">
          Loading product...
        </p>
      </div>
    );
  }

  /* ================= ERROR ================= */
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-500 text-sm">Product not found</p>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      {/* HEADER */}
      <div className="sticky top-0 bg-white border-b z-40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">

          <h1 className="font-semibold text-sm">
            Edit Product
          </h1>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-black text-white text-sm hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>

        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto p-4 space-y-6">

        {/* IMAGE */}
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="relative w-full aspect-square bg-gray-100">
            <Image
              src={product.image || "/placeholder.png"}
              alt={product.title}
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* TITLE */}
        <div className="bg-white rounded-2xl border p-4 space-y-2">
          <label className="text-xs text-gray-500">Title</label>

          <input
            value={product.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-gray-100 border outline-none focus:border-gray-400"
          />
        </div>

        {/* PRICE */}
        <div className="bg-white rounded-2xl border p-4 space-y-2">
          <label className="text-xs text-gray-500">Price</label>

          <input
            type="number"
            value={product.price}
            onChange={(e) => updateField("price", Number(e.target.value))}
            className="w-full h-10 px-3 rounded-xl bg-gray-100 border outline-none focus:border-gray-400"
          />
        </div>

        {/* IMAGE URL */}
        <div className="bg-white rounded-2xl border p-4 space-y-2">
          <label className="text-xs text-gray-500">Image URL</label>

          <input
            value={product.image || ""}
            onChange={(e) => updateField("image", e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-gray-100 border outline-none focus:border-gray-400"
          />
        </div>

      </div>

    </div>
  );
}