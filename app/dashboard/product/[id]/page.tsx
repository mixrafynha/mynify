import Link from "next/link";
import ProductClient from "./ProductClient";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";

const normalize = (v: any) =>
  String(v ?? "")
    .trim()
    .toLowerCase();

async function getProduct(id: string) {
  try {
    if (!id) return null;

    const supabase = await createSupabaseServer();

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (productError || !product) {
      console.error("PRODUCT ERROR:", productError);
      return null;
    }

    const { data: colorsData, error: colorsError } = await supabase
      .from("product_colors")
      .select("*")
      .eq("product_id", product.id)
      .order("position", { ascending: true });

    if (colorsError) {
      console.error("COLORS ERROR:", colorsError);
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
      const { data: variantsData, error: variantsError } = await supabase
        .from("product_variants")
        .select("*")
        .in("product_color_id", colorIds);

      if (variantsError) {
        console.error("VARIANTS ERROR:", variantsError);
        return null;
      }

      variants = (variantsData || []).map((variant: any) => {
        const color = colors.find(
          (c: any) => c.id === variant.product_color_id
        );

        return {
          id: variant.id,
          product_id: product.id,
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

    const images = Array.isArray(product.images)
      ? product.images.filter(Boolean)
      : product.image
      ? [product.image]
      : [];

    const variantPrices = variants
      .map((variant) => variant.price)
      .filter((price): price is number => typeof price === "number");

    const price =
      variantPrices.length > 0 ? Math.min(...variantPrices) : product.price;

    const defaultVariant =
      variants.find((variant) => variant.stock > 0) || variants[0] || null;

    return {
      ...product,
      images,
      colors,
      variants,
      price,
      defaultVariant,
    };
  } catch (err) {
    console.error("GET PRODUCT ERROR:", err);
    return null;
  }
}

async function getUser() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params?.id;

  if (!id) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#03030a] px-4 text-center text-red-400">
        Invalid product ID
      </main>
    );
  }

  const [product, user] = await Promise.all([getProduct(id), getUser()]);

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#03030a] px-4 text-center text-white/55">
        Product not found
      </main>
    );
  }

  const isAdmin = user?.user_metadata?.role === "admin";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#03030a] text-white">
      <section className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(168,85,247,0.18),transparent_30%),radial-gradient(circle_at_45%_48%,rgba(14,165,233,0.1),transparent_28%)] md:bg-[radial-gradient(circle_at_72%_32%,rgba(168,85,247,0.24),transparent_28%),radial-gradient(circle_at_58%_52%,rgba(14,165,233,0.14),transparent_24%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,10,0.15)_0%,#03030a_100%)]" />

        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#03030a]/92 md:bg-[#03030a]/80 md:backdrop-blur-xl">
          <div className="relative mx-auto flex max-w-7xl items-center justify-center px-3 py-3 sm:px-5 md:justify-between md:px-6 lg:px-8">
            <Link
              href="/"
              className="text-3xl font-black tracking-tight text-white transition active:scale-[0.98] md:text-3xl md:hover:opacity-80"
            >
              MY
              <span className="bg-gradient-to-r from-violet-300 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                NIFY
              </span>
            </Link>

            <Link
              href="/dashboard/product"
              className="group absolute right-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] text-white transition active:scale-[0.98] sm:right-5 md:static md:h-11 md:w-11 md:hover:border-purple-500/40 md:hover:bg-white/10"
              aria-label="Back to products"
            >
              <ArrowLeft
                size={18}
                className="md:transition-transform md:group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto max-w-7xl px-2.5 pb-5 pt-3 sm:px-4 md:px-6 lg:px-8">
          <ProductClient product={product} images={product.images} id={id} />

          {isAdmin && (
            <div className="mt-4 rounded-[18px] border border-white/10 bg-white/[0.055] p-4">
              <p className="text-sm font-bold text-white/70">Admin tools</p>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Link href={`/admin/products/${product.id}`}>
                  <button className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-2.5 font-bold text-white transition active:scale-[0.98] sm:w-auto md:hover:scale-[1.02]">
                    Edit product
                  </button>
                </Link>

                <form
                  action={async () => {
                    "use server";

                    await fetch(
                      `${process.env.NEXT_PUBLIC_SITE_URL}/api/products/${product.id}`,
                      {
                        method: "DELETE",
                      }
                    );
                  }}
                >
                  <button
                    type="submit"
                    className="w-full rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-2.5 font-bold text-red-200 transition active:scale-[0.98] sm:w-auto md:hover:bg-red-500/25"
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