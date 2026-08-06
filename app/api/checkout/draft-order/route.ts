import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getGelatoCheckoutQuote } from "@/lib/gelato/checkout-quote";
import { normalizeShippingMethods, type NormalizedShippingMethod } from "@/lib/gelato/shipping-methods";
import { resolveCountryCode } from "@/lib/gelato/country-code-map";
import { resolveGelatoPrintFiles, type CartItem, type CartVariant } from "@/app/checkout/_lib/checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DraftBody = {
  cartItemIds?: string[];
  address?: {
    fullName?: string;
    email?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    countryCode?: string;
  };
  shippingMethod?: {
    id: string;
    code?: string | null;
    name: string;
    price: number;
    currency: string;
  };
};

type CartRow = {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string | null;
  user_product_id: string | null;
  design_id: string | null;
  quantity: number | null;
  selected_variant: Record<string, unknown> | null;
  title: string;
};

type ProductRow = {
  id: string;
  gelato_product_uid: string | null;
};

type VariantRow = {
  id: string;
  sku: string | null;
  size: string | null;
  product_color_id: string | null;
  gelato_product_uid: string | null;
  name?: string | null;
};

type UserProductRow = {
  id: string;
  variant_id: string | null;
  gelato_product_uid: string | null;
  design_data: Record<string, unknown> | null;
  print_files: Record<string, unknown> | null;
  production: Record<string, unknown> | null;
};

type GelatoFile = { type: string; url: string };

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeId(value: string) {
  return value.trim().toLowerCase();
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] || "Customer", lastName: "." };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.at(-1) || "." };
}

function normalizeAddress(body: DraftBody) {
  const address = body.address ?? {};
  const fullName = cleanText(address.fullName);
  const split = fullName ? splitFullName(fullName) : { firstName: "Customer", lastName: "." };
  const countryCode = (cleanText(address.countryCode) || "").toUpperCase();
  return {
    firstName: split.firstName,
    lastName: split.lastName,
    email: cleanText(address.email),
    phone: cleanText(address.phone),
    addressLine1: cleanText(address.addressLine1),
    addressLine2: cleanText(address.addressLine2) || undefined,
    city: cleanText(address.city),
    state: cleanText(address.state) || undefined,
    postalCode: cleanText(address.postalCode),
    countryCode: resolveCountryCode(countryCode) ?? countryCode,
  };
}

