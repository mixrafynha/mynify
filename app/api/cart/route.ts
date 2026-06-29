import { createSupabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function resolveProductIds(supabase: any, productId: string) {
  const ids = [productId];

  const { data: userProduct } = await supabase
    .from("user_products")
    .select("base_product_id")
    .eq("id", productId)
    .maybeSingle();

  if (userProduct?.base_product_id) ids.push(userProduct.base_product_id);

  return Array.from(new Set(ids.filter(Boolean)));
}

async function getAvailableVariants(supabase: any, productId: string) {
  const productIds = await resolveProductIds(supabase, productId);

  const { data: colors, error: colorsError } = await supabase
    .from("product_colors")
    .select("id, product_id, color, color_hex, image, position")
    .in("product_id", productIds)
    .order("position", { ascending: true });

  if (colorsError || !colors?.length) return [];

  const colorIds = colors.map((color: any) => color.id).filter(Boolean);

  const { data: variants, error: variantsError } = await supabase
    .from("product_variants")
    .select("id, size, stock, price, sku, name, product_color_id")
    .in("product_color_id", colorIds)
    .order("size", { ascending: true });

  if (variantsError || !variants?.length) return [];

  const colorMap = new Map(colors.map((color: any) => [color.id, color]));

  return variants.map((variant: any) => {
    const color = colorMap.get(variant.product_color_id);

    return {
      id: variant.id,
      variant_id: variant.id,
      size: variant.size ?? null,
      stock: variant.stock ?? null,
      price: variant.price === null || variant.price === undefined ? null : Number(variant.price),
      sku: variant.sku ?? null,
      name: variant.name ?? null,
      product_color_id: variant.product_color_id ?? null,
      color: color?.color ?? null,
      color_hex: color?.color_hex ?? "#cccccc",
      image: color?.image ?? null,
      product_id: color?.product_id ?? null,
    };
  });
}

export async function GET() {
  try {
    const supabase = createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        id,
        product_id,
        variant_id,
        title,
        price,
        currency,
        quantity,
        color,
        size,
        sku,
        image,
        created_at,
        product_variants!cart_items_variant_id_fkey (
          id,
          stock,
          size,
          price,
          sku,
          product_color_id
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500, headers: { "Cache-Control": "no-store" } });
    }

    const items = await Promise.all(
      (data ?? []).map(async (item: any) => {
        const availableVariants = await getAvailableVariants(supabase, item.product_id);
        const selectedVariant = availableVariants.find(
          (variant: any) => String(variant.id) === String(item.variant_id),
        ) ?? null;

        return {
          ...item,
          stock: item.product_variants?.stock ?? selectedVariant?.stock ?? null,
          selectedVariant,
          availableVariants,
          variants: availableVariants,
        };
      }),
    );

    return Response.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (err: any) {
    return Response.json(
      { error: "Server error", details: err?.message ?? "Unknown error" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
