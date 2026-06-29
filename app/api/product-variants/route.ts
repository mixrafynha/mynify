import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, any>;

function readFirst(row: AnyRow | null | undefined, keys: string[], fallback: any = null) {
  if (!row) return fallback;
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}

function normalizeColor(color: AnyRow | null | undefined) {
  if (!color) return null;

  return {
    id: color.id ?? null,
    product_id: color.product_id ?? null,
    name: readFirst(color, ["color", "name", "color_name", "title", "label"], null),
    color: readFirst(color, ["color", "name", "color_name", "title", "label"], null),
    color_hex: readFirst(color, ["color_hex", "hex", "hex_code", "value"], "#d1d5db"),
    image: readFirst(color, ["image", "image_url", "thumbnail", "thumbnail_url", "mockup_url"], null),
    position: readFirst(color, ["position", "sort_order", "order"], 0),
    raw: color,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId")?.trim();

  if (!productId) {
    return NextResponse.json(
      { variants: [], error: "Missing productId" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const supabase = await createSupabaseServer();

  const { data: colorsData, error: colorsError } = await supabase
    .from("product_colors")
    .select("*")
    .eq("product_id", productId);

  if (colorsError) {
    return NextResponse.json(
      { variants: [], error: colorsError.message || "Failed to load product colors" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  const colors = (colorsData ?? []).map(normalizeColor).filter(Boolean) as AnyRow[];
  const colorIds = colors.map((color) => color.id).filter(Boolean);

  if (!colorIds.length) {
    return NextResponse.json(
      { variants: [], colors: [] },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { data: variantsData, error: variantsError } = await supabase
    .from("product_variants")
    .select("*")
    .in("product_color_id", colorIds)
    .order("size", { ascending: true });

  if (variantsError) {
    return NextResponse.json(
      { variants: [], error: variantsError.message || "Failed to load product variants" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  const colorMap = new Map(colors.map((color) => [color.id, color]));

  const variants = (variantsData ?? []).map((variant: AnyRow) => {
    const color = colorMap.get(variant.product_color_id) ?? null;
    const colorName = color?.color ?? color?.name ?? null;
    const colorHex = color?.color_hex ?? "#d1d5db";
    const image = color?.image ?? readFirst(variant, ["image", "image_url", "mockup_url"], null);

    return {
      id: variant.id,
      variant_id: variant.id,
      product_color_id: variant.product_color_id,
      size: variant.size,
      name: variant.name,
      sku: variant.sku,
      stock: Number(variant.stock ?? 0),
      price: variant.price,
      color: colorName,
      color_name: colorName,
      color_hex: colorHex,
      image,
      image_url: image,
      product_color: color,
      raw: variant,
    };
  });

  const availableVariants = {
    colors,
    sizes: Array.from(new Set(variants.map((v) => v.size).filter(Boolean))),
    variants,
  };

  return NextResponse.json(
    { variants, availableVariants, colors },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
