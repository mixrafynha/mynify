import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { ArrowLeft, Zap } from "lucide-react";
import PreviewGallery from "./PreviewGallery";

export default async function PreviewPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServer();

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

  const needsAi =
    !product.ai_mockup_url &&
    (!product.ai_mockup_images || product.ai_mockup_images.length === 0) &&
    product.design_image_url;

  if (needsAi) {
    redirect(
      `/api/products/${product.id}/generate-ai-mockup?redirect=/dashboard/design/preview/${product.id}`
    );
  }

  const baseImages = [
    product.base_product?.image,
    ...(product.base_product?.images || []),
  ]
    .filter(Boolean)
    .filter(
      (img: string, index: number, arr: string[]) => arr.indexOf(img) === index
    );

  const category =
    product.category || product.base_product?.category || "Product";

  const fallbackMockup = category.toLowerCase().includes("shirt")
    ? "/mockups/tshirt-front.png"
    : "/mockups/hoodie-front.png";

  const previewImages = (
    product.ai_mockup_images?.length > 0
      ? product.ai_mockup_images
      : product.ai_mockup_url
        ? [product.ai_mockup_url, ...baseImages]
        : baseImages.length > 0
          ? baseImages
          : [fallbackMockup]
  )
    .filter(Boolean)
    .filter(
      (img: string, index: number, arr: string[]) => arr.indexOf(img) === index
    );

  const isAi =
    product.ai_mockup_images?.length > 0 || Boolean(product.ai_mockup_url);

  return (
    <main className="min-h-screen overflow-hidden bg-[#03030a] text-white">
      <section className="relative min-h-screen py-5 sm:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(168,85,247,0.35),transparent_28%),radial-gradient(circle_at_20%_35%,rgba(14,165,233,0.22),transparent_24%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />

        <div className="relative mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
          <div className="mb-5 flex items-center justify-between gap-3">
            <Link
              href={`/dashboard/design?productId=${product.baseProductId || product.base_product_id || product.base_product?.id || product.id}`}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/80 backdrop-blur-xl transition hover:border-purple-500/40 hover:bg-white/10"
            >
              <ArrowLeft size={17} />
              Back to editor
            </Link>

            <div className="rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/85 shadow-[0_0_22px_rgba(168,85,247,0.35)] sm:text-xs">
              {isAi ? "AI preview ready" : "Generating AI preview..."}
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

          <PreviewGallery
            images={previewImages.slice(0, 7)}
            title={product.title}
            category={category}
            price={Number(product.final_price || product.price || 0)}
            isAi={isAi}
          />
        </div>
      </section>
    </main>
  );
}