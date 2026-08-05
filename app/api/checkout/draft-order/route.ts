import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getGelatoCheckoutQuote } from "@/lib/gelato/checkout-quote";
import { normalizeShippingMethods, type NormalizedShippingMethod } from "@/lib/gelato/shipping-methods";
import { resolveCountryCode } from "@/lib/gelato/country-code-map";
import { resolveGelatoPrintFiles } from "@/app/checkout/_lib/checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DraftShippingMethod = NormalizedShippingMethod;

type DraftBody = {
  cartItemIds?: string[];
  address?: {
    firstName?: string;
    lastName?: string;
    addressLine1?: string;
    addressLine2?: string | null;
    city?: string;
    state?: string | null;
    postalCode?: string;
    countryCode?: string;
    email?: string;
    phone?: string;
  };
  selectedShippingMethod?: DraftShippingMethod | null;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string | null;
    phone?: string | null;
    country?: string | null;
    countryIso?: string | null;
    address?: string | null;
    apartment?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    fullName?: string | null;
  };
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function jsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeAddress(body: DraftBody) {
  const customer = body.customer ?? {};
  const address = body.address ?? {};
  const fullName = cleanText(customer.fullName);
  const parts = fullName ? fullName.split(/\s+/).filter(Boolean) : [];
  const firstName = cleanText(customer.firstName) || cleanText(address.firstName) || parts.slice(0, -1).join(" ") || parts[0] || "Customer";
  const lastName = cleanText(customer.lastName) || cleanText(address.lastName) || parts.at(-1) || ".";
  const countryCode = (cleanText(customer.countryIso) || cleanText(customer.country) || cleanText(address.countryCode) || "").toUpperCase();

  return {
    firstName,
    lastName,
    addressLine1: cleanText(customer.address) || cleanText(address.addressLine1),
    addressLine2: cleanText(customer.apartment) || cleanText(address.addressLine2) || undefined,
    city: cleanText(customer.city) || cleanText(address.city),
    state: cleanText(customer.state) || cleanText(address.state) || undefined,
    postalCode: cleanText(customer.postalCode) || cleanText(address.postalCode),
    countryCode: resolveCountryCode(countryCode) ?? countryCode,
    email: cleanText(customer.email),
    phone: cleanText(customer.phone),
  };
}

function hashIdempotencyKey(input: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function normalizeShippingSelection(value: unknown): DraftShippingMethod | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = cleanText(record.id);
  const name = cleanText(record.name) || cleanText(record.title);
  if (!id || !name) return null;
  return {
    id,
    code: cleanText(record.code) || cleanText(record.serviceType) || null,
    name,
    price: Number(record.price ?? 0) || 0,
    currency: cleanText(record.currency).toUpperCase() || "EUR",
    minDays: record.minDays === null || record.minDays === undefined ? null : Number(record.minDays) || null,
    maxDays: record.maxDays === null || record.maxDays === undefined ? null : Number(record.maxDays) || null,
    raw: record.raw ?? record,
  };
}

