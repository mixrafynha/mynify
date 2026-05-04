"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImagePlus, Tag, DollarSign } from "lucide-react";

type ProductForm = {
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  is_active: boolean;
  tags: string[];
};

export default function NewProductPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<ProductForm>({
    title: "",
    description: "",
    price: 0,
    image: "",
    category: "",
    is_active: true,
    tags: [],
  });

  const updateField = <K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setTags = (value: string) => {
    const tags = value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    setForm((prev) => ({
      ...prev,
      tags,
    }));
  };

  const save = async () => {
    setError("");

    if (!form.title.trim()) {
      setError("Product title is required.");
      return;
    }

    if (form.price < 0) {
      setError("Price cannot be negative.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category.trim(),
          image: form.image.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to create product.");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <h1 className="text-sm font-semibold">Create Product</h1>

          <button
            onClick={save}
            disabled={loading || !form.title.trim()}
            className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving..." : "Create"}
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 p-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card title="Basic Info">
            <Input
              label="Product title"
              value={form.title}
              onChange={(v) => updateField("title", v)}
            />

            <TextArea
              label="Description"
              value={form.description}
              onChange={(v) => updateField("description", v)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                icon={<DollarSign size={14} />}
                label="Price"
                type="number"
                value={form.price}
                onChange={(v) => updateField("price", Number(v) || 0)}
              />

              <Input
                label="Category"
                value={form.category}
                onChange={(v) => updateField("category", v)}
              />
            </div>

            <Input
              icon={<Tag size={14} />}
              label="Tags (comma separated)"
              value={form.tags.join(", ")}
              onChange={setTags}
            />

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Product Image">
            <Input
              icon={<ImagePlus size={14} />}
              label="Image URL"
              value={form.image}
              onChange={(v) => updateField("image", v)}
            />

            <div className="mt-4 aspect-square overflow-hidden rounded-2xl border bg-gray-100 flex items-center justify-center">
              {form.image ? (
                <Image
                  src={form.image}
                  alt={form.title || "Product preview"}
                  width={800}
                  height={800}
                  className="h-full w-full object-cover"
                />
              ) : (
                <p className="text-xs text-gray-400">
                  Image preview will appear here
                </p>
              )}
            </div>
          </Card>

          <Card title="Status">
            <Toggle
              label="Active product"
              value={form.is_active}
              onChange={(v) => updateField("is_active", v)}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ================= UI ================= */

type CardProps = {
  title: string;
  children: React.ReactNode;
};

function Card({ title, children }: CardProps) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-xs font-medium text-gray-500">{title}</h2>
      {children}
    </div>
  );
}

type InputProps = {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  icon?: React.ReactNode;
};

function Input({
  label,
  value,
  onChange,
  type = "text",
  icon,
}: InputProps) {
  return (
    <div className="mb-3">
      <label className="text-xs text-gray-400">{label}</label>

      <div className="relative mt-1">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-11 w-full rounded-xl border bg-gray-50 px-3 text-sm outline-none transition focus:bg-white ${
            icon ? "pl-9" : ""
          }`}
        />
      </div>
    </div>
  );
}

type TextAreaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function TextArea({ label, value, onChange }: TextAreaProps) {
  return (
    <div className="mb-3">
      <label className="text-xs text-gray-400">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="mt-1 w-full rounded-xl border bg-gray-50 px-3 py-3 text-sm outline-none transition focus:bg-white"
      />
    </div>
  );
}

type ToggleProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

function Toggle({ label, value, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-gray-50 p-3">
      <span className="text-sm">{label}</span>

      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`flex h-6 w-11 items-center rounded-full p-1 transition ${
          value ? "bg-black" : "bg-gray-300"
        }`}
      >
        <div
          className={`h-4 w-4 rounded-full bg-white transition ${
            value ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );

}
