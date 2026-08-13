"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";

type ApiProduct = {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  image: string | null;
  images?: unknown;
};

type ProductResponse = {
  product?: ApiProduct & { colors?: unknown[]; variants?: unknown[] };
};

const formatPrice = (price: number | null, currency: string | null) => {
  if (price == null || !Number.isFinite(Number(price))) return "Price unavailable";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "EUR",
    maximumFractionDigits: 2,
  }).format(Number(price));
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

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<(ApiProduct & { colors?: unknown[]; variants?: unknown[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/products/${params.id}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`Failed to load product: ${response.status}`);
        const json: ProductResponse = await response.json();
        setProduct(json.product ?? null);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("PRODUCT_DETAIL_ERROR", error);
          setProduct(null);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#03030a] px-4 py-20 text-white">
        <div className="grid min-h-[50vh] place-items-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-300" />
            <p className="text-xs font-black uppercase tracking-[0.24em] text-white/35">Loading product</p>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[#03030a] px-4 py-20 text-white">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.035] p-8 text-center">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-purple-300">Product not found</p>
          <Link href="/products" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-3 font-black text-white">
            <ArrowLeft size={16} />
            Back to products
          </Link>
        </div>
      </main>
    );
  }

  const image = imageFrom(product);

  return (
    <main className="min-h-screen overflow-hidden bg-[#03030a] text-white">
      <section className="relative mx-auto grid max-w-7xl gap-8 px-4 py-14 md:px-8 lg:grid-cols-[1fr_0.95fr] lg:px-12 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.24),transparent_32%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />
        <div className="relative">
          <Link href="/products" className="inline-flex items-center gap-2 text-sm font-black text-white/55 transition hover:text-white">
            <ArrowLeft size={16} />
            Back to products
          </Link>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-purple-300">
            <Sparkles size={14} />
            Real product
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-[-0.06em] sm:text-6xl">{product.title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">{product.description || "This product is available in the public catalogue and can be opened directly in the editor."}</p>
          <div className="mt-6 flex items-center gap-3 text-sm font-black text-white/80">
            <span>{formatPrice(product.price, product.currency)}</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>{product.currency || "EUR"}</span>
          </div>
          <Link href={`/dashboard/product/${product.id}`} className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-6 py-4 font-black text-white shadow-[0_0_34px_rgba(168,85,247,0.34)] transition hover:scale-[1.02]">
            Design now
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.035] p-4 shadow-[0_0_70px_rgba(168,85,247,0.1)]">
            <div className="relative aspect-square overflow-hidden rounded-[24px] bg-black/30">
              <Image src={image} alt={product.title} fill sizes="(max-width: 1024px) 92vw, 46vw" className="object-contain" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
