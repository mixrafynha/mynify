import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

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
    const supabase = await createSupabaseServer();
    const id = params?.id?.trim();

    if (!id) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (productError || !product) {
      console.error("PRODUCT ERROR:", productError);

      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const { data: colorsData, error: colorsError } = await supabase
      .from("product_colors")
      .select("*")
      .eq("product_id", product.id)
      .order("position", { ascending: true });

    if (colorsError) {
      console.error("COLORS ERROR:", colorsError);

      return NextResponse.json(
        { error: colorsError.message },
        { status: 500 }
      );
    }

    const colors = (colorsData || []).map((c: any) => ({
      id: c.id,
      product_id: c.product_id,
      color: c.color,
      color_hex: c.color_hex || "#ccc",
      mockup_front: c.mockup_front,
      mockup_back: c.mockup_back,
      thumbnail: c.thumbnail,
      position: c.position,
    }));

    const colorIds = colors.map((c: any) => c.id);

    let variants: any[] = [];

    if (colorIds.length > 0) {
      const { data: variantsData, error: variantsError } = await supabase
        .from("product_variants")
        .select("*")
        .in("product_color_id", colorIds);

      if (variantsError) {
        console.error("VARIANTS ERROR:", variantsError);

        return NextResponse.json(
          { error: variantsError.message },
          { status: 500 }
        );
      }

      variants = (variantsData || []).map((v: any) => {
        const color = colors.find((c: any) => c.id === v.product_color_id);

        return {
          id: v.id,
          product_id: product.id,
          product_color_id: v.product_color_id,
          name: v.name ?? null,
          size: normalize(v.size),
          stock: Number(v.stock ?? 0),
          price: v.price != null ? Number(v.price) : null,
          sku: v.sku ?? null,
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
      .map((v) => v.price)
      .filter((p): p is number => typeof p === "number");

    const price =
      variantPrices.length > 0
        ? Math.min(...variantPrices)
        : Number(product.price);

    const defaultVariant =
      variants.find((v) => v.stock > 0) || variants[0] || null;

    const responseProduct = {
      ...product,
      price,
      images,
      colors,
      variants,
      defaultVariant,
    };

    return NextResponse.json({
      product: responseProduct,
      ...responseProduct,
    });
  } catch (err: any) {
    console.error("GET PRODUCT ERROR:", err);

    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}