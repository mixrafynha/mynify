import { supabase } from "@/lib/supabase";

type GetProductsParams = {
  limit: number;
  category?: string | null;
  collection?: string | null;
};

type ProductVariant = {
  id: string;
  product_id: string;
  color?: string | null;
  size?: string | null;
  stock?: number | null;
  price?: number | null;
  color_hex?: string | null;
  sku?: string | null;
  name?: string | null;
};

export async function getProducts({
  limit,
  category,
  collection,
}: GetProductsParams) {
  const safeLimit = Number.isFinite(limit)
    ? Math.min(Math.max(limit, 1), 50)
    : 12;

  let query = supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("position", { ascending: true })
    .limit(safeLimit);

  if (category?.trim()) {
    query = query.eq("category", category.trim());
  }

  if (collection?.trim()) {
    query = query.eq("collection", collection.trim());
  }

  const { data: products, error } = await query;

  if (error) {
    console.error("GET_PRODUCTS_QUERY_ERROR:", error);

    return {
      data: [],
      meta: {
        limit: safeLimit,
        count: 0,
        hasMore: false,
      },
    };
  }

  if (!products?.length) {
    return {
      data: [],
      meta: {
        limit: safeLimit,
        count: 0,
        hasMore: false,
      },
    };
  }

  const productIds = products.map((product) => product.id).filter(Boolean);

  const { data: variants, error: variantsError } = await supabase
    .from("product_variants")
    .select(
      "id, product_id, color, size, stock, price, color_hex, sku, name"
    )
    .in("product_id", productIds);

  if (variantsError) {
    console.error("GET_PRODUCT_VARIANTS_QUERY_ERROR:", variantsError);
  }

  const variantsByProduct = new Map<string, ProductVariant[]>();

  for (const variant of (variants ?? []) as ProductVariant[]) {
    if (!variant.product_id) continue;

    const existing = variantsByProduct.get(variant.product_id) ?? [];
    existing.push(variant);
    variantsByProduct.set(variant.product_id, existing);
  }

  const formatted = products.map((product) => {
    const productVariants = variantsByProduct.get(product.id) ?? [];

    const variantPrices = productVariants
      .map((variant) => variant.price)
      .filter(
        (price): price is number =>
          typeof price === "number" && Number.isFinite(price)
      );

    const price =
      variantPrices.length > 0 ? Math.min(...variantPrices) : product.price;

    const colorsMap = new Map<
      string,
      {
        color: string;
        color_hex: string;
      }
    >();

    for (const variant of productVariants) {
      const color = variant.color?.trim();

      if (!color) continue;

      if (!colorsMap.has(color)) {
        colorsMap.set(color, {
          color,
          color_hex: variant.color_hex || "#ccc",
        });
      }
    }

    return {
      ...product,
      price,
      variants: productVariants.map((variant) => ({
        id: variant.id,
        color: variant.color,
        size: variant.size,
        stock: variant.stock,
        price: variant.price,
        color_hex: variant.color_hex,
        sku: variant.sku,
        name: variant.name,
      })),
      colors: Array.from(colorsMap.values()),
      defaultVariant:
        productVariants.find((variant) => Number(variant.stock) > 0) ||
        productVariants[0] ||
        null,
    };
  });

  return {
    data: formatted,
    meta: {
      limit: safeLimit,
      count: formatted.length,
      hasMore: formatted.length === safeLimit,
    },
  };
}
