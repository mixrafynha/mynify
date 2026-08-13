import Link from "next/link";
import ProductClient from "./ProductClient";
import { createSupabaseServer } from "@/lib/supabase-server";
import BackButton from "./BackButton";

const normalize = (v: any) =>
  String(v ?? "")
    .trim()
    .toLowerCase();

const PRODUCT_SELECT_FIELDS = [
  "id",
  "title",
  "description",
  "price",
  "currency",
  "discount_price",
  "image",
  "images",
  "category",
  "slug",
  "position",
  "collection",
  "is_new",
  "is_hot",
  "is_featured",
  "status",
  "rating",
  "sales_count",
  "audience",
  "created_at",
].join(", ");

const COLOR_SELECT_FIELDS = [
  "id",
  "product_id",
  "color",
  "color_hex",
  "mockup_front",
  "mockup_back",
  "thumbnail",
  "position",
].join(", ");

const VARIANT_SELECT_FIELDS = [
  "id",
  "product_color_id",
  "name",
  "size",
  "stock",
  "price",
  "sku",
].join(", ");

async function getProduct(id: string) {
  try {
    if (!id) return null;

    const productStageStartedAt = Date.now();
    const clientStartedAt = Date.now();
    const supabase = await createSupabaseServer();
    console.info("[product-perf] supabase_client_created durationMs=" + (Date.now() - clientStartedAt));

    console.info("[product-perf] product_start");
    const { data: product, error: productError } = await supabase
      .from("products")
      .select(PRODUCT_SELECT_FIELDS)
      .eq("id", id)
      .maybeSingle();
    console.info("[product-perf] product_done durationMs=" + (Date.now() - productStageStartedAt));

    if (productError || !product) {
      console.error("PRODUCT ERROR:", productError?.message ?? "Product not found");
      return null;
    }
    const productRow = product as Record<string, any>;

    const colorsStageStartedAt = Date.now();
    console.info("[product-perf] colors_start");
    const { data: colorsData, error: colorsError } = await supabase
      .from("product_colors")
      .select(COLOR_SELECT_FIELDS)
      .eq("product_id", productRow.id)
      .order("position", { ascending: true });
    console.info(
      "[product-perf] colors_done durationMs=" +
        (Date.now() - colorsStageStartedAt) +
        " rows=" +
        (colorsData?.length ?? 0)
    );

    if (colorsError) {
      console.error("COLORS ERROR:", colorsError.message);
      return null;
    }

    const colors = (colorsData || []).map((color: any) => ({
      id: color.id,
      product_id: color.product_id,
      color: color.color,
      color_hex: color.color_hex || "#ccc",
      mockup_front: color.mockup_front,
      mockup_back: color.mockup_back,
      thumbnail: color.thumbnail,
      position: color.position,
    }));

    const colorIds = colors.map((color: any) => color.id);

    let variants: any[] = [];

    if (colorIds.length > 0) {
      const variantsStageStartedAt = Date.now();
      console.info("[product-perf] variants_start rows=" + colorIds.length);
      const { data: variantsData, error: variantsError } = await supabase
        .from("product_variants")
        .select(VARIANT_SELECT_FIELDS)
        .in("product_color_id", colorIds);
      console.info(
        "[product-perf] variants_done durationMs=" +
          (Date.now() - variantsStageStartedAt) +
          " rows=" +
          (variantsData?.length ?? 0)
      );

      if (variantsError) {
        console.error("VARIANTS ERROR:", variantsError.message);
        return null;
      }

      const colorsById = new Map(colors.map((color: any) => [color.id, color]));

      variants = (variantsData || []).map((variant: any) => {
        const color = colorsById.get(variant.product_color_id);

        return {
          id: variant.id,
          product_id: productRow.id,
          product_color_id: variant.product_color_id,
          name: variant.name ?? null,
          size: normalize(variant.size),
          stock: Number(variant.stock ?? 0),
          price: variant.price != null ? Number(variant.price) : null,
          sku: variant.sku ?? null,
          color: color?.color || null,
          color_hex: color?.color_hex || "#ccc",
        };
      });
    }

    const images = Array.isArray(productRow.images)
      ? productRow.images.filter(Boolean)
      : productRow.image
      ? [productRow.image]
      : [];

    const variantPrices = variants
      .map((variant) => variant.price)
      .filter((price): price is number => typeof price === "number");

    const price =
      variantPrices.length > 0 ? Math.min(...variantPrices) : productRow.price;

    const defaultVariant =
      variants.find((variant) => variant.stock > 0) || variants[0] || null;

    return {
      ...productRow,
      images,
      colors,
      variants,
      price,
      defaultVariant,
    };
  } catch (err) {
    console.error("GET PRODUCT ERROR:", err instanceof Error ? err.message : "Unknown error");
    return null;
  }
}

