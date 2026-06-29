import { createSupabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ResolvedVariant = {
  id: string;
  size: string | null;
  stock: number | null;
  price: number | null;
  sku: string | null;
  color: string | null;
  colorHex: string | null;
  image: string | null;
};

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

async function getVariantById(supabase: any, variantId: string): Promise<ResolvedVariant | null> {
  const { data: variant, error: variantError } = await supabase
    .from("product_variants")
    .select("id, size, stock, price, sku, product_color_id")
    .eq("id", variantId)
    .maybeSingle();

  if (variantError || !variant) return null;

  const { data: color } = await supabase
    .from("product_colors")
    .select("id, color, color_hex, image")
    .eq("id", variant.product_color_id)
    .maybeSingle();

  return {
    id: variant.id,
    size: variant.size ?? null,
    stock: variant.stock ?? null,
    price: variant.price === null || variant.price === undefined ? null : Number(variant.price),
    sku: variant.sku ?? null,
    color: color?.color ?? null,
    colorHex: color?.color_hex ?? null,
    image: color?.image ?? null,
  };
}

async function getDefaultVariant(supabase: any, productId: string): Promise<ResolvedVariant | null> {
  const productIds = await resolveProductIds(supabase, productId);

  const { data: colors, error: colorsError } = await supabase
    .from("product_colors")
    .select("id, color, color_hex, image, position")
    .in("product_id", productIds)
    .order("position", { ascending: true });

  if (colorsError || !colors?.length) return null;

  const colorIds = colors.map((item: any) => item.id).filter(Boolean);

  const { data: variants, error: variantsError } = await supabase
    .from("product_variants")
    .select("id, size, stock, price, sku, product_color_id")
    .in("product_color_id", colorIds)
    .gt("stock", 0)
    .order("size", { ascending: true });

  if (variantsError || !variants?.length) return null;

  const colorMap = new Map(colors.map((color: any) => [color.id, color]));
  const selected = variants[0];
  const color = colorMap.get(selected.product_color_id);

  return {
    id: selected.id,
    size: selected.size ?? null,
    stock: selected.stock ?? null,
    price: selected.price === null || selected.price === undefined ? null : Number(selected.price),
    sku: selected.sku ?? null,
    color: color?.color ?? null,
    colorHex: color?.color_hex ?? null,
    image: color?.image ?? null,
  };
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const productId = String(body.productId ?? body.product_id ?? "").trim();
    const requestedVariantId = body.variantId ?? body.variant_id ? String(body.variantId ?? body.variant_id) : null;
    const quantity = Math.max(1, Number(body.quantity ?? 1));

    if (!productId || !quantity) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, title, price, discount_price, currency, image, images, is_active, status")
      .eq("id", productId)
      .eq("is_active", true)
      .eq("status", "active")
      .maybeSingle();

    if (productError || !product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const selectedVariant = requestedVariantId
      ? await getVariantById(supabase, requestedVariantId)
      : await getDefaultVariant(supabase, product.id);

    if (!selectedVariant?.id) {
      return Response.json({ error: "No available variant found" }, { status: 400 });
    }

    if (selectedVariant.stock !== null && selectedVariant.stock !== undefined && quantity > Number(selectedVariant.stock)) {
      return Response.json({ error: "Not enough stock", stock: selectedVariant.stock }, { status: 400 });
    }

    const basePrice = Number(product.discount_price ?? product.price);
    const finalPrice = Number(selectedVariant.price ?? basePrice);

    if (!finalPrice || finalPrice <= 0) {
      return Response.json({ error: "Invalid product price" }, { status: 400 });
    }

    const image = selectedVariant.image ?? product.image ?? product.images?.[0] ?? null;

    const { data: existingItem, error: existingError } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .eq("variant_id", selectedVariant.id)
      .maybeSingle();

    if (existingError) {
      return Response.json({ error: existingError.message }, { status: 500 });
    }

    const payload = {
      variant_id: selectedVariant.id,
      title: product.title,
      price: finalPrice,
      currency: product.currency ?? "USD",
      image,
      color: selectedVariant.color,
      size: selectedVariant.size,
      sku: selectedVariant.sku,
    };

    if (existingItem) {
      const newQuantity = Number(existingItem.quantity ?? 0) + quantity;

      if (selectedVariant.stock !== null && selectedVariant.stock !== undefined && newQuantity > Number(selectedVariant.stock)) {
        return Response.json({ error: "Not enough stock", stock: selectedVariant.stock }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("cart_items")
        .update({ ...payload, quantity: newQuantity })
        .eq("id", existingItem.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ success: true, data });
    }

    const { data, error } = await supabase
      .from("cart_items")
      .insert({
        user_id: user.id,
        product_id: product.id,
        quantity,
        ...payload,
      })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true, data });
  } catch (err: any) {
    return Response.json({ error: "Server error", details: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
