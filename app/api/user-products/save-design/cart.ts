import type { createSupabaseServer } from "@/lib/supabase-server";

type SupabaseServer = ReturnType<typeof createSupabaseServer>;

type AddSavedDesignToCartArgs = {
  supabase: SupabaseServer;
  userId: string;
  userProduct: any;
  body: any;
};

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeQuantity(value: unknown) {
  return Math.max(1, Math.floor(asNumber(value, 1)));
}

function parseJsonIfString<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return (value ?? fallback) as T;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function isMissingColumnError(error: unknown) {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message || "")
      : String(error || "");

  return (
    message.includes("column") ||
    message.includes("schema cache") ||
    message.includes("Could not find")
  );
}

function valueOrNull(value: unknown) {
  return value === undefined || value === "" ? null : value;
}

export async function addSavedDesignToCart(args: AddSavedDesignToCartArgs) {
  const { supabase, userId, userProduct, body } = args;

  const designData = parseJsonIfString<any>(userProduct.design_data, {});
  const printFiles = parseJsonIfString<any>(userProduct.print_files, {});
  const mockups = parseJsonIfString<any>(userProduct.mockups, {});

  const quantity = normalizeQuantity(body.quantity);
  const selectedVariant =
    body.selectedVariant ||
    body.selected_variant ||
    designData?.selectedVariant ||
    null;
  const selectedColor =
    body.selectedColor ||
    body.selected_color ||
    designData?.selectedColor ||
    null;

  const variantId =
    body.variantId ||
    body.variant_id ||
    selectedVariant?.id ||
    null;

  const title = userProduct.title;
  const price = asNumber(userProduct.final_price ?? userProduct.price, 0);
  const currency = userProduct.currency || "USD";

  const mockupUrl =
    mockups?.checkout_thumbnail_url ||
    mockups?.checkoutThumbnailUrl ||
    mockups?.front ||
    mockups?.back ||
    userProduct.ai_mockup_url ||
    userProduct.image ||
    userProduct.design_image_url ||
    printFiles?.front ||
    printFiles?.back ||
    null;

  const color =
    body.color ||
    body.mockupColor ||
    selectedColor?.name ||
    selectedColor?.hex ||
    designData?.mockupColor ||
    designData?.color ||
    null;

  const size = body.size || selectedVariant?.size || selectedVariant?.name || null;
  const sku = body.sku || selectedVariant?.sku || null;

  const extendedPayload = {
    user_id: userId,
    product_id: userProduct.base_product_id,
    user_product_id: userProduct.id,
    design_id: userProduct.id,
    variant_id: valueOrNull(variantId),
    selected_color: selectedColor,
    selected_variant: selectedVariant,
    mockup_url: mockupUrl,
    title,
    price,
    currency,
    quantity,
    image: mockupUrl,
    color,
    size,
    sku,
    item_type: "custom_design",
  };

  const { data: extendedData, error: extendedError } = await supabase
    .from("cart_items")
    .insert(extendedPayload)
    .select()
    .single();

  if (!extendedError) {
    return { data: extendedData, error: null, mode: "extended" as const };
  }

  if (!isMissingColumnError(extendedError)) {
    return { data: null, error: extendedError, mode: "extended" as const };
  }

  const basicPayload = {
    user_id: userId,
    product_id: userProduct.base_product_id,
    variant_id: valueOrNull(variantId),
    title,
    price,
    currency,
    quantity,
    image: mockupUrl,
    color,
    size,
    sku,
  };

  const { data: basicData, error: basicError } = await supabase
    .from("cart_items")
    .insert(basicPayload)
    .select()
    .single();

  return {
    data: basicData,
    error: basicError,
    mode: "basic" as const,
  };
}
