"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
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
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#03030a] text-white">
      <section className="relative mx-auto flex min-h-screen max-w-4xl items-center px-4 py-14 md:px-8 lg:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.24),transparent_32%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />
        <div className="relative w-full text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-purple-300">
            <Sparkles size={14} />
            Real product
          </div>

          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-black tracking-[-0.06em] sm:text-6xl">
            {product.title}
          </h1>

          <Link
            href={`/dashboard/product/${product.id}`}
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-6 py-4 font-black text-white shadow-[0_0_34px_rgba(168,85,247,0.34)] transition hover:scale-[1.02]"
          >
            Design now
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </main>
  );
}