function hashIdempotencyKey(input: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function extractBoolean(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function resolveVariantId(row: CartRow, userProduct: UserProductRow | null) {
  const selectedVariant = row.selected_variant && typeof row.selected_variant === "object" ? row.selected_variant : null;
  const designRecord =
    userProduct?.design_data && typeof userProduct.design_data === "object"
      ? (userProduct.design_data as Record<string, unknown>)
      : null;
  const selectedVariantRecord =
    designRecord && typeof designRecord["selectedVariant"] === "object"
      ? (designRecord["selectedVariant"] as Record<string, unknown>)
      : null;
  return firstString(
    row.variant_id,
    selectedVariant?.id,
    userProduct?.variant_id,
    designRecord ? designRecord["variantId"] : null,
    selectedVariantRecord ? selectedVariantRecord["id"] : null,
    selectedVariant ? (selectedVariant.sku as string) : null,
  );
}

function resolveProductUid(variant: VariantRow | null, row: CartRow, userProduct: UserProductRow | null, product: ProductRow | null | undefined) {
  const selectedVariant = row.selected_variant && typeof row.selected_variant === "object" ? row.selected_variant : null;
  const designData = userProduct?.design_data && typeof userProduct.design_data === "object" ? userProduct.design_data : null;
  return firstString(
    variant?.gelato_product_uid,
    selectedVariant?.gelato_product_uid,
    selectedVariant?.gelatoProductUid,
    userProduct?.gelato_product_uid,
    designData ? (designData.gelatoProductUid as string) : null,
    designData ? (designData.gelato_product_uid as string) : null,
    product?.gelato_product_uid,
  );
}

function collectFiles(value: unknown): GelatoFile[] {
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const files: GelatoFile[] = [];
  const push = (type: string, url: unknown) => {
    if (typeof url !== "string" || !/^https?:\/\//i.test(url.trim())) return;
    const normalizedType = type.trim().toLowerCase() === "front" ? "default" : type.trim().toLowerCase();
    if (!files.some((entry) => entry.type === normalizedType && entry.url === url.trim())) {
      files.push({ type: normalizedType, url: url.trim() });
    }
  };
  if (Array.isArray(record.files)) {
    for (const entry of record.files) {
      if (!entry || typeof entry !== "object") continue;
      const item = entry as Record<string, unknown>;
      push(String(item.type ?? item.side ?? "default"), item.url ?? item.fileUrl ?? item.printFileUrl ?? item.print_file_url);
    }
  }
  if (record.front) push("front", record.front);
  if (record.back) push("back", record.back);
  if (record.print_files && typeof record.print_files === "object") {
    const pf = record.print_files as Record<string, unknown>;
    push("front", pf.front);
    push("back", pf.back);
  }
  return files;
}

function determineRequiredSides(userProduct: UserProductRow | null) {
  const designData = userProduct?.design_data;
  const frontHasDesign = Boolean(designData && typeof designData === "object" && extractBoolean((designData as Record<string, unknown>).frontHasDesign));
  const backHasDesign = Boolean(designData && typeof designData === "object" && extractBoolean((designData as Record<string, unknown>).backHasDesign));
  return { frontHasDesign, backHasDesign };
}

function log(event: string, data?: Record<string, unknown>) {
  console.info(event, data ?? {});
}

function gelatoRequestPayload(input: {
  idempotencyKey: string;
  currency: string;
  shippingMethod: NormalizedShippingMethod;
  address: ReturnType<typeof normalizeAddress>;
  items: Array<{ cartItemId: string; userProductId: string | null; productUid: string; quantity: number; files: GelatoFile[] }>;
  email: string;
}) {
  return {
    orderType: "draft" as const,
    orderReferenceId: input.idempotencyKey,
    customerReferenceId: input.email,
    currency: input.currency,
    shipmentMethodUid: input.shippingMethod.code ?? input.shippingMethod.id,
    shippingAddress: {
      firstName: input.address.firstName,
      lastName: input.address.lastName,
      addressLine1: input.address.addressLine1,
      addressLine2: input.address.addressLine2,
      city: input.address.city,
      state: input.address.state,
      postCode: input.address.postalCode,
      country: input.address.countryCode,
      email: input.address.email,
      phone: input.address.phone ?? "",
    },
    items: input.items.map((item) => ({
      itemReferenceId: item.cartItemId,
      productUid: item.productUid,
      quantity: item.quantity,
      files: item.files,
      metadata: [
        { key: "cartItemId", value: item.cartItemId },
        { key: "userProductId", value: item.userProductId ?? "" },
      ].filter((entry) => entry.value),
    })),
    metadata: [
      { key: "source", value: "ryfio_checkout" },
      { key: "shippingMethodId", value: input.shippingMethod.id },
      { key: "shippingMethodCode", value: input.shippingMethod.code ?? "" },
    ].filter((entry) => entry.value),
  };
}

export async function POST(req: Request) {
  const supabase = createSupabaseServer();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as DraftBody | null;
  const cartItemIds = Array.from(new Set((body?.cartItemIds ?? []).filter(isUuid)));
  const shippingMethodInput = body?.shippingMethod ?? null;
  const address = normalizeAddress(body ?? {});

  if (!cartItemIds.length) return NextResponse.json({ code: "MISSING_CART_ITEMS", success: false }, { status: 400 });
  if (!shippingMethodInput?.id || !shippingMethodInput.name || !shippingMethodInput.currency) {
    return NextResponse.json({ code: "MISSING_SHIPPING_METHOD", success: false }, { status: 400 });
  }
  if (!address.firstName || !address.lastName || !address.email || !address.addressLine1 || !address.city || !address.postalCode || !address.countryCode) {
    return NextResponse.json({ code: "ADDRESS_INVALID", success: false }, { status: 400 });
  }

  log("[checkout:draft-request]", { cartItemCount: cartItemIds.length });

  const { data: cartRows, error: cartError } = await supabase
    .from("cart_items")
    .select("id, user_id, product_id, variant_id, user_product_id, design_id, quantity, selected_variant, title")
    .eq("user_id", authData.user.id)
    .in("id", cartItemIds);
  if (cartError) return NextResponse.json({ error: cartError.message }, { status: 500 });
  if ((cartRows ?? []).length !== cartItemIds.length) return NextResponse.json({ error: "CART_OWNERSHIP_INVALID" }, { status: 403 });

  const designIds = Array.from(new Set((cartRows ?? []).map((row) => row.design_id).filter((value): value is string => Boolean(value))));
  const productIds = Array.from(new Set((cartRows ?? []).map((row) => row.product_id)));
  const variantHints = Array.from(new Set((cartRows ?? []).map((row) => row.variant_id).filter((value): value is string => Boolean(value))));

  const [{ data: productRows }, { data: variantRows }, { data: userProductRows }] = await Promise.all([
    supabase.from("products").select("id, gelato_product_uid").in("id", productIds),
    supabase.from("product_variants").select("id, sku, size, product_color_id, gelato_product_uid, name").in("id", variantHints),
    designIds.length
      ? supabase.from("user_products").select("id, variant_id, gelato_product_uid, design_data, print_files, production").in("id", designIds)
      : Promise.resolve({ data: [] as UserProductRow[] }),
  ]);

  const productMap = new Map((productRows ?? []).map((row) => [(row as ProductRow).id, row as ProductRow]));
  const variantMap = new Map((variantRows ?? []).map((row) => [(row as VariantRow).id, row as VariantRow]));
  const userProductMap = new Map((userProductRows ?? []).map((row) => [(row as UserProductRow).id, row as UserProductRow]));

  const resolvedItems: Array<{ cartItemId: string; userProductId: string | null; productUid: string; quantity: number; files: GelatoFile[] }> = [];
  let subtotal = 0;
  let currency = shippingMethodInput.currency.toUpperCase();

  for (const cartRow of cartRows ?? []) {
    const userProduct = cartRow.design_id ? userProductMap.get(cartRow.design_id) ?? null : null;
    const variantId = resolveVariantId(cartRow as CartRow, userProduct);
    const fallbackVariant = cartRow.variant_id ? variantMap.get(cartRow.variant_id) : undefined;
    const variant = variantId ? variantMap.get(variantId) ?? fallbackVariant ?? null : fallbackVariant ?? null;
    if (!variantId || !variant) {
      return NextResponse.json({ success: false, code: "MISSING_VARIANT", cartItemId: cartRow.id }, { status: 409 });
    }

    const product = productMap.get(cartRow.product_id) ?? null;
    const productUid = resolveProductUid(variant, cartRow as CartRow, userProduct, product);
    if (!productUid) {
      return NextResponse.json({ success: false, code: "MISSING_PRODUCT_UID", cartItemId: cartRow.id }, { status: 409 });
    }

    const printFiles = userProduct ? resolveGelatoPrintFiles({
      id: cartRow.id,
      user_product_id: userProduct.id,
      design_data: userProduct.design_data,
      designData: userProduct.design_data,
      print_files: userProduct.print_files,
      printFiles: userProduct.print_files,
      production: userProduct.production,
      product: { print_files: userProduct.print_files, design_data: userProduct.design_data, production: userProduct.production },
    } as unknown as CartItem) : [];

    const { frontHasDesign, backHasDesign } = determineRequiredSides(userProduct);
    const missingSides: string[] = [];
    if (frontHasDesign && !printFiles.some((file) => file.type === "default" || file.type === "front")) missingSides.push("front");
    if (backHasDesign && !printFiles.some((file) => file.type === "back")) missingSides.push("back");
    if (missingSides.length) {
      return NextResponse.json({ success: false, code: "PRINT_FILES_NOT_READY", userProductId: userProduct?.id ?? null, missingSides }, { status: 409 });
    }

    const quantity = Math.max(1, Number(cartRow.quantity) || 1);
    resolvedItems.push({ cartItemId: cartRow.id, userProductId: userProduct?.id ?? cartRow.design_id ?? null, productUid, quantity, files: printFiles.filter((file) => file.type === "default" || file.type === "back") });
    subtotal += 0;
  }

  const quote = await getGelatoCheckoutQuote({
    productUid: resolvedItems[0].productUid,
    quantity: resolvedItems[0].quantity,
    shippingAddress: {
      ...address,
      countryCode: address.countryCode,
    },
    printFiles: resolvedItems[0].files,
    items: resolvedItems.map((item) => ({ productUid: item.productUid, quantity: item.quantity, printFiles: item.files })),
    currencyIsoCode: currency,
    orderReferenceId: `draft-${authData.user.id}-${cartItemIds.slice().sort().join("-")}`,
    customerReferenceId: authData.user.email ?? authData.user.id,
  });

  if (!quote.available) {
    return NextResponse.json({ success: false, code: "SHIPPING_METHOD_EXPIRED", shippingMethods: normalizeShippingMethods(quote.shippingOptions) }, { status: 409 });
  }

  const shippingMethods = normalizeShippingMethods(quote.shippingOptions);
  const matched = shippingMethods.find((method) => method.id === shippingMethodInput.id || method.code === shippingMethodInput.code);
  if (!matched) {
    return NextResponse.json({ success: false, code: "SHIPPING_METHOD_EXPIRED", shippingMethods }, { status: 409 });
  }
  if (matched.price !== shippingMethodInput.price || matched.currency !== shippingMethodInput.currency.toUpperCase()) {
    return NextResponse.json({ success: false, code: "SHIPPING_METHOD_CHANGED", shippingMethods }, { status: 409 });
  }

  const idempotencyKey = hashIdempotencyKey({
    userId: authData.user.id,
    cartItemIds: [...cartItemIds].sort(),
    postalCode: address.postalCode,
    countryCode: address.countryCode,
    shippingMethodId: shippingMethodInput.id,
  });

  const { data: existingDraft } = await supabase
    .from("checkout_drafts")
    .select("id, gelato_draft_order_id, shipping_method, subtotal, shipping_amount, total, currency")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existingDraft?.gelato_draft_order_id) {
    return NextResponse.json({
      success: true,
      draftOrderId: existingDraft.id,
      gelatoDraftOrderId: existingDraft.gelato_draft_order_id,
      shippingMethod: shippingMethodInput,
      subtotal: existingDraft.subtotal ?? 0,
      shipping: existingDraft.shipping_amount ?? matched.price,
      total: existingDraft.total ?? matched.price,
      currency: existingDraft.currency ?? matched.currency,
    });
  }

  const gelatoPayload = gelatoRequestPayload({
    idempotencyKey,
    currency,
    shippingMethod: matched,
    address,
    items: resolvedItems,
    email: authData.user.email ?? authData.user.id,
  });

  log("[checkout:variant-resolution]", { itemCount: resolvedItems.length });
  log("[checkout:shipping-validation]", { shippingMethodId: matched.id, shippingMethodCode: matched.code ?? null });

  const gelatoApiKey = process.env.GELATO_API_KEY?.trim();
  if (!gelatoApiKey) return NextResponse.json({ success: false, code: "GELATO_DRAFT_FAILED" }, { status: 500 });

  const gelatoResponse = await fetch(new URL("/v4/orders", process.env.GELATO_API_BASE_URL?.trim() || "https://order.gelatoapis.com"), {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": gelatoApiKey },
    body: JSON.stringify(gelatoPayload),
    cache: "no-store",
  });

  const gelatoResult = await gelatoResponse.json().catch(() => null);
  if (!gelatoResponse.ok) {
    log("[checkout:draft-failed]", { status: gelatoResponse.status });
    return NextResponse.json({ success: false, code: "GELATO_DRAFT_FAILED" }, { status: 502 });
  }

  const gelatoDraftOrderId = String(gelatoResult?.id ?? gelatoResult?.orderId ?? gelatoResult?.draftOrderId ?? "");
  const draftRow = {
    user_id: authData.user.id,
    cart_item_ids: cartItemIds,
    idempotency_key: idempotencyKey,
    status: "draft",
    gelato_draft_order_id: gelatoDraftOrderId,
    selected_shipping_method: {
      id: matched.id,
      code: matched.code,
      name: matched.name,
      price: matched.price,
      currency: matched.currency,
    },
    shipping_address: address,
    subtotal,
    shipping_amount: matched.price,
    total: subtotal + matched.price,
    currency: matched.currency,
    gelato_response: {
      id: gelatoDraftOrderId,
      status: gelatoResponse.status,
    },
    updated_at: new Date().toISOString(),
  };

  const { data: savedDraft, error: saveError } = await supabase
    .from("checkout_drafts")
    .upsert(draftRow, { onConflict: "idempotency_key" })
    .select("id, gelato_draft_order_id")
    .single();

  if (saveError || !savedDraft) return NextResponse.json({ success: false, code: "GELATO_DRAFT_FAILED" }, { status: 500 });

  log("[checkout:draft-created]", { draftOrderId: savedDraft.id });

  return NextResponse.json({
    success: true,
    draftOrderId: savedDraft.id,
    gelatoDraftOrderId,
    shippingMethod: {
      id: matched.id,
      code: matched.code,
      name: matched.name,
      price: matched.price,
      currency: matched.currency,
    },
    subtotal,
    shipping: matched.price,
    total: subtotal + matched.price,
    currency: matched.currency,
  });
}
