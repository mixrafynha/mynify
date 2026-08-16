import { createSupabaseServer } from "@/lib/supabase-server";
import { hasVisiblePrintElements, resolveSecondPrintCharge } from "@/lib/gelato/second-print-price";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CartVariantRelation = {
  id: string;
  stock: number | null;
  size: string | null;
  price: number | string | null;
  sku: string | null;
  product_color_id: string | null;
  gelato_product_uid: string | null;
  color?: string | null;
  color_hex?: string | null;
  color_visual?: Record<string, unknown> | null;
  product_id?: string | null;
  image?: string | null;
};

type CartItem = {
  id: string;
  product_id: string;
  user_product_id: string | null;
  design_id: string | null;
  variant_id: string | null;
  title: string | null;
  price: number | string | null;
  currency: string | null;
  quantity: number | null;
  color: string | null;
  selected_color_visual?: Record<string, unknown> | null;
  size: string | null;
  sku: string | null;
  image: string | null;
  previewFront?: string | null;
  previewBack?: string | null;
  created_at: string | null;
  product_variants?: CartVariantRelation | CartVariantRelation[] | null;
};

type UserProductAssets = {
  user_product_id: string | null;
  base_product_id: string | null;
  mockups: Record<string, unknown> | null;
  design_data: Record<string, unknown> | null;
  designData: Record<string, unknown> | null;
};

type ProductColorRow = {
  id: string;
  product_id: string | null;
  color: string | null;
  color_hex: string | null;
  gelato_attributes: Record<string, unknown> | null;
  gelato_color_data: Record<string, unknown> | null;
  mockup_front: string | null;
  thumbnail: string | null;
  position: number | null;
};

type ProductVariantRow = {
  id: string;
  size: string | null;
  stock: number | null;
  price: number | string | null;
  sku: string | null;
  name: string | null;
  gelato_product_uid: string | null;
  product_color_id: string | null;
};

type SupabaseManyResponse<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

function publicString(value: unknown): string | null {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim()) ? value.trim() : null;
}

function realCanvasFrontMockup(mockups: Record<string, unknown> | null): string | null {
  if (!mockups) return null;

  const front = publicString(mockups.front);

  if (!front) return null;
  return front;
}

function realCanvasBackMockup(mockups: Record<string, unknown> | null): string | null {
  if (!mockups) return null;

  const back = publicString(mockups.back);

  if (!back) return null;
  return back;
}

function parseMockups(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }

  return typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function resolveDisplayPrice(args: {
  itemPrice: number | string | null;
  variantPrice: number | string | null | undefined;
  userProductAssets: UserProductAssets;
}) {
  const currentVariantPrice =
    args.variantPrice === null || args.variantPrice === undefined
      ? null
      : Number(args.variantPrice);

  if (!Number.isFinite(currentVariantPrice) || currentVariantPrice === null || currentVariantPrice <= 0) {
    return args.itemPrice;
  }

  const designData = asRecord(args.userProductAssets.design_data);
  const sides = asRecord(designData?.sides);
  const front = asRecord(sides?.front);
  const back = asRecord(sides?.back);
  const secondPrintCharge = resolveSecondPrintCharge({
    hasFrontDesign: hasVisiblePrintElements(front?.elements),
    hasBackDesign: hasVisiblePrintElements(back?.elements),
  });

  return currentVariantPrice + secondPrintCharge;
}

function frontMockupUrl(mockups: Record<string, unknown> | null): string | null {
  if (!mockups) return null;
  const selected =
    realCanvasFrontMockup(mockups) ??
    publicString(mockups.checkout_thumbnail_url) ??
    publicString(mockups.checkout_thumbnail_front_url) ??
    publicString(mockups.image) ??
    publicString(mockups.mockup_front);
  return selected;
}

function backMockupUrl(mockups: Record<string, unknown> | null): string | null {
  if (!mockups) return null;
  const selected =
    realCanvasBackMockup(mockups) ??
    publicString(mockups.checkout_thumbnail_back_url) ??
    publicString(mockups.checkout_thumbnail_back) ??
    null;
  return selected;
}