export async function POST(req: Request) {
  const supabase = createSupabaseServer();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as DraftBody | null;
  const cartItemIds = Array.from(
    new Set(
      (body?.cartItemIds ?? [])
        .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
        .map((value) => value.trim()),
    ),
  );
  const shippingMethod = normalizeShippingSelection(body?.selectedShippingMethod);
  const shippingAddress = normalizeAddress(body ?? {});

  if (!cartItemIds.length) return NextResponse.json({ code: "MISSING_CART_ITEMS", message: "Missing cart items." }, { status: 400 });
  if (!shippingMethod?.id) return NextResponse.json({ code: "MISSING_SHIPPING_METHOD", message: "Please select a shipping method." }, { status: 400 });
  if (!shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.countryCode || !shippingAddress.email) {
    return NextResponse.json({ code: "INVALID_ADDRESS", message: "Shipping address is incomplete." }, { status: 400 });
  }

  const { data: cartRows, error: cartError } = await supabase
    .from("cart_items")
    .select("id, user_id, product_id, variant_id, user_product_id, design_id, title, quantity, currency, size, color, sku")
    .eq("user_id", authData.user.id)
    .in("id", cartItemIds);
  if (cartError) return NextResponse.json({ error: cartError.message }, { status: 500 });
  if ((cartRows ?? []).length !== cartItemIds.length) return NextResponse.json({ code: "CART_OWNERSHIP_INVALID", message: "One or more cart items do not belong to you." }, { status: 403 });

  const variantIds = Array.from(new Set((cartRows ?? []).map((row) => row.variant_id).filter((id): id is string => Boolean(id))));
  const productIds = Array.from(new Set((cartRows ?? []).map((row) => row.product_id)));
  const designIds = Array.from(new Set((cartRows ?? []).map((row) => row.design_id).filter((id): id is string => Boolean(id))));

  const [{ data: productRows }, { data: variantRows }, { data: userProductRows }] = await Promise.all([
    supabase.from("products").select("id, title, price, currency, profit_markup_percentage").in("id", productIds),
    variantIds.length ? supabase.from("product_variants").select("id, gelato_product_uid, price, stock, size, sku").in("id", variantIds) : Promise.resolve({ data: [] as any[] }),
    designIds.length ? supabase.from("user_products").select("id, print_files, mockups, design_data, production").in("id", designIds) : Promise.resolve({ data: [] as any[] }),
  ]);

  const productMap = new Map((productRows ?? []).map((row) => [row.id, row]));
  const variantMap = new Map((variantRows ?? []).map((row) => [row.id, row]));
  const userProductMap = new Map((userProductRows ?? []).map((row) => [row.id, row]));

  const quoteItems = [];
  for (const cartItem of cartRows ?? []) {
    const variant = cartItem.variant_id ? variantMap.get(cartItem.variant_id) ?? null : null;
    const product = productMap.get(cartItem.product_id);
    const userProduct = cartItem.design_id ? userProductMap.get(cartItem.design_id) ?? null : null;
    const productUid = variant?.gelato_product_uid ?? null;
    const printFiles = resolveGelatoPrintFiles({
      id: cartItem.id,
      print_files: userProduct?.print_files ?? null,
      printFiles: userProduct?.print_files ?? null,
      mockups: userProduct?.mockups ?? null,
      design_data: userProduct?.design_data ?? null,
      designData: userProduct?.design_data ?? null,
      production: userProduct?.production ?? null,
      product: { print_files: userProduct?.print_files ?? null, mockups: userProduct?.mockups ?? null, design_data: userProduct?.design_data ?? null, production: userProduct?.production ?? null },
    } as never);
    if (!product || !variant || !productUid) return NextResponse.json({ code: "PRODUCT_UNAVAILABLE", message: "Product unavailable." }, { status: 409 });
    if (!printFiles.length) {
      return NextResponse.json({
        code: "PRINT_FILES_NOT_READY",
        userProductId: cartItem.design_id,
        missingSides: ["front"],
      }, { status: 409 });
    }
    quoteItems.push({ productUid, quantity: Math.max(1, Number(cartItem.quantity) || 1), printFiles });
  }

  const quote = await getGelatoCheckoutQuote({
    productUid: quoteItems[0].productUid,
    quantity: quoteItems[0].quantity,
    shippingAddress: {
      ...shippingAddress,
      countryCode: shippingAddress.countryCode,
    },
    printFiles: quoteItems[0].printFiles,
    items: quoteItems,
    currencyIsoCode: "EUR",
    orderReferenceId: `draft-${authData.user.id}-${Date.now()}`,
    customerReferenceId: authData.user.email ?? authData.user.id,
  });

  if (!quote.available) {
    return NextResponse.json({ code: quote.retryable ? "GELATO_TEMPORARILY_UNAVAILABLE" : "SHIPPING_METHOD_EXPIRED", message: "The selected shipping method is no longer available.", shippingMethods: normalizeShippingMethods(quote.shippingOptions) }, { status: quote.retryable ? 503 : 409 });
  }

  const normalizedMethods = normalizeShippingMethods(quote.shippingOptions);
  const matchedMethod = normalizedMethods.find((method) => method.id === shippingMethod.id || method.code === shippingMethod.code);
  if (!matchedMethod) {
    return NextResponse.json({ code: "SHIPPING_METHOD_EXPIRED", message: "The selected shipping method is no longer available.", shippingMethods: normalizedMethods }, { status: 409 });
  }
  if (matchedMethod.price !== shippingMethod.price || matchedMethod.currency !== shippingMethod.currency) {
    return NextResponse.json({ code: "SHIPPING_METHOD_CHANGED", message: "The selected shipping method has changed.", shippingMethods: normalizedMethods }, { status: 409 });
  }

  const idempotencyKey = hashIdempotencyKey({
    userId: authData.user.id,
    cartItemIds: [...cartItemIds].sort(),
    address: shippingAddress,
    shippingMethod: shippingMethod.id,
  });

  const existing = await supabase
    .from("checkout_drafts")
    .select("id, gelato_draft_order_id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existing.data?.id && existing.data.gelato_draft_order_id) {
    return NextResponse.json({
      success: true,
      draftOrderId: existing.data.id,
      gelatoDraftOrderId: existing.data.gelato_draft_order_id,
      shippingMethod,
      subtotal: 0,
      shipping: matchedMethod.price,
      total: matchedMethod.price,
      currency: matchedMethod.currency,
    });
  }

  const gelatoPayload = {
    orderType: "draft" as const,
    orderReferenceId: idempotencyKey,
    customerReferenceId: authData.user.email ?? authData.user.id,
    currency: matchedMethod.currency,
    items: quoteItems.map((item, index) => ({
      itemReferenceId: cartItemIds[index] ?? `item-${index}`,
      productUid: item.productUid,
      files: item.printFiles,
      quantity: item.quantity,
    })),
    shipmentMethodUid: matchedMethod.code ?? matchedMethod.id,
    shippingAddress: {
      firstName: shippingAddress.firstName,
      lastName: shippingAddress.lastName,
      addressLine1: shippingAddress.addressLine1,
      addressLine2: shippingAddress.addressLine2,
      state: shippingAddress.state,
      city: shippingAddress.city,
      postCode: shippingAddress.postalCode,
      country: shippingAddress.countryCode,
      email: shippingAddress.email,
      phone: shippingAddress.phone ?? "",
    },
    metadata: [
      { key: "source", value: "ryfio_checkout" },
      { key: "shippingMethod", value: JSON.stringify(shippingMethod) },
      { key: "cartItemIds", value: cartItemIds.join(",") },
    ],
  };

  const gelatoResponse = await fetch(new URL("/api/gelato/draft-order", req.url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(gelatoPayload),
  });
  const gelatoResult = await gelatoResponse.json().catch(() => null);
  if (!gelatoResponse.ok || !gelatoResult?.ok) {
    return NextResponse.json({ code: "GELATO_DRAFT_FAILED", message: "Gelato draft order failed.", gelatoResult }, { status: 502 });
  }

  const draftRow = {
    user_id: authData.user.id,
    cart_item_ids: cartItemIds,
    idempotency_key: idempotencyKey,
    status: "draft",
    gelato_draft_order_id: String(gelatoResult.responsePayload?.id ?? gelatoResult.responsePayload?.orderId ?? ""),
    selected_shipping_method: jsonClone(shippingMethod),
    shipping_address: jsonClone(shippingAddress),
    subtotal: 0,
    shipping_amount: matchedMethod.price,
    total: matchedMethod.price,
    currency: matchedMethod.currency,
    gelato_response: gelatoResult.responsePayload ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data: insertedDraft, error: insertError } = await supabase
    .from("checkout_drafts")
    .upsert(draftRow, { onConflict: "idempotency_key" })
    .select("id, gelato_draft_order_id")
    .single();
  if (insertError || !insertedDraft) return NextResponse.json({ error: insertError?.message || "Failed to save draft order." }, { status: 500 });

  return NextResponse.json({
    success: true,
    draftOrderId: insertedDraft.id,
    gelatoDraftOrderId: insertedDraft.gelato_draft_order_id,
    shippingMethod,
    subtotal: 0,
    shipping: matchedMethod.price,
    total: matchedMethod.price,
    currency: matchedMethod.currency,
  });
}
