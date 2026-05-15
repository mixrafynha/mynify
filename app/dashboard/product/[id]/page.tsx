import Link from "next/link";
import ProductClient from "./ProductClient";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";

/* ================= HELPERS ================= */

const normalize = (v: any) =>
  String(v ?? "")
    .trim()
    .toLowerCase();

/* ================= SAFE FETCH ================= */

async function getProduct(id: string) {
  try {
    if (!id) return null;

    const supabase = await createSupabaseServer();

    /* ================= PRODUCT ================= */

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (productError || !product) {
      console.error("PRODUCT ERROR:", productError);
      return null;
    }

    /* ================= COLORS ================= */

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

    /* ================= VARIANTS ================= */

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

    /* ================= IMAGES ================= */

    const images = Array.isArray(product.images)
      ? product.images.filter(Boolean)
      : product.image
      ? [product.image]
      : [];

    /* ================= PRICE ================= */

    const variantPrices = variants
      .map((variant) => variant.price)
      .filter((price): price is number => typeof price === "number");

    const price =
      variantPrices.length > 0
        ? Math.min(...variantPrices)
        : product.price;

    /* ================= DEFAULT VARIANT ================= */

    const defaultVariant =
      variants.find((variant) => variant.stock > 0) ||
      variants[0] ||
      null;

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

/* ================= USER FETCH ================= */

async function getUser() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/* ================= PAGE ================= */

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params?.id;

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500">
        Invalid product ID
      </div>
    );
  }

  const [product, user] = await Promise.all([getProduct(id), getUser()]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        Product not found
      </div>
    );
  }

  const isAdmin = user?.user_metadata?.role === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-white">
      <header className="sticky top-0 z-50 border-b border-gray-200/60 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight hover:opacity-80 transition"
          >
            MY<span className="text-green-500">NIFY</span>
          </Link>

          <Link href="/dashboard">
            <button className="group bg-black text-white p-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition flex items-center justify-center">
              <ArrowLeft
                size={18}
                className="transition-transform group-hover:-translate-x-0.5"
              />
            </button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-green-400 via-emerald-500 to-green-400" />

          <div className="p-4 sm:p-6 lg:p-10">
            <ProductClient product={product} images={product.images} id={id} />

            {isAdmin && (
              <div className="mt-8 p-4 rounded-2xl border border-gray-200 bg-gray-50">
                <p className="text-sm font-medium text-gray-700">
                  Admin tools
                </p>

                <div className="flex gap-2 mt-3">
                  <Link href={`/admin/products/${product.id}`}>
                    <button className="px-4 py-2 rounded-xl bg-black text-white">
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
                      className="px-4 py-2 rounded-xl bg-red-500 text-white"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}