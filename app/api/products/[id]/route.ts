import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const normalize = (v: any) =>
  String(v ?? "")
    .trim()
    .toLowerCase();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = (params?.id || "").trim();

    if (!id) {
      return NextResponse.json(
        { error: "Invalid id" },
        { status: 400 }
      );
    }

    /* =========================
       PRODUCT
    ========================= */
    const { data: product, error } = await supabase
      .from("products")
      .select(
        "id, slug, title, description, price, currency, image, images, is_active"
      )
      .eq("is_active", true)
      .or(`id.eq.${id},slug.eq.${id}`)
      .maybeSingle();

    if (error || !product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    /* =========================
       VARIANTS
    ========================= */
    const { data: rawVariants } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", product.id);

    const variants = (rawVariants ?? [])
      .map((v: any) => ({
        id: v.id,
        product_id: v.product_id,
        name: v.name ?? null,
        color: normalize(v.color),
        size: normalize(v.size),
        stock: Number(v.stock ?? 0),
        price: v.price != null ? Number(v.price) : null,
        color_hex: v.color_hex || "#ccc",
        sku: v.sku ?? null,
      }))
      .filter((v) => v.price != null); // 👈 REMOVE variantes sem preço

    /* =========================
       IMAGES
    ========================= */
    const images = Array.isArray(product.images)
      ? product.images.filter(Boolean)
      : product.image
      ? [product.image]
      : [];

    /* =========================
       COLORS
    ========================= */
    const colorsMap = new Map();

    for (const v of variants) {
      if (!v.color) continue;

      if (!colorsMap.has(v.color)) {
        colorsMap.set(v.color, {
          color: v.color,
          color_hex: v.color_hex || "#ccc",
        });
      }
    }

    const colors = Array.from(colorsMap.values());

    /* =========================
       PRICE (CORRIGIDO)
    ========================= */

    // 🔥 regra: menor preço das variantes (mais correto para ecommerce)
    const variantPrices = variants
      .map((v) => v.price)
      .filter((p): p is number => typeof p === "number");

    const price =
      variantPrices.length > 0
        ? Math.min(...variantPrices)
        : product.price;

    /* =========================
       DEFAULT VARIANT
    ========================= */
    const defaultVariant =
      variants.find((v) => v.stock > 0) ||
      variants[0] ||
      null;

    /* =========================
       RESPONSE
    ========================= */
    return NextResponse.json({
      id: product.id,
      slug: product.slug,
      title: product.title,
      description: product.description,
      currency: product.currency,
      is_active: product.is_active,

      price,
      images,

      variants,
      colors,
      defaultVariant,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}