import Link from "next/link";
import ProductClient from "./ProductClient";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";

/* ================= SAFE FETCH ================= */
async function getProduct(id: string) {
  try {
    if (!id) return null;

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/products/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    const product = await res.json();

    if (!product || typeof product !== "object") return null;

    const images = Array.isArray(product.images)
      ? product.images.filter(Boolean)
      : product.image
      ? [product.image]
      : [];

    const variants = Array.isArray(product.variants)
      ? product.variants
      : [];

    const colors = Array.from(
      new Map(
        variants
          .filter((v: any) => v.color)
          .map((v: any) => [
            v.color.toLowerCase().trim(),
            {
              color: v.color,
              color_hex: v.color_hex,
            },
          ])
      ).values()
    );

    return {
      ...product,
      images,
      variants,
      colors,
    };
  } catch (err) {
    console.error("GET PRODUCT ERROR:", err);
    return null;
  }
}

/* ================= USER FETCH ================= */
async function getUser() {
  const supabase = createSupabaseServer();
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

  const [product, user] = await Promise.all([
    getProduct(id),
    getUser(),
  ]);

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

      {/* HEADER PREMIUM */}
      <header className="sticky top-0 z-50 border-b border-gray-200/60 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">

          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight hover:opacity-80 transition"
          >
            MY<span className="text-green-500">NIFY</span>
          </Link>

          <div className="flex items-center gap-3">

            <Link href="/dashboard">
              <button className="group bg-black text-white p-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition flex items-center justify-center">
                <ArrowLeft
                  size={18}
                  className="transition-transform group-hover:-translate-x-0.5"
                />
              </button>
            </Link>

          </div>

        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        <div className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">

          {/* TOP ACCENT */}
          <div className="h-1 w-full bg-gradient-to-r from-green-400 via-emerald-500 to-green-400" />

          <div className="p-4 sm:p-6 lg:p-10">

            {/* PRODUCT UI (USER VIEW) */}
            <ProductClient
              product={product}
              images={product.images}
              id={id}
            />

            {/* ================= ADMIN PANEL ================= */}
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