async function getUser() {
  const clientStartedAt = Date.now();
  const supabase = await createSupabaseServer();
  console.info("[product-perf] supabase_client_created durationMs=" + (Date.now() - clientStartedAt));
  console.info("[product-perf] auth_getUser_start");
  const authStartedAt = Date.now();
  const { data } = await supabase.auth.getUser();
  console.info("[product-perf] auth_getUser_done durationMs=" + (Date.now() - authStartedAt));
  return data.user;
}

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const requestStartedAt = Date.now();
  console.info("[product-perf] request_started");

  const id = params?.id;

  if (!id) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#10091a] px-4 text-center text-red-300">
        Invalid product ID
      </main>
    );
  }

  console.info("[product-perf] auth_start");
  const authStartedAt = Date.now();
  const [product, user] = await Promise.all([getProduct(id), getUser()]);
  console.info("[product-perf] auth_done durationMs=" + (Date.now() - authStartedAt));

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#10091a] px-4 text-center text-white/55">
        Product not found
      </main>
    );
  }

  const productData = product as Record<string, any>;
  const isAdmin = user?.user_metadata?.role === "admin";
  console.info("[product-perf] payload_start");
  const payloadEstimateBytes = Buffer.byteLength(
    JSON.stringify({
      ...productData,
      images: productData.images,
      colors: productData.colors,
      variants: productData.variants,
      defaultVariant: productData.defaultVariant,
    }),
    "utf8"
  );
  console.info("[product-perf] payload_done bytes=" + payloadEstimateBytes);

  console.info("[product-perf] server_ready durationMs=" + (Date.now() - requestStartedAt));

  return (
    <main
      className="min-h-screen overflow-x-hidden bg-[#0f0b14] text-white"
    >
      <section className="relative min-h-screen bg-transparent">
        {/* HEADER COM A MESMA UX DO NAVBAR, MAS SEM FUNDO DIFERENTE */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0f0b14]/95">
          <div className="relative mx-auto flex max-w-7xl items-center justify-center px-3 py-3 sm:px-5 md:justify-between md:px-6 lg:px-8">
            <Link
              href="/"
              className="group overflow-visible select-none shrink-0 text-white transition active:scale-[0.98] md:hover:opacity-90"
              aria-label="RYFIO home"
            >
              <div className="relative flex items-center">
                <span
                  className="text-[27px] md:text-[40px] uppercase leading-none tracking-[-0.03em] select-none transition-opacity duration-200 group-hover:opacity-90"
                  style={{
                    fontFamily: "var(--font-logo)",
                    textShadow: "0 0 18px rgba(102, 67, 136, 0.35)",
                  }}
                >
                  <span className="ryfio-letter text-white" style={{ animationDelay: "0ms" }}>R</span>
                  <span className="ryfio-letter text-white" style={{ animationDelay: "120ms" }}>Y</span>
                  <span className="ryfio-letter bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent" style={{ animationDelay: "240ms" }}>F</span>
                  <span className="ryfio-letter bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent" style={{ animationDelay: "360ms" }}>I</span>
                  <span className="ryfio-letter bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent" style={{ animationDelay: "480ms" }}>O</span>
                </span>
              </div>
            </Link>

            <BackButton />
          </div>
        </header>

        <div className="relative z-10 mx-auto max-w-7xl px-2.5 pb-5 pt-3 sm:px-4 md:px-6 lg:px-8">
          <ProductClient product={product} images={product.images} id={id} />

          {isAdmin && (
            <div className="mt-4 rounded-2xl border border-white/[0.06] bg-[#15101d] p-4">
              <p className="text-sm font-bold text-white/75">
                Admin tools
              </p>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Link href={`/admin/products/${productData.id}`}>
                  <button className="w-full rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 font-black text-white transition active:scale-[0.98] sm:w-auto md:hover:border-fuchsia-300/30">
                    Edit product
                  </button>
                </Link>

                <form
                  action={async () => {
                    "use server";

                    await fetch(
                      `${process.env.NEXT_PUBLIC_SITE_URL}/api/products/${productData.id}`,
                      {
                        method: "DELETE",
                      }
                    );
                  }}
                >
                  <button
                    type="submit"
                    className="w-full rounded-full bg-red-400/15 px-4 py-2.5 font-black text-red-200 transition active:scale-[0.98] sm:w-auto md:hover:bg-red-400/25"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
