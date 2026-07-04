import { createSupabaseServer } from "@/lib/supabase-server";

export type SupabaseServerClient = ReturnType<typeof createSupabaseServer>;

export type ProductColor = {
  id: string;
  product_id: string | null;
  color: string | null;
  color_hex: string | null;
  image?: string | null;
  mockup_front?: string | null;
  thumbnail?: string | null;
  position?: number | null;
};

export type ProductVariant = {
  id: string;
  size: string | null;
  stock: number | null;
  price: number | null;
  sku: string | null;
  name?: string | null;
  gelato_product_uid?: string | null;
  product_color_id: string | null;
};

export type UserProductBase = {
  base_product_id: string | null;
};

export type ResolvedVariant = {
  id: string;
  variant_id: string;
  size: string | null;
  stock: number | null;
  price: number | null;
  sku: string | null;
  name: string | null;
  gelato_product_uid: string | null;
  gelatoProductUid: string | null;
  product_uid: string | null;
  productUid: string | null;
  product_color_id: string | null;
  product_id: string | null;
  color: string | null;
  color_hex: string | null;
  colorHex: string | null;
  image: string | null;
};

type SupabaseSingleResponse<T> = {
  data: T | null;
  error: { message: string } | null;
};

type SupabaseManyResponse<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

function toNullableNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function resolveProductIds(
  supabase: SupabaseServerClient,
  productId: string,
): Promise<string[]> {
  const ids = [productId];

  const { data: userProduct } = (await supabase
    .from("user_products")
    .select("base_product_id")
    .eq("id", productId)
    .maybeSingle()) as SupabaseSingleResponse<UserProductBase>;

  if (userProduct?.base_product_id) ids.push(userProduct.base_product_id);

  return Array.from(new Set(ids.filter(Boolean)));
}

export function resolveVariantRow(
  variant: ProductVariant,
  color: ProductColor | null,
): ResolvedVariant {
  return {
    id: variant.id,
    variant_id: variant.id,
    size: variant.size ?? null,
    stock: toNullableNumber(variant.stock),
    price: toNullableNumber(variant.price),
    sku: variant.sku ?? null,
    name: variant.name ?? null,
    gelato_product_uid: variant.gelato_product_uid ?? null,
    gelatoProductUid: variant.gelato_product_uid ?? null,
    product_uid: variant.gelato_product_uid ?? null,
    productUid: variant.gelato_product_uid ?? null,
    product_color_id: variant.product_color_id ?? null,
    product_id: color?.product_id ?? null,
    color: color?.color ?? null,
    color_hex: color?.color_hex ?? null,
    colorHex: color?.color_hex ?? null,
    image: color?.image ?? color?.mockup_front ?? color?.thumbnail ?? null,
  };
}

export async function resolveVariantById(
  supabase: SupabaseServerClient,
  variantId: string,
): Promise<ResolvedVariant | null> {
  const { data: variant, error: variantError } = (await supabase
    .from("product_variants")
    .select("id, size, stock, price, sku, name, gelato_product_uid, product_color_id")
    .eq("id", variantId)
    .maybeSingle()) as SupabaseSingleResponse<ProductVariant>;

  if (variantError || !variant) return null;

  if (!variant.product_color_id) return resolveVariantRow(variant, null);

  const { data: color } = (await supabase
    .from("product_colors")
    .select("id, product_id, color, color_hex, mockup_front, thumbnail")
    .eq("id", variant.product_color_id)
    .maybeSingle()) as SupabaseSingleResponse<ProductColor>;

  return resolveVariantRow(variant, color);
}

export async function getAvailableVariants(
  supabase: SupabaseServerClient,
  productId: string,
): Promise<ResolvedVariant[]> {
  const productIds = await resolveProductIds(supabase, productId);

  const { data: colors, error: colorsError } = (await supabase
    .from("product_colors")
    .select("id, product_id, color, color_hex, mockup_front, thumbnail, position")
    .in("product_id", productIds)
    .order("position", { ascending: true })) as SupabaseManyResponse<ProductColor>;

  if (colorsError || !colors?.length) return [];

  const colorIds = colors.map((color) => color.id).filter(Boolean);

  if (!colorIds.length) return [];

  const { data: variants, error: variantsError } = (await supabase
    .from("product_variants")
    .select("id, size, stock, price, sku, name, gelato_product_uid, product_color_id")
    .in("product_color_id", colorIds)
    .order("size", { ascending: true })) as SupabaseManyResponse<ProductVariant>;

  if (variantsError || !variants?.length) return [];

  const colorMap = new Map<string, ProductColor>(colors.map((color) => [color.id, color]));

  return variants.map((variant) => resolveVariantRow(variant, colorMap.get(variant.product_color_id ?? "") ?? null));
}

export async function getFirstAvailableVariant(
  supabase: SupabaseServerClient,
  productId: string,
): Promise<ResolvedVariant | null> {
  const variants = await getAvailableVariants(supabase, productId);

  return variants.find((variant) => variant.stock === null || variant.stock > 0) ?? null;
}
