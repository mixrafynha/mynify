import { createSupabaseServer } from "@/lib/supabase-server";
import { getFirstAvailableVariant, resolveVariantById } from "../_variant";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Product = {
  id: string;
  title: string;
  price: number | string | null;
  discount_price: number | string | null;
  currency: string | null;
  image: string | null;
  images: string[] | null;
  is_active: boolean | null;
  status: string | null;
};

type CartItem = {
  id: string;
  quantity: number | null;
};

type SupabaseSingleResponse<T> = {
  data: T | null;
  error: { message: string } | null;
};

type AddCartBody = {
  productId?: unknown;
  product_id?: unknown;
  variantId?: unknown;
  variant_id?: unknown;
  quantity?: unknown;
};

function parsePositiveQuantity(value: unknown): number {
  const quantity = Number(value ?? 1);
  return Number.isFinite(quantity) && quantity > 0 ? Math.max(1, Math.floor(quantity)) : 1;
}

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const parsed = String(value).trim();
  return parsed ? parsed : null;
}

function getProductPrice(product: Product): number {
  return Number(product.discount_price ?? product.price ?? 0);
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

    const body = (await req.json()) as AddCartBody;
    const productId = nullableString(body.productId ?? body.product_id);
    const requestedVariantId = nullableString(body.variantId ?? body.variant_id);
    const quantity = parsePositiveQuantity(body.quantity);

    if (!productId) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { data: product, error: productError } = (await supabase
      .from("products")
      .select("id, title, price, discount_price, currency, image, images, is_active, status")
      .eq("id", productId)
      .eq("is_active", true)
      .eq("status", "active")
      .maybeSingle()) as SupabaseSingleResponse<Product>;

    if (productError || !product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const selectedVariant = requestedVariantId
      ? await resolveVariantById(supabase, requestedVariantId)
      : await getFirstAvailableVariant(supabase, product.id);

    if (!selectedVariant?.id) {
      return Response.json({ error: "No available variant found" }, { status: 400 });
    }

    if (selectedVariant.stock !== null && quantity > selectedVariant.stock) {
      return Response.json({ error: "Not enough stock", stock: selectedVariant.stock }, { status: 400 });
    }

    const basePrice = getProductPrice(product);
    const finalPrice = Number(selectedVariant.price ?? basePrice);

    if (!Number.isFinite(finalPrice) || finalPrice <= 0) {
      return Response.json({ error: "Invalid product price" }, { status: 400 });
    }

    const image = selectedVariant.image ?? product.image ?? product.images?.[0] ?? null;

    const { data: existingItem, error: existingError } = (await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .eq("variant_id", selectedVariant.id)
      .maybeSingle()) as SupabaseSingleResponse<CartItem>;

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

      if (selectedVariant.stock !== null && newQuantity > selectedVariant.stock) {
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: "Server error", details: message }, { status: 500 });
  }
}
