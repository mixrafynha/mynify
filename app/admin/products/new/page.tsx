"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Tag,
  DollarSign,
  Package,
  X,
  UploadCloud,
  Sparkles,
  Loader2,
  Plus,
  Palette,
  Boxes,
  LinkIcon,
} from "lucide-react";

type Variant = {
  size: string;
  sku: string;
  stock: number;
  price: number;
};

type ColorOption = {
  name: string;
  hex: string;
};

type ProductForm = {
  title: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  images: string[];
  category: string;
  is_active: boolean;
  tags: string[];
  variants: Variant[];
  colors: ColorOption[];
};

type LocalImage = {
  file: File;
  preview: string;
};

const emptyVariant: Variant = {
  size: "",
  sku: "",
  stock: 0,
  price: 0,
};

const emptyColor: ColorOption = {
  name: "",
  hex: "#ffffff",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export default function NewProductPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);

  const [form, setForm] = useState<ProductForm>({
    title: "",
    slug: "",
    description: "",
    price: 0,
    image: "",
    images: [],
    category: "",
    is_active: true,
    tags: [],
    variants: [{ ...emptyVariant }],
    colors: [{ ...emptyColor }],
  });

  const canSave = useMemo(() => {
    return (
      Boolean(form.title.trim()) &&
      Boolean(form.slug.trim()) &&
      form.price > 0 &&
      localImages.length > 0 &&
      !saving &&
      !uploading
    );
  }, [form.title, form.slug, form.price, localImages.length, saving, uploading]);

  const updateField = <K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setTags = (value: string) => {
    updateField(
      "tags",
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    );
  };

  const updateVariant = <K extends keyof Variant>(
    index: number,
    key: K,
    value: Variant[K]
  ) => {
    setForm((prev) => {
      const variants = [...prev.variants];
      variants[index] = { ...variants[index], [key]: value };
      return { ...prev, variants };
    });
  };

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { ...emptyVariant }],
    }));
  };

  const removeVariant = (index: number) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const updateColor = <K extends keyof ColorOption>(
    index: number,
    key: K,
    value: ColorOption[K]
  ) => {
    setForm((prev) => {
      const colors = [...prev.colors];
      colors[index] = { ...colors[index], [key]: value };
      return { ...prev, colors };
    });
  };

  const addColor = () => {
    setForm((prev) => ({
      ...prev,
      colors: [...prev.colors, { ...emptyColor }],
    }));
  };

  const removeColor = (index: number) => {
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }));
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files?.length) return;

    setError("");

    const selected = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 8);

    if (!selected.length) {
      setError("Please choose valid image files.");
      return;
    }

    const previews = selected.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setLocalImages((prev) => [...prev, ...previews].slice(0, 8));
  }, []);

  const removeLocalImage = useCallback((index: number) => {
    setLocalImages((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index]?.preview);
      next.splice(index, 1);
      return next;
    });
  }, []);

  const uploadImagesToR2 = async () => {
    if (!localImages.length) {
      throw new Error("Please upload at least one product image.");
    }

    setUploading(true);

    try {
      const urls: string[] = [];

      for (const item of localImages) {
        const data = new FormData();
        data.append("file", item.file);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: data,
        });

        const json = await res.json().catch(() => null);

        if (!res.ok || !json?.url) {
          throw new Error(json?.error || json?.message || "Image upload failed.");
        }

        urls.push(json.url);
      }

      return urls;
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setError("");

    if (!form.title.trim()) return setError("Product title is required.");
    if (!form.slug.trim()) return setError("Slug is required.");
    if (form.price <= 0) return setError("Price must be greater than 0.");
    if (!localImages.length) return setError("Upload at least one image.");

    try {
      setSaving(true);

      const r2Urls = await uploadImagesToR2();

      const variants = form.variants
        .map((v) => ({
          size: v.size.trim(),
          sku: v.sku.trim(),
          stock: Number(v.stock) || 0,
          price: Number(v.price) || form.price,
          name: v.size.trim(),
        }))
        .filter((v) => v.size || v.sku);

      const colors = form.colors
        .map((c) => ({
          name: c.name.trim(),
          color: c.name.trim(),
          hex: c.hex.trim(),
          color_hex: c.hex.trim(),
          thumbnail: r2Urls[0],
          mockup_front: r2Urls[0],
          mockup_back: r2Urls[1] || null,
        }))
        .filter((c) => c.name);

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          ...form,
          title: form.title.trim(),
          slug: form.slug.trim() || slugify(form.title),
          description: form.description.trim(),
          category: form.category.trim(),
          image: r2Urls[0],
          images: r2Urls,
          variants,
          colors,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || data?.message || "Failed to create product.");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080814] text-white">
      <div className="mx-auto max-w-[1350px] px-3 pb-10 pt-3 sm:px-5 md:px-8">
        <header className="sticky top-0 z-40 -mx-3 bg-[#080814] px-3 pb-3 pt-3 sm:-mx-5 sm:px-5 md:-mx-8 md:px-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/60">
                Admin
              </p>
              <h1 className="text-xl font-black tracking-[-0.04em] sm:text-2xl">
                Create Product
              </h1>
            </div>

            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.065] px-3 text-xs font-black text-white transition active:scale-95 hover:border-fuchsia-400/25 hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-45 sm:px-5"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500">
                {saving || uploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Package size={16} />
                )}
              </span>

              <span className="hidden sm:inline">
                {saving ? "Creating..." : uploading ? "Uploading..." : "Create product"}
              </span>
            </button>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-4">
            <Card title="Basic Info">
              <Input
                label="Product title"
                value={form.title}
                onChange={(v) => {
                  updateField("title", v);
                  updateField("slug", slugify(v));
                }}
              />

              <Input
                icon={<LinkIcon size={14} />}
                label="Slug"
                value={form.slug}
                onChange={(v) => updateField("slug", slugify(v))}
                placeholder="premium-tshirt"
              />

              <TextArea
                label="Description"
                value={form.description}
                onChange={(v) => updateField("description", v)}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  placeholder="T-Shirts"
                />
              </div>

              <Input
                icon={<Tag size={14} />}
                label="Tags"
                value={form.tags.join(", ")}
                onChange={setTags}
                placeholder="hoodie, black, limited"
              />

              {error && (
                <div className="rounded-[22px] border border-rose-300/20 bg-rose-400/10 p-4 text-sm font-bold text-rose-100">
                  {error}
                </div>
              )}
            </Card>

            <Card title="Variants">
              <div className="space-y-3">
                {form.variants.map((variant, index) => (
                  <div
                    key={index}
                    className="rounded-[24px] border border-white/[0.06] bg-white/[0.045] p-3"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-black text-cyan-100">
                        <Boxes size={15} />
                        Variant {index + 1}
                      </div>

                      {form.variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="grid h-8 w-8 place-items-center rounded-full bg-rose-400/10 text-rose-100"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input
                        label="Size"
                        value={variant.size}
                        onChange={(v) => updateVariant(index, "size", v)}
                        placeholder="S, M, L, XL"
                      />

                      <Input
                        label="SKU"
                        value={variant.sku}
                        onChange={(v) => updateVariant(index, "sku", v)}
                        placeholder="TSHIRT-BLK-M"
                      />

                      <Input
                        label="Stock"
                        type="number"
                        value={variant.stock}
                        onChange={(v) => updateVariant(index, "stock", Number(v) || 0)}
                      />

                      <Input
                        label="Variant price"
                        type="number"
                        value={variant.price}
                        onChange={(v) => updateVariant(index, "price", Number(v) || 0)}
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addVariant}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 text-xs font-black text-cyan-100"
                >
                  <Plus size={15} />
                  Add variant
                </button>
              </div>
            </Card>

            <Card title="Colors">
              <div className="space-y-3">
                {form.colors.map((color, index) => (
                  <div
                    key={index}
                    className="rounded-[24px] border border-white/[0.06] bg-white/[0.045] p-3"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-black text-cyan-100">
                        <Palette size={15} />
                        Color {index + 1}
                      </div>

                      {form.colors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeColor(index)}
                          className="grid h-8 w-8 place-items-center rounded-full bg-rose-400/10 text-rose-100"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-[1fr_56px] gap-3">
                      <Input
                        label="Color name"
                        value={color.name}
                        onChange={(v) => updateColor(index, "name", v)}
                        placeholder="Black"
                      />

                      <div>
                        <label className="text-xs font-black text-white/45">
                          Hex
                        </label>
                        <input
                          type="color"
                          value={color.hex}
                          onChange={(e) => updateColor(index, "hex", e.target.value)}
                          className="mt-1 h-12 w-full rounded-full border border-white/[0.06] bg-white/[0.065] p-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addColor}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-fuchsia-300/20 bg-fuchsia-400/10 text-xs font-black text-fuchsia-100"
                >
                  <Plus size={15} />
                  Add color
                </button>
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

          <div className="space-y-4">
            <Card title="Product Images">
              <label
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  handleFiles(event.dataTransfer.files);
                }}
                className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-white/[0.12] bg-white/[0.045] p-6 text-center transition hover:border-fuchsia-400/25 hover:bg-white/[0.075] active:scale-[0.99]"
              >
                <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500">
                  <UploadCloud size={25} />
                </div>

                <p className="mt-4 text-sm font-black">
                  Click or drop images here
                </p>

                <p className="mt-1 text-xs font-semibold text-white/40">
                  PNG, JPG, WEBP — up to 8 images
                </p>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => handleFiles(event.target.files)}
                />
              </label>

              {localImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {localImages.map((item, index) => (
                    <div
                      key={item.preview}
                      className="group relative aspect-square overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#18182d]"
                    >
                      <Image
                        src={item.preview}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover"
                      />

                      {index === 0 && (
                        <div className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                          Main
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => removeLocalImage(index)}
                        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/45 text-white backdrop-blur-xl"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-[28px] border border-white/[0.06] bg-[#18182d] text-center">
                  <div>
                    <Sparkles className="mx-auto text-cyan-100/70" size={24} />
                    <p className="mt-3 text-xs font-bold text-white/35">
                      Image preview will appear here
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[30px] border border-white/[0.08] bg-gradient-to-b from-[#1b1830] via-[#131325] to-[#0f1020] p-4">
      <h2 className="mb-4 text-[10px] font-black uppercase tracking-[0.16em] text-[#b8b9d9]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  icon,
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  icon?: React.ReactNode;
  placeholder?: string;
}) {
  return (
    <div className="mb-3">
      <label className="text-xs font-black text-white/45">{label}</label>

      <div className="relative mt-1">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-100/55">
            {icon}
          </div>
        )}

        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`h-12 w-full rounded-full border border-white/[0.06] bg-white/[0.065] px-4 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-cyan-300/25 focus:bg-white/[0.105] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
            icon ? "pl-11" : ""
          }`}
        />
      </div>
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-3">
      <label className="text-xs font-black text-white/45">{label}</label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="mt-1 w-full resize-none rounded-[24px] border border-white/[0.06] bg-white/[0.065] px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300/25 focus:bg-white/[0.105]"
      />
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-[24px] border border-white/[0.06] bg-white/[0.055] p-4">
      <span className="text-sm font-black text-white">{label}</span>

      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`flex h-8 w-14 items-center rounded-full p-1 transition ${
          value
            ? "bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500"
            : "bg-white/[0.12]"
        }`}
      >
        <span
          className={`h-6 w-6 rounded-full bg-white transition ${
            value ? "translate-x-6" : ""
          }`}
        />
      </button>
    </div>
  );
}