function buildResolvedVariantRow(
  variant: ProductVariantRow,
  color: ProductColorRow | null,
): CartVariantRelation {
  return {
    id: variant.id,
    stock: variant.stock,
    size: variant.size,
    price: variant.price,
    sku: variant.sku,
    product_color_id: variant.product_color_id,
    gelato_product_uid: variant.gelato_product_uid,
    color: color?.color ?? null,
    color_hex: color?.color_hex ?? null,
    color_visual: color
      ? {
          color: color.color,
          color_hex: color.color_hex,
          product_id: color.product_id,
        }
      : null,
    product_id: color?.product_id ?? null,
    image: color?.mockup_front ?? color?.thumbnail ?? null,
  };
}

function mergeProductIds(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export async function GET() {
  try {
    const requestStartedAt = Date.now();
    console.info("[cart-perf] request_started");

    const clientStartedAt = Date.now();
    const supabase = createSupabaseServer();
    console.info("[cart-perf] supabase_client_created durationMs=" + (Date.now() - clientStartedAt));

    console.info("[cart-perf] auth_start");
    const authStartedAt = Date.now();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    console.info("[cart-perf] auth_done durationMs=" + (Date.now() - authStartedAt));

    if (authError || !user) {
      console.info("[cart-perf] response_ready totalMs=" + (Date.now() - requestStartedAt));
      return Response.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    console.info("[cart-perf] cart_query_start");
    const cartQueryStartedAt = Date.now();
    const { data, error } = (await supabase
      .from("cart_items")
      .select("id, product_id, user_product_id, design_id, variant_id, title, price, currency, quantity, color, selected_color_visual, size, sku, image, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })) as SupabaseManyResponse<CartItem>;
    console.info(
      "[cart-perf] cart_query_done durationMs=" +
        (Date.now() - cartQueryStartedAt) +
        " rows=" +
        ((data ?? []).length ?? 0)
    );

    if (error) {
      console.info("[cart-perf] response_ready totalMs=" + (Date.now() - requestStartedAt));
      return Response.json({ error: error.message }, { status: 500, headers: { "Cache-Control": "no-store" } });
    }

    if (!(data ?? []).length) {
      console.info("[cart-perf] response_ready totalMs=" + (Date.now() - requestStartedAt));
      return Response.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    console.info("[cart-perf] item_resolution_start count=" + (data ?? []).length);
    const itemResolutionStartedAt = Date.now();
    const cartItems = data ?? [];
    const productIds = mergeProductIds(cartItems.map((item) => item.product_id));
    const userProductIds = mergeProductIds(cartItems.map((item) => item.user_product_id));

    const [userProductsResult, productColorsResult] = await Promise.all([
      userProductIds.length
        ? supabase.from("user_products").select("id, base_product_id, mockups, design_data").in("id", userProductIds)
        : Promise.resolve({ data: [] as { id: string; base_product_id: string | null; mockups: Record<string, unknown> | null; design_data: Record<string, unknown> | null; }[] | null, error: null }),
      productIds.length
        ? supabase
            .from("product_colors")
            .select("id, product_id, color, color_hex, gelato_attributes, gelato_color_data, mockup_front, thumbnail, position")
            .in("product_id", productIds)
            .order("position", { ascending: true })
        : Promise.resolve({ data: [] as ProductColorRow[] | null, error: null }),
    ]);

    if (userProductsResult.error || productColorsResult.error) {
      const message =
        userProductsResult.error?.message ??
        productColorsResult.error?.message ??
        "Failed to resolve cart references";
      console.warn("[cart] unresolved_reference_batch_error", { message });
      return Response.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const userProductAssetsById = new Map<string, UserProductAssets>();
    (userProductsResult.data ?? []).forEach((row) => {
      if (!row?.id) return;
      userProductAssetsById.set(row.id, {
        user_product_id: row.id,
        base_product_id: row.base_product_id,
        mockups: parseMockups(row.mockups),
        design_data: row.design_data,
        designData: row.design_data,
      });
    });

    const colorMap = new Map<string, ProductColorRow>();
    (productColorsResult.data ?? []).forEach((row) => {
      if (row?.id) colorMap.set(row.id, row);
    });

    const productColorIds = mergeProductIds((productColorsResult.data ?? []).map((row) => row.id));
    const variantsResult = productColorIds.length
      ? await supabase
          .from("product_variants")
          .select("id, size, stock, price, sku, name, gelato_product_uid, product_color_id")
          .in("product_color_id", productColorIds)
          .order("size", { ascending: true })
      : { data: [] as ProductVariantRow[] | null, error: null };

    if (variantsResult.error) {
      console.warn("[cart] unresolved_reference_batch_error", { message: variantsResult.error.message });
      return Response.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const variantsById = new Map<string, CartVariantRelation>();
    (variantsResult.data ?? []).forEach((row) => {
      if (!row?.id) return;
      variantsById.set(row.id, buildResolvedVariantRow(row, row.product_color_id ? colorMap.get(row.product_color_id) ?? null : null));
    });

    const variantsByProductId = new Map<string, CartVariantRelation[]>();
    for (const row of variantsResult.data ?? []) {
      if (!row?.product_color_id) continue;
      const color = colorMap.get(row.product_color_id);
      const productId = color?.product_id;
      if (!productId) continue;
      const variant = buildResolvedVariantRow(row, color);
      const existing = variantsByProductId.get(productId) ?? [];
      existing.push(variant);
      variantsByProductId.set(productId, existing);
    }

    const items = cartItems.map((item) => {
      const variantRelation = item.variant_id ? variantsById.get(item.variant_id) ?? null : null;
      const userProductAssets = item.user_product_id
        ? userProductAssetsById.get(item.user_product_id) ??
          ({
            user_product_id: null,
            base_product_id: null,
            mockups: null,
            design_data: null,
            designData: null,
          } as UserProductAssets)
        : ({
            user_product_id: null,
            base_product_id: null,
            mockups: null,
            design_data: null,
            designData: null,
          } as UserProductAssets);

      if (item.variant_id && !variantRelation) {
        console.warn("[cart] unresolved_reference", {
          cartItemId: item.id,
          productId: item.product_id,
          variantId: item.variant_id,
          userProductId: item.user_product_id,
        });
      }

      const selectedVariant = variantRelation;
      const previewFront = frontMockupUrl(userProductAssets.mockups);
      const previewBack = backMockupUrl(userProductAssets.mockups);
      const displayPrice = resolveDisplayPrice({
        itemPrice: item.price,
        variantPrice: variantRelation?.price ?? null,
        userProductAssets,
      });
      const availableVariants = variantsByProductId.get(item.product_id) ?? [];
      const gelatoProductUid = variantRelation?.gelato_product_uid ?? null;

      return {
        ...item,
        ...userProductAssets,
        price: displayPrice,
        cached_price: item.price,
        price_source: displayPrice === item.price ? "cart_items" : "product_variants",
        image: previewFront ?? item.image ?? variantRelation?.image ?? null,
        previewFront,
        previewBack,
        product_variants: variantRelation,
        selected_color_visual: item.selected_color_visual ?? null,
        product_uid: gelatoProductUid,
        productUid: gelatoProductUid,
        gelato_product_uid: gelatoProductUid,
        gelatoProductUid: gelatoProductUid,
        design_id: item.design_id,
        designId: item.design_id,
        userProductId: item.user_product_id,
        stock: variantRelation?.stock ?? null,
        selectedVariant,
        availableVariants,
        variants: availableVariants,
      };
    });
    console.info(
      "[cart-perf] item_resolution_done durationMs=" +
        (Date.now() - itemResolutionStartedAt) +
        " rows=" +
        items.length
    );

    console.info("[cart-perf] response_ready totalMs=" + (Date.now() - requestStartedAt));
    return Response.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: "Server error", details: message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
