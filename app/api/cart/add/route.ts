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

type ExistingCartItem = {
  id: string;
  quantity: number | null;
};

type UserProduct = {
  id: string;
  user_id: string;
  base_product_id: string | null;
  title: string | null;
  image: string | null;
  final_price: number | string | null;
  price: number | string | null;
  currency: string | null;
  design_data: Record<string, unknown> | null;
  mockups: Record<string, unknown> | null;
};

type AddCartBody = {
  productId?: unknown;
  product_id?: unknown;
  variantId?: unknown;
  variant_id?: unknown;
  userProductId?: unknown;
  user_product_id?: unknown;
  quantity?: unknown;
  currency?: unknown;
};

function parsePositiveQuantity(value: unknown): number {
  const quantity = Number(value ?? 1);
  return Number.isFinite(quantity) && quantity > 0
    ? Math.min(100, Math.max(1, Math.floor(quantity)))
    : 1;
}

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const parsed = String(value).trim();
  return parsed ? parsed : null;
}

function getProductPrice(product: Product): number {
  return Number(product.discount_price ?? product.price ?? 0);
}

function publicUrl(value: unknown): string | null {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim())
    ? value.trim()
    : null;
}

function getDesignImage(userProduct: UserProduct | null): string | null {
  if (!userProduct) return null;
  const mockups = userProduct.mockups;
  if (mockups && typeof mockups === "object") {
    const checkoutThumbnails =
      mockups.checkoutThumbnails && typeof mockups.checkoutThumbnails === "object"
        ? (mockups.checkoutThumbnails as Record<string, any>)
        : {};
    return (
      publicUrl(checkoutThumbnails.front?.url) ??
      publicUrl(mockups.checkout_thumbnail_front_url) ??
      publicUrl(mockups.front) ??
      publicUrl(mockups.checkout_thumbnail_url) ??
      publicUrl(mockups.image) ??
      publicUrl(userProduct.image)
    );
  }
  return publicUrl(userProduct.image);
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
    const userProductId = nullableString(
      body.userProductId ?? body.user_product_id,
    );
    const quantity = parsePositiveQuantity(body.quantity);
    const requestedCurrency = nullableString(body.currency)?.toUpperCase() ?? null;

    if (!productId) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select(
        "id, title, price, discount_price, currency, image, images, is_active, status",
      )
      .eq("id", productId)
      .eq("is_active", true)
      .eq("status", "active")
      .maybeSingle<Product>();

    if (productError || !product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    let userProduct: UserProduct | null = null;

    if (userProductId) {
      const { data, error } = await supabase
        .from("user_products")
        .select(
          "id, user_id, base_product_id, title, image, final_price, price, currency, design_data, mockups",
        )
        .eq("id", userProductId)
        .eq("user_id", user.id)
        .eq("base_product_id", product.id)
        .maybeSingle<UserProduct>();

      if (error || !data) {
        return Response.json(
          { error: "Saved design not found or does not belong to you" },
          { status: 403 },
        );
      }

      userProduct = data;
    }

    const selectedVariant = requestedVariantId
      ? await resolveVariantById(supabase, requestedVariantId)
      : await getFirstAvailableVariant(supabase, product.id);

    if (!selectedVariant?.id) {
      return Response.json(
        { error: "No available variant found" },
        { status: 400 },
      );
    }

    if (selectedVariant.stock !== null && quantity > selectedVariant.stock) {
      return Response.json(
        { error: "Not enough stock", stock: selectedVariant.stock },
        { status: 400 },
      );
    }

    const basePrice = getProductPrice(product);
    const officialPrice = Number(
      userProduct?.final_price ??
        userProduct?.price ??
        selectedVariant.price ??
        basePrice,
    );

    if (!Number.isFinite(officialPrice) || officialPrice <= 0) {
      return Response.json(
        { error: "Invalid product price" },
        { status: 400 },
      );
    }

    const image =
      getDesignImage(userProduct) ??
      selectedVariant.image ??
      product.image ??
      product.images?.[0] ??
      null;

    let existingQuery = supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .eq("variant_id", selectedVariant.id);

    existingQuery = userProductId
      ? existingQuery.eq("user_product_id", userProductId)
      : existingQuery.is("user_product_id", null);

    const { data: existingItem, error: existingError } =
      await existingQuery.maybeSingle<ExistingCartItem>();

    if (existingError) {
      return Response.json({ error: existingError.message }, { status: 500 });
    }

    const payload = {
      user_product_id: userProductId,
      variant_id: selectedVariant.id,
      title: userProduct?.title ?? product.title,
      // Display cache only. Secure checkout recalculates from products/variants.
      price: officialPrice,
      currency:
        userProduct?.currency?.toUpperCase() ??
        requestedCurrency ??
        product.currency?.toUpperCase() ??
        "EUR",
      image,
      color: selectedVariant.color,
      size: selectedVariant.size,
      sku: selectedVariant.sku,
    };

    if (existingItem) {
      const newQuantity = userProductId
        ? quantity
        : Number(existingItem.quantity ?? 0) + quantity;

      if (selectedVariant.stock !== null && newQuantity > selectedVariant.stock) {
        return Response.json(
          { error: "Not enough stock", stock: selectedVariant.stock },
          { status: 400 },
        );
      }

      const { data, error } = await supabase
        .from("cart_items")
        .update({ ...payload, quantity: newQuantity })
        .eq("id", existingItem.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ success: true, data, reused: true });
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

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, data, reused: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: "Server error", details: message },
      { status: 500 },
    );
  }
}
