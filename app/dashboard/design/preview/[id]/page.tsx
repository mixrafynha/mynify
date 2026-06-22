import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";
import { ArrowLeft, Zap } from "lucide-react";
import PreviewGallery from "./PreviewGallery";
import TempPreviewClient from "./TempPreviewClient";

function normalizeImages(value: any): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    } catch {}

    return [value];
  }

  return [];
}

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { tempPreview?: string };
}) {
  const supabase = createSupabaseServer();
  const isTempPreview = searchParams?.tempPreview === "1";

  if (isTempPreview) {
    const { data: baseProduct } = await supabase
      .from("products")
      .select("*")
      .eq("id", params.id)
      .single();

    if (!baseProduct) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#03030a] text-white">
          Product not found
        </main>
      );
    }

    return <TempPreviewClient product={baseProduct} />;
  }

  const { data: product } = await supabase
    .from("user_products")
    .select(`
      *,
      base_product:products (
        id,
        title,
        image,
        images,
        category
      )
    `)
    .eq("id", params.id)
    .single();

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#03030a] text-white">
        Product not found
      </main>
    );
  }

  const category =
    product.category ||
    product.base_product?.category ||
    "Product";

  const editorProductId =
    product.baseProductId ||
    product.base_product_id ||
    product.base_product?.id ||
    product.id;

  const editorCategory = String(category)
    .toLowerCase()
    .replace(/\s+/g, "-");

 const previewImages = [
  ...normalizeImages(product.mockup_images),
  ...normalizeImages(product.mockup_url),
]
  .filter(Boolean)
  .filter(
    (img: string, index: number, arr: string[]) =>
      arr.indexOf(img) === index
  );
  const hasPreview = previewImages.length > 0;

  return (
    <main className="min-h-screen overflow-hidden bg-[#03030a] text-white">
      <section className="relative min-h-screen py-5 sm:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(168,85,247,0.35),transparent_28%),radial-gradient(circle_at_20%_35%,rgba(14,165,233,0.22),transparent_24%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />

        <div className="relative mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
          <div className="mb-5 flex items-center justify-between gap-3">
            <Link
              href={`/dashboard/design/${editorCategory}?productId=${editorProductId}`}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/80 backdrop-blur-xl transition hover:border-purple-500/40 hover:bg-white/10"
            >
              <ArrowLeft size={17} />
              Back to editor
            </Link>

            <div className="rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/85">
              {hasPreview ? "Mockup ready" : "Preview unavailable"}
            </div>
          </div>

          <div className="mb-5">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/85">
              <Zap size={14} className="text-purple-400" />
              Product preview
            </div>

            <h1 className="max-w-4xl text-[34px] font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-5xl md:text-6xl">
              {product.title}
            </h1>
          </div>

          {hasPreview ? (
            <PreviewGallery
              images={previewImages.slice(0, 7)}
              title={product.title}
              category={category}
              price={Number(product.final_price || product.price || 0)}
              isAi={false}
            />
          ) : (
            <div className="rounded-[32px] border border-white/10 bg-white/[0.05] p-10 text-center text-white/70">
              No mockup images found for this product.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}