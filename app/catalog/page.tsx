"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

type ApiProduct = {
  id: string;
  title: string;
  price: number | null;
  currency: string | null;
  image: string | null;
  images?: unknown;
  category: string | null;
  is_active?: boolean | null;
  status?: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  tshirt: "T-Shirts",
  t_shirt: "T-Shirts",
  tee: "T-Shirts",
  tees: "T-Shirts",
  hoodie: "Hoodies",
  hoodies: "Hoodies",
  sweatshirt: "Sweatshirts",
  sweatshirts: "Sweatshirts",
  bag: "Bags",
  bags: "Bags",
  tote: "Bags",
  totes: "Bags",
};

const safeText = (val: unknown) => (typeof val === "string" ? val.replace(/<script.*?>.*?<\/script>/gi, "").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "");

const safeHref = (href: string) => {
  if (typeof href !== "string") return "/";
  const clean = href.trim().toLowerCase();
  if (clean.startsWith("javascript:") || clean.startsWith("data:")) return "/";
  return href.trim() || "/";
};

const imageFrom = (product: ApiProduct) => {
  if (typeof product.image === "string" && product.image.trim()) return product.image.trim();
  if (!Array.isArray(product.images)) return "/placeholder.png";
  for (const item of product.images) {
    const url =
      typeof item === "string"
        ? item
        : item && typeof item === "object"
          ? String((item as { url?: unknown; src?: unknown; image?: unknown; image_url?: unknown; publicUrl?: unknown }).url ?? (item as { url?: unknown; src?: unknown; image?: unknown; image_url?: unknown; publicUrl?: unknown }).src ?? (item as { url?: unknown; src?: unknown; image?: unknown; image_url?: unknown; publicUrl?: unknown }).image ?? (item as { url?: unknown; src?: unknown; image?: unknown; image_url?: unknown; publicUrl?: unknown }).image_url ?? (item as { url?: unknown; src?: unknown; image?: unknown; image_url?: unknown; publicUrl?: unknown }).publicUrl ?? "")
          : "";
    if (url.trim()) return url.trim();
  }
  return "/placeholder.png";
};

const formatPrice = (price: number | null, currency: string | null) => {
  if (price == null || !Number.isFinite(Number(price))) return "Price unavailable";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "EUR",
    maximumFractionDigits: 2,
  }).format(Number(price));
};

export default function CatalogPage() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "";
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      try {
        const url = new URL("/api/products", window.location.origin);
        if (category) url.searchParams.set("category", category);
        const response = await fetch(url.toString(), { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error(`Failed to load products: ${response.status}`);
        const json: { data?: ApiProduct[] } = await response.json();
        setProducts(Array.isArray(json.data) ? json.data : []);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("CATALOG_PRODUCTS_ERROR", error);
          setProducts([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [category]);

  const grouped = useMemo(() => {
    const map: Record<string, ApiProduct[]> = {};
    for (const product of products) {
      const rawKey = (product.category || "Other").trim() || "Other";
      const key = rawKey.toLowerCase();
      (map[key] ||= []).push(product);
    }
    return map;
  }, [products]);

  const categories = Object.keys(grouped)
    .map((key) => ({
      key,
      label: CATEGORY_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <main className="min-h-screen overflow-hidden bg-[#03030a] text-white">
      <section className="relative overflow-hidden px-4 py-12 md:px-8 lg:px-12 lg:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.26),transparent_32%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <h1 className="mx-auto max-w-4xl text-[40px] font-black uppercase leading-[0.9] tracking-[-0.04em] text-white sm:text-6xl md:text-7xl">
            Choose a product
          </h1>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-16 md:px-8 lg:px-12">
        {loading ? (
          <div className="grid min-h-[260px] place-items-center rounded-[2rem] border border-white/10 bg-white/[0.025]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-purple-300" />
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/35">Loading products</p>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="grid min-h-[260px] place-items-center rounded-[2rem] border border-white/10 bg-white/[0.025] text-center">
            <div>
              <CheckCircle2 className="mx-auto h-9 w-9 text-white/25" />
              <p className="mt-4 text-lg font-black text-white">No products found</p>
              <p className="mt-2 text-sm font-semibold text-white/40">Try another category.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {categories.map(({ key, label }) => (
              <section key={key}>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h2 className="text-3xl font-black uppercase tracking-tight md:text-5xl">{safeText(label)}</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {grouped[key].map((product) => (
                    <Link key={product.id} href={`/products/${product.id}`} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-3 shadow-[0_0_30px_rgba(168,85,247,0.08)] transition duration-300 hover:-translate-y-1 hover:border-purple-500/40">
                      <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-black/40">
                        <Image src={imageFrom(product)} alt={product.title} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw" className="object-contain transition duration-500 group-hover:scale-105" />
                      </div>
                      <h3 className="truncate text-sm font-black text-white sm:text-base">{safeText(product.title)}</h3>
                      <p className="mt-1 text-sm font-bold text-white/70">{formatPrice(product.price, product.currency)}</p>
                      <div className="mt-4 flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 font-bold text-white transition group-hover:scale-[1.02]">
                        Design now
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
