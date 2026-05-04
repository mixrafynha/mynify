import { supabase } from "@/lib/supabase";

export async function getProducts({
  limit,
  category,
  collection,
}: {
  limit: number;
  category?: string | null;
  collection?: string | null;
}) {
  let query = supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("position", { ascending: true })
    .limit(limit);

  if (category) query = query.eq("category", category);
  if (collection) query = query.eq("collection", collection);

  const { data: products, error } = await query;

  if (error || !products?.length) {
    return {
      data: [],
      meta: { limit, count: 0, hasMore: false },
    };
  }

  const productIds = products.map((p) => p.id);

  const { data: variants } = await supabase
    .from("product_variants")
    .select("*")
    .in("product_id", productIds);

  const safeVariants = variants ?? [];

  const formatted = products.map((product) => {
    const productVariants = safeVariants.filter(
      (v) => v.product_id === product.id
    );

    // 🔥 PREÇO CORRETO (menor preço das variantes)
    const variantPrices = productVariants
      .map((v) => v.price)
      .filter((p) => typeof p === "number");

    const price =
      variantPrices.length > 0
        ? Math.min(...variantPrices)
        : product.price;

    // 🎨 cores únicas
    const colorsMap = new Map();

    for (const v of productVariants) {
      if (!v.color) continue;

      if (!colorsMap.has(v.color)) {
        colorsMap.set(v.color, {
          color: v.color,
          color_hex: v.color_hex || "#ccc",
        });
      }
    }

    const colors = Array.from(colorsMap.values());

    return {
      ...product,

      price, // 🔥 corrigido

      variants: productVariants.map((v) => ({
        id: v.id,
        color: v.color,
        size: v.size,
        stock: v.stock,
        price: v.price,
        color_hex: v.color_hex,
        sku: v.sku,
        name: v.name,
      })),

      colors,

      defaultVariant:
        productVariants.find((v) => v.stock > 0) ||
        productVariants[0] ||
        null,
    };
  });

  return {
    data: formatted,
    meta: {
      limit,
      count: formatted.length,
      hasMore: formatted.length === limit,
    },
  };
}