import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { hasVisiblePrintElements, resolveSecondPrintCharge } from "@/lib/gelato/second-print-price";
import { createSupabaseServer } from "@/lib/supabase-server";
import { buildGelatoCheckoutQuotePayload, resolveCheckoutQuote } from "@/lib/gelato/checkout-quote";
import { isInvalidGelatoShippingMethodUid, normalizeShippingMethods } from "@/lib/gelato/shipping-methods";
import { resolveCountryCode } from "@/lib/gelato/country-code-map";
import { checkGelatoRegionalAvailability } from "@/lib/gelato/regional-availability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DraftBody = {
  cartItemIds?: string[];
  address?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
email?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    stateCode?: string;
    postalCode?: string;
    countryCode?: string;
  };
  shippingMethod?: {
    id: string;
    code?: string | null;
    shipmentMethodUid: string;
    carrierUid?: string | null;
    serviceType?: string | null;
    fulfillmentCountry?: string | null;
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
  price: number | string | null;
};

type VariantRow = {
  id: string;
  sku: string | null;
  size: string | null;
  product_color_id: string | null;
  gelato_product_uid: string | null;
  price: number | string | null;
  name?: string | null;
  gelato_attributes?: Record<string, unknown> | null;
};

type UserProductRow = {
  id: string;
  user_id: string | null;
  gelato_product_uid: string | null;
  price: number | string | null;
  markup: number | string | null;
  final_price: number | string | null;
  design_data: Record<string, unknown> | null;
  print_files: Record<string, unknown> | null;
  mockups: Record<string, unknown> | null;
};

type GelatoFile = { type: string; url: string };

type ResolvedCheckoutItem = {
  cartItemId: string;
  productId: string;
  variantId: string | null;
  gelatoProductUid: string;
  productUid: string;
  userProductId: string | null;
  quantity: number;
  size: string | null;
  color: string | null;
  gelatoColorKey: string | null;
  officialUnitPrice: number;
  hasFrontPrint: boolean;
  hasBackPrint: boolean;
  files: GelatoFile[];
  adjustProductUidByFileTypes?: boolean;
};

type CheckoutDraftClaimResult = {
  draftId: string;
  claimed: boolean;
  status: string;
  gelatoDraftOrderId: string | null;
};

const PROCESSING_CLAIM_TTL_MS = 60_000;
const WAIT_FOR_DRAFT_TIMEOUT_MS = 3_500;
const WAIT_FOR_DRAFT_POLL_MS = 200;


const conflict = (
  code: string,
  message: string,
  details?: Record<string, unknown>,
) => {
  console.error("[checkout:draft-conflict]", {
    code,
    message,
    ...(details ?? {}),
  });

  return NextResponse.json(
    {
      success: false,
      code,
      message,
      details: details ?? null,
    },
    { status: 409 },
  );
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { firstName: parts[0] || "", lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.at(-1) || "" };
}

function normalizeAddress(body: DraftBody) {
  const address = body.address ?? {};
  const fullName = cleanText(address.fullName);
  const split = splitFullName(fullName);
  const firstName = cleanText(address.firstName) || split.firstName;
  const lastName = cleanText(address.lastName) || split.lastName;
  const countryCode = (cleanText(address.countryCode) || "").toUpperCase();
  return {
    firstName,
    lastName,
    email: cleanText(address.email),
    phone: cleanText(address.phone),
    addressLine1: cleanText(address.addressLine1),
    addressLine2: cleanText(address.addressLine2) || undefined,
    city: cleanText(address.city),
    state: cleanText(address.stateCode) || cleanText(address.state) || undefined,
    stateCode: cleanText(address.stateCode) || undefined,
    postalCode: cleanText(address.postalCode),
    countryCode: resolveCountryCode(countryCode) ?? countryCode,
  };
}

function hashIdempotencyKey(input: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function buildIdempotencySnapshot(items: ResolvedCheckoutItem[]) {
  return items
    .map((item) => ({
      cartItemId: item.cartItemId,
      productId: item.productId,
      variantId: item.variantId,
      gelatoProductUid: item.gelatoProductUid,
      userProductId: item.userProductId,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      gelatoColorKey: item.gelatoColorKey,
      officialUnitPrice: item.officialUnitPrice,
      hasFrontPrint: item.hasFrontPrint,
      hasBackPrint: item.hasBackPrint,
    }))
    .sort((left, right) => left.cartItemId.localeCompare(right.cartItemId));
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
    designRecord ? designRecord["variantId"] : null,
    selectedVariantRecord ? selectedVariantRecord["id"] : null,
    selectedVariant ? (selectedVariant.sku as string) : null,
  );
}

function getCartSelectedVariant(row: CartRow) {
  return row.selected_variant && typeof row.selected_variant === "object" ? row.selected_variant : null;
}

function getCartColor(row: CartRow) {
  const selectedVariant = getCartSelectedVariant(row);
  return firstString(
    selectedVariant?.color,
    selectedVariant?.colorName,
    selectedVariant?.colorHex,
  );
}

function getSavedSelectedVariant(userProduct: UserProductRow | null) {
  const designRecord =
    userProduct?.design_data && typeof userProduct.design_data === "object"
      ? (userProduct.design_data as Record<string, unknown>)
      : null;
  return designRecord?.selectedVariant && typeof designRecord.selectedVariant === "object"
    ? (designRecord.selectedVariant as Record<string, unknown>)
    : null;
}

function resolveSavedVariantId(userProduct: UserProductRow | null) {
  const designRecord =
    userProduct?.design_data && typeof userProduct.design_data === "object"
      ? (userProduct.design_data as Record<string, unknown>)
      : null;
  const selectedVariant = getSavedSelectedVariant(userProduct);
  return firstString(
    designRecord ? designRecord.variantId : null,
    selectedVariant?.id,
    selectedVariant?.variantId,
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

function asUrl(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.url === "string" && record.url.trim()) return record.url.trim();
  if (typeof record.fileUrl === "string" && record.fileUrl.trim()) return record.fileUrl.trim();
  if (typeof record.printFileUrl === "string" && record.printFileUrl.trim()) return record.printFileUrl.trim();
  return null;
}

function buildProductionFiles(printFiles: Record<string, unknown> | null | undefined) {
  const record = printFiles && typeof printFiles === "object" ? printFiles : {};
  const seen = new Set<string>();
  const files: GelatoFile[] = [];
  const push = (type: "default" | "back", value: unknown) => {
    const url = asUrl(value);
    if (!url || url.includes("/mockups/") || seen.has(`${type}:${url}`) || seen.has(url)) return;
    seen.add(`${type}:${url}`);
    seen.add(url);
    files.push({ type, url });
  };

  push("default", record.front);
  push("default", record.default);
  push("default", record.front_url);
  push("back", record.back);
  push("back", record.back_url);

  return files;
}

function determineRequiredSides(userProduct: UserProductRow | null) {
  const designData = userProduct?.design_data && typeof userProduct.design_data === "object" ? (userProduct.design_data as Record<string, unknown>) : null;
  const frontElements = designData?.sides && typeof designData.sides === "object"
    ? (designData.sides as Record<string, unknown>).front && typeof (designData.sides as Record<string, unknown>).front === "object"
      ? ((designData.sides as Record<string, unknown>).front as Record<string, unknown>).elements
      : null
    : null;
  const backElements = designData?.sides && typeof designData.sides === "object"
    ? (designData.sides as Record<string, unknown>).back && typeof (designData.sides as Record<string, unknown>).back === "object"
      ? ((designData.sides as Record<string, unknown>).back as Record<string, unknown>).elements
      : null
    : null;
  const frontHasDesign = Array.isArray(frontElements) && frontElements.length > 0;
  const backHasDesign = Array.isArray(backElements) && backElements.length > 0;
  return { frontHasDesign, backHasDesign };
}

function log(event: string, data?: Record<string, unknown>) {
  console.info(event, data ?? {});
}

function elapsedSince(startedAt: number) {
  return Date.now() - startedAt;
}

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function describeUnknownError(error: unknown) {
  const record = error && typeof error === "object" ? (error as Record<string, unknown>) : null;
  return {
    type: typeof error,
    isError: error instanceof Error,
    name: error instanceof Error ? error.name : typeof record?.name === "string" ? record.name : null,
    message: error instanceof Error ? error.message : typeof record?.message === "string" ? record.message : String(error),
    code: typeof record?.code === "string" ? record.code : null,
    details: record?.details ?? null,
    hint: record?.hint ?? null,
    status: record?.status ?? null,
    statusCode: record?.statusCode ?? null,
    keys: record ? Object.keys(record) : [],
    json: safeJson(error),
    stack: error instanceof Error ? error.stack : null,
  };
}

function logOperationError(operation: string, startedAt: number, error: unknown) {
  console.error("[checkout:draft:operation-error]", {
    operation,
    durationMs: Date.now() - startedAt,
    error: describeUnknownError(error),
  });
}

function shippingUnavailable(details?: Record<string, unknown>) {
  return NextResponse.json(
    {
      success: false,
      code: "CHECKOUT_SHIPPING_UNAVAILABLE",
      message: "Gelato could not calculate a valid shipping method for the full order.",
      ...(details ? { details } : {}),
    },
    { status: 409 },
  );
}

function shippingMethodMatches(input: {
  requestedId: string | null;
  requestedShipmentMethodUid: string | null;
  requestedCarrierUid: string | null;
  requestedServiceType: string | null;
  requestedFulfillmentCountry: string | null;
  method: ReturnType<typeof normalizeShippingMethods>[number];
}) {
  const methodShipmentUid = cleanText(input.method.shipmentMethodUid);
  const methodCarrierUid = cleanText(input.method.carrierUid);
  const methodServiceType = cleanText(input.method.serviceType).toLowerCase();
  const methodFulfillmentCountry = cleanText(input.method.fulfillmentCountry).toUpperCase();

  if (input.requestedId && input.method.id === input.requestedId) return true;
  if (input.requestedShipmentMethodUid && methodShipmentUid === input.requestedShipmentMethodUid) return true;

  return Boolean(
    input.requestedCarrierUid &&
      input.requestedServiceType &&
      methodCarrierUid === input.requestedCarrierUid &&
      methodServiceType === input.requestedServiceType &&
      (!input.requestedFulfillmentCountry || methodFulfillmentCountry === input.requestedFulfillmentCountry),
  );
}

async function identifyDraftShippingIncompatibleItems(input: {
  resolvedItems: ResolvedCheckoutItem[];
  address: ReturnType<typeof normalizeAddress>;
  currency: string;
}) {
  const unavailableItems: Array<{
    cartItemId: string;
    variantId: string | null;
    productUid: string;
    color: string | null;
    size: string | null;
    reason: string;
  }> = [];

  await Promise.all(
    input.resolvedItems.map(async (item) => {
      const quote = await resolveCheckoutQuote({
        productUid: item.productUid,
        quantity: item.quantity,
        shippingAddress: {
          ...input.address,
          countryCode: input.address.countryCode,
        },
        printFiles: item.files,
        items: [
          {
            productUid: item.productUid,
            quantity: item.quantity,
            printFiles: item.files,
          },
        ],
        currencyIsoCode: input.currency,
      });
      const shippingMethods = normalizeShippingMethods(quote.shippingOptions, quote.productCurrency);
      if (quote.available && shippingMethods.length > 0) return;

      unavailableItems.push({
        cartItemId: item.cartItemId,
        variantId: item.variantId,
        productUid: item.productUid,
        color: item.color,
        size: item.size,
        reason: "no_valid_shipping_method",
      });
    }),
  );

  return unavailableItems;
}

function isStaleClaim(updatedAt: string | null | undefined, ttlMs = PROCESSING_CLAIM_TTL_MS) {
  if (!updatedAt) return false;
  const parsed = Date.parse(updatedAt);
  if (!Number.isFinite(parsed)) return false;
  return Date.now() - parsed > ttlMs;
}

async function loadCheckoutDraftRow(
  supabase: ReturnType<typeof createSupabaseServer>,
  idempotencyKey: string,
  userId: string,
) {
  const startedAt = Date.now();
  console.info("[checkout:draft:lookup-existing-start]", {
    idempotencyKeyPresent: Boolean(idempotencyKey),
    userIdPresent: Boolean(userId),
  });
  const { data, error } = await supabase
    .from("checkout_drafts")
    .select("id, status, gelato_draft_order_id, subtotal, shipping_amount, total, currency, updated_at")
    .eq("idempotency_key", idempotencyKey)
    .eq("user_id", userId)
    .maybeSingle();

  console.info("[checkout:draft:lookup-existing-result]", {
    durationMs: Date.now() - startedAt,
    found: Boolean(data),
    status: data?.status ?? null,
    gelatoDraftOrderIdPresent: Boolean(data?.gelato_draft_order_id),
    error: error
      ? {
          code: error.code ?? null,
          message: error.message ?? null,
          details: error.details ?? null,
          hint: error.hint ?? null,
        }
      : null,
  });

  if (error) {
    logOperationError("checkout_drafts.lookup_existing", startedAt, error);
    throw error;
  }
  return data ?? null;
}

async function claimCheckoutDraftRow(input: {
  supabase: ReturnType<typeof createSupabaseServer>;
  idempotencyKey: string;
  userId: string;
  cartItemIds: string[];
  shippingMethod: {
    id: string;
    code: string | null;
    shipmentMethodUid: string;
    carrierUid: string | null;
    serviceType: string | null;
    fulfillmentCountry: string | null;
    name: string;
    price: number;
    currency: string;
  };
  address: ReturnType<typeof normalizeAddress>;
  subtotal: number;
  shippingAmount: number;
  total: number;
}) {
  const row = {
    user_id: input.userId,
    cart_item_ids: input.cartItemIds,
    idempotency_key: input.idempotencyKey,
    status: "processing",
    gelato_draft_order_id: null,
      selected_shipping_method: {
        id: input.shippingMethod.id,
        code: input.shippingMethod.code,
        shipmentMethodUid: input.shippingMethod.shipmentMethodUid,
        carrierUid: input.shippingMethod.carrierUid,
        serviceType: input.shippingMethod.serviceType,
        fulfillmentCountry: input.shippingMethod.fulfillmentCountry,
        name: input.shippingMethod.name,
        price: input.shippingAmount,
        currency: input.shippingMethod.currency,
    },
    shipping_address: input.address,
    subtotal: input.subtotal,
    shipping_amount: input.shippingAmount,
    total: input.total,
    currency: input.shippingMethod.currency,
    updated_at: new Date().toISOString(),
  };

  const insertStartedAt = Date.now();
  console.info("[checkout:draft:claim-insert-start]", {
    idempotencyKeyPresent: Boolean(input.idempotencyKey),
    userIdPresent: Boolean(input.userId),
    cartItemCount: input.cartItemIds.length,
  });
  const { data: inserted, error: insertError } = await input.supabase
    .from("checkout_drafts")
    .insert(row)
    .select("id, status, gelato_draft_order_id")
    .single();
  console.info("[checkout:draft:claim-insert-result]", {
    durationMs: Date.now() - insertStartedAt,
    inserted: Boolean(inserted?.id),
    status: inserted?.status ?? null,
    error: insertError
      ? {
          code: insertError.code ?? null,
          message: insertError.message ?? null,
          details: insertError.details ?? null,
          hint: insertError.hint ?? null,
        }
      : null,
  });

  if (inserted?.id) {
    console.info("[checkout-draft] claim acquired", {
      draftId: inserted.id,
      status: inserted.status,
    });
    return { draftId: inserted.id, claimed: true, status: inserted.status, gelatoDraftOrderId: inserted.gelato_draft_order_id ?? null } satisfies CheckoutDraftClaimResult;
  }

  if (insertError && insertError.code !== "23505") {
    logOperationError("checkout_drafts.claim_insert", insertStartedAt, insertError);
    throw insertError;
  }

  const existing = await loadCheckoutDraftRow(input.supabase, input.idempotencyKey, input.userId);
  if (!existing) {
    throw new Error("Failed to load existing checkout draft after claim conflict.");
  }

  if (existing.gelato_draft_order_id) {
    console.info("[checkout-draft] existing draft ready", {
      draftId: existing.id,
      status: existing.status,
    });
    return { draftId: existing.id, claimed: false, status: existing.status, gelatoDraftOrderId: existing.gelato_draft_order_id } satisfies CheckoutDraftClaimResult;
  }

  const canReclaimStaleProcessing = existing.status === "processing" && isStaleClaim(existing.updated_at);
  const canReclaimError = existing.status === "error";

  if (canReclaimStaleProcessing || canReclaimError) {
    const reclaimStartedAt = Date.now();
    console.info("[checkout:draft:claim-reclaim-start]", {
      draftId: existing.id,
      previousStatus: existing.status,
      staleProcessing: canReclaimStaleProcessing,
      errorStatus: canReclaimError,
    });
    const { data: reclaimed, error: reclaimError } = await input.supabase
      .from("checkout_drafts")
      .update({
        status: "processing",
        cart_item_ids: input.cartItemIds,
        selected_shipping_method: row.selected_shipping_method,
        shipping_address: input.address,
        subtotal: input.subtotal,
        shipping_amount: input.shippingAmount,
        total: input.total,
        currency: input.shippingMethod.currency,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .eq("user_id", input.userId)
      .eq("status", existing.status)
      .is("gelato_draft_order_id", null)
      .select("id, status, gelato_draft_order_id")
      .maybeSingle();
    console.info("[checkout:draft:claim-reclaim-result]", {
      durationMs: Date.now() - reclaimStartedAt,
      reclaimed: Boolean(reclaimed?.id),
      status: reclaimed?.status ?? null,
      error: reclaimError
        ? {
            code: reclaimError.code ?? null,
            message: reclaimError.message ?? null,
            details: reclaimError.details ?? null,
            hint: reclaimError.hint ?? null,
          }
        : null,
    });

    if (reclaimError) {
      logOperationError("checkout_drafts.claim_reclaim", reclaimStartedAt, reclaimError);
      throw reclaimError;
    }
    if (reclaimed?.id) {
      console.info("[checkout-draft] claim acquired", {
        draftId: reclaimed.id,
        status: reclaimed.status,
      });
      return { draftId: reclaimed.id, claimed: true, status: reclaimed.status, gelatoDraftOrderId: reclaimed.gelato_draft_order_id ?? null } satisfies CheckoutDraftClaimResult;
    }
  }

  console.info("[checkout-draft] claim already owned", {
    draftId: existing.id,
    status: existing.status,
  });
  return { draftId: existing.id, claimed: false, status: existing.status, gelatoDraftOrderId: existing.gelato_draft_order_id ?? null } satisfies CheckoutDraftClaimResult;
}

async function waitForCheckoutDraft(
  supabase: ReturnType<typeof createSupabaseServer>,
  idempotencyKey: string,
  userId: string,
  timeoutMs = WAIT_FOR_DRAFT_TIMEOUT_MS,
) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const draft = await loadCheckoutDraftRow(supabase, idempotencyKey, userId);
    if (draft?.gelato_draft_order_id) {
      console.info("[checkout-draft] existing draft ready", {
        draftId: draft.id,
        status: draft.status,
      });
      return draft;
    }
    if (draft?.status === "error") {
      return draft;
    }
    console.info("[checkout-draft] waiting for existing draft", {
      idempotencyKey,
    });
    await new Promise((resolve) => setTimeout(resolve, WAIT_FOR_DRAFT_POLL_MS));
  }
  return null;
}

function gelatoRequestPayload(input: {
  idempotencyKey: string;
  currency: string;
  shippingMethod: {
    id: string;
    code?: string | null;
    shipmentMethodUid: string;
    name: string;
    price: number;
    currency: string;
  };
  address: ReturnType<typeof normalizeAddress>;
  items: Array<{ cartItemId: string; userProductId: string | null; productUid: string; quantity: number; files: GelatoFile[]; adjustProductUidByFileTypes?: boolean }>;
  email: string;
}) {
  return {
    orderType: "draft" as const,
    orderReferenceId: input.idempotencyKey,
    customerReferenceId: input.email,
    currency: input.currency,
    shipmentMethodUid: input.shippingMethod.shipmentMethodUid,
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
      ...(item.adjustProductUidByFileTypes ? { adjustProductUidByFileTypes: true } : {}),
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
  const totalStartedAt = Date.now();
  const timings = {
    authMs: 0,
    cartLoadMs: 0,
    userProductsMs: 0,
    variantsMs: 0,
    availabilityMs: 0,
    quotePreparationMs: 0,
    idempotencyMs: 0,
    gelatoMs: 0,
    persistMs: 0,
    totalMs: 0,
  };
  try {
    const supabase = createSupabaseServer();
    const body = (await req.json().catch(() => null)) as DraftBody | null;
    const cartItemIds = Array.from(new Set((body?.cartItemIds ?? []).filter(isUuid)));
    const shippingMethodInput = body?.shippingMethod ?? null;
    const address = normalizeAddress(body ?? {});

    console.info("[checkout:draft:01-request]", {
      cartItemCount: Array.isArray(body?.cartItemIds) ? body.cartItemIds.length : 0,
      hasAddress: Boolean(body?.address),
      hasShippingMethod: Boolean(body?.shippingMethod),
      selectedShippingMethod: body?.shippingMethod
        ? {
            id: body.shippingMethod.id ?? null,
            code: body.shippingMethod.code ?? null,
            shipmentMethodUid: body.shippingMethod.shipmentMethodUid ?? null,
            name: body.shippingMethod.name ?? null,
            price: body.shippingMethod.price ?? null,
            currency: body.shippingMethod.currency ?? null,
          }
        : null,
    });

    const authStartedAt = Date.now();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    timings.authMs += elapsedSince(authStartedAt);
    if (authError) {
      console.error("[checkout:draft:02-auth-failed]", { message: authError.message ?? "Unknown auth error" });
    }
    console.info("[checkout:draft:02-auth]", {
      authenticated: Boolean(authData.user?.id),
      userIdSuffix: authData.user?.id ? authData.user.id.slice(-8) : null,
    });
    if (!authData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!cartItemIds.length) return NextResponse.json({ code: "MISSING_CART_ITEMS", success: false }, { status: 400 });
    if (
      !shippingMethodInput?.id ||
      !shippingMethodInput.shipmentMethodUid ||
      !shippingMethodInput.name
    ) {
      return NextResponse.json({ code: "MISSING_SHIPPING_METHOD", success: false }, { status: 400 });
    }
    if (!address.firstName || !address.lastName || !address.email || !address.addressLine1 || !address.city || !address.postalCode || !address.countryCode) {
      return NextResponse.json({ code: "ADDRESS_INVALID", success: false }, { status: 400 });
    }

    const cartStartedAt = Date.now();
    const { data: cartRows, error: cartError } = await supabase
      .from("cart_items")
      .select("id, user_id, product_id, variant_id, user_product_id, design_id, quantity, selected_variant, title")
      .eq("user_id", authData.user.id)
      .in("id", cartItemIds);
    timings.cartLoadMs += elapsedSince(cartStartedAt);
    if (cartError) return NextResponse.json({ error: cartError.message }, { status: 500 });
    if ((cartRows ?? []).length !== cartItemIds.length) return NextResponse.json({ error: "CART_OWNERSHIP_INVALID" }, { status: 403 });

    console.info("[checkout:draft:03-cart-items]", {
      requestedCount: cartItemIds.length,
      loadedCount: cartRows?.length ?? 0,
      items: (cartRows ?? []).map((item) => ({
        cartItemId: item.id,
        productId: item.product_id ?? null,
        userProductId: item.user_product_id ?? null,
        variantId: item.variant_id ?? null,
        sku: null,
        size: null,
        quantity: item.quantity ?? null,
        hasSelectedVariant: Boolean(item.selected_variant),
      })),
    });

    const userProductIds = Array.from(
      new Set(
        (cartRows ?? [])
          .map((item) => item.user_product_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0),
      ),
    );
    const designIds = Array.from(new Set((cartRows ?? []).map((row) => row.design_id).filter((value): value is string => Boolean(value))));
    const productIds = Array.from(new Set((cartRows ?? []).map((row) => row.product_id)));
    const variantHints = Array.from(new Set((cartRows ?? []).map((row) => row.variant_id).filter((value): value is string => Boolean(value))));

    const productRowsPromise = supabase.from("products").select("id, gelato_product_uid, price").in("id", productIds);
    const variantRowsPromise = supabase.from("product_variants").select("id, sku, size, product_color_id, gelato_product_uid, price, name, gelato_attributes").in("id", variantHints);
    const userProductRowsPromise = userProductIds.length
      ? supabase
          .from("user_products")
          .select("id, user_id, price, markup, final_price, design_data, print_files, mockups")
          .eq("user_id", authData.user.id)
          .in("id", userProductIds)
      : Promise.resolve({ data: [] as UserProductRow[], error: null });

    const batchStartedAt = Date.now();
    const [{ data: productRows }, { data: variantRows }, userProductResult] = await Promise.all([
      productRowsPromise,
      variantRowsPromise,
      userProductRowsPromise,
    ]);
    const batchLoadMs = elapsedSince(batchStartedAt);
    timings.userProductsMs += batchLoadMs;
    timings.variantsMs += batchLoadMs;
    const userProductRows = "data" in userProductResult ? userProductResult.data : [];
    const userProductRowsError = "error" in userProductResult ? userProductResult.error : null;


    if (userProductRowsError) {
      console.error("[checkout:draft:user-products-query-failed]", {
        message: userProductRowsError.message,
        code: userProductRowsError.code,
        requestedCount: userProductIds.length,
      });
      return NextResponse.json(
        {
          success: false,
          code: "USER_PRODUCTS_QUERY_FAILED",
          message: "Unable to load user products for checkout draft.",
        },
        { status: 500 },
      );
    }

    const userProductById = new Map((userProductRows ?? []).map((row) => [(row as UserProductRow).id, row as UserProductRow]));
    let allVariantRows = (variantRows ?? []) as VariantRow[];
    const fallbackVariantIds = Array.from(
      new Set(
        (cartRows ?? [])
          .flatMap((row) => {
            const userProductId = row.user_product_id;
            const userProduct =
              typeof userProductId === "string"
                ? userProductById.get(userProductId) ?? null
                : null;
            const legacyDesignUserProduct = !userProduct && row.design_id ? userProductById.get(row.design_id) ?? null : null;
            const resolvedUserProduct = userProduct ?? legacyDesignUserProduct;
            const cartSelectedVariant = getCartSelectedVariant(row as CartRow);
            return [
              firstString(cartSelectedVariant?.id, cartSelectedVariant?.variantId),
              resolveSavedVariantId(resolvedUserProduct),
            ];
          })
          .filter((value): value is string => Boolean(value) && !allVariantRows.some((variant) => variant.id === value)),
      ),
    );

    if (fallbackVariantIds.length) {
      const fallbackVariantsStartedAt = Date.now();
      const { data: fallbackVariantRows, error: fallbackVariantRowsError } = await supabase
        .from("product_variants")
        .select("id, sku, size, product_color_id, gelato_product_uid, price, name, gelato_attributes")
        .in("id", fallbackVariantIds);
      timings.variantsMs += elapsedSince(fallbackVariantsStartedAt);
      if (fallbackVariantRowsError) {
        console.error("[checkout:draft:fallback-variants-query-failed]", {
          message: fallbackVariantRowsError.message,
          code: fallbackVariantRowsError.code,
          fallbackVariantIds,
        });
      } else {
        allVariantRows = [...allVariantRows, ...((fallbackVariantRows ?? []) as VariantRow[])];
      }
    }

    const productMap = new Map((productRows ?? []).map((row) => [(row as ProductRow).id, row as ProductRow]));
    const variantMap = new Map(allVariantRows.map((row) => [row.id, row]));

    const resolvedItems: ResolvedCheckoutItem[] = [];
    let subtotal = 0;
    const quoteCurrency = "EUR";
    const availabilityByVariantId = new Map<string, Promise<Awaited<ReturnType<typeof checkGelatoRegionalAvailability>>>>();

    for (const cartRow of cartRows ?? []) {
      const userProductId = cartRow.user_product_id;
      const userProduct =
        typeof userProductId === "string"
          ? userProductById.get(userProductId) ?? null
          : null;
      const legacyDesignUserProduct = !userProduct && cartRow.design_id ? userProductById.get(cartRow.design_id) ?? null : null;
      const resolvedUserProduct = userProduct ?? legacyDesignUserProduct;
      console.info("[checkout:draft:user-product-resolution]", {
        cartItemId: cartRow.id,
        requestedUserProductId: cartRow.user_product_id ?? null,
        found: Boolean(resolvedUserProduct),
        resolvedUserProductId: resolvedUserProduct?.id ?? null,
        loadedUserProductsCount: userProductRows?.length ?? 0,
        loadedUserProductIds: (userProductRows ?? []).map((item) => item.id),
      });
      const cartSelectedVariant = getCartSelectedVariant(cartRow as CartRow);
      const savedSelectedVariant = getSavedSelectedVariant(resolvedUserProduct);
      const savedSelectedVariantId = resolveSavedVariantId(resolvedUserProduct);
      const cartSelectedVariantId = firstString(cartSelectedVariant?.id, cartSelectedVariant?.variantId);
      const cartVariant = cartRow.variant_id ? variantMap.get(cartRow.variant_id) ?? null : null;
      const cartSelectedVariantRow = cartSelectedVariantId ? variantMap.get(cartSelectedVariantId) ?? null : null;
      const savedSelectedVariantRow = savedSelectedVariantId ? variantMap.get(savedSelectedVariantId) ?? null : null;
      const variant = cartVariant ?? cartSelectedVariantRow ?? savedSelectedVariantRow ?? null;
      const resolutionSource = cartVariant
        ? "cart_items.variant_id"
        : cartSelectedVariantRow
          ? "cart_items.selected_variant"
          : savedSelectedVariantRow
            ? "user_products.design_data.selectedVariant"
            : "missing";

      console.info("[checkout:draft:variant-resolution]", {
        cartItemId: cartRow.id,
        cartVariantId: cartRow.variant_id ?? null,
        cartVariantSku: cartVariant?.sku ?? null,
        savedSelectedVariantId,
        savedSelectedVariantSku: savedSelectedVariantRow?.sku ?? firstString(savedSelectedVariant?.sku),
        resolvedVariantId: variant?.id ?? null,
        resolvedVariantSku: variant?.sku ?? null,
        resolutionSource,
      });

      if (!variant) {
        console.error("[checkout:draft:04-variant-failed]", {
          cartItemId: cartRow.id,
          productId: cartRow.product_id ?? null,
          variantId: cartRow.variant_id ?? null,
          cartSelectedVariantId,
          savedSelectedVariantId,
          sku: cartSelectedVariant?.sku ?? null,
          size: cartSelectedVariant?.size ?? null,
          selectedVariantKeys:
            cartRow.selected_variant && typeof cartRow.selected_variant === "object" ? Object.keys(cartRow.selected_variant) : [],
        });
        return conflict("MISSING_VARIANT", "Unable to resolve a variant for this cart item.", { cartItemId: cartRow.id });
      }

      const availabilityKey = `${variant.id}:${address.countryCode}`;
      const availabilityStartedAt = Date.now();
      let regionalAvailabilityPromise = availabilityByVariantId.get(availabilityKey);
      if (!regionalAvailabilityPromise) {
        regionalAvailabilityPromise = checkGelatoRegionalAvailability({
          variantId: variant.id,
          countryCode: address.countryCode,
          gelatoApiKey: process.env.GELATO_API_KEY?.trim() ?? null,
          resolveVariant: async () => variant,
        });
        availabilityByVariantId.set(availabilityKey, regionalAvailabilityPromise);
      }
      const regionalAvailability = await regionalAvailabilityPromise;
      timings.availabilityMs += elapsedSince(availabilityStartedAt);
      console.info("[checkout:availability:item]", {
        cartItemId: cartRow.id,
        variantId: variant.id,
        gelatoProductUid: variant.gelato_product_uid ?? null,
        countryCode: address.countryCode,
      });
      console.info("[checkout:availability:result]", {
        cartItemId: cartRow.id,
        variantId: variant.id,
        countryCode: address.countryCode,
        gelatoStatus: regionalAvailability.gelatoStatus,
        status: regionalAvailability.status,
      });
      if (regionalAvailability.status === "unavailable" || regionalAvailability.status === "unknown") {
        console.info("[checkout:availability:blocked]", {
          countryCode: address.countryCode,
          unavailableCount: 1,
        });
        return conflict("PRODUCT_UNAVAILABLE", "One or more cart items are not available for delivery to the selected country.", {
          cartItemId: cartRow.id,
          variantId: variant.id,
          countryCode: address.countryCode,
          status: regionalAvailability.status,
        });
      }

      const product = productMap.get(cartRow.product_id) ?? null;
      const currentProductUid = resolveProductUid(variant, cartRow as CartRow, userProduct, product);
      let productUid = currentProductUid;
      if (!productUid) {
        return conflict("MISSING_PRODUCT_UID", "Unable to resolve the Gelato product UID for this cart item.", { cartItemId: cartRow.id });
      }

      const userDesignData = userProduct?.design_data && typeof userProduct.design_data === "object"
        ? (userProduct.design_data as Record<string, unknown>)
        : null;
      const userSelectedVariant = userDesignData?.selectedVariant && typeof userDesignData.selectedVariant === "object"
        ? (userDesignData.selectedVariant as Record<string, unknown>)
        : null;

      console.info("[checkout:draft:04-variant-resolution]", {
        cartItemId: cartRow.id,
        originalVariantId: cartRow.variant_id ?? null,
        selectedVariantId: cartRow.selected_variant && typeof cartRow.selected_variant === "object" ? (cartRow.selected_variant as Record<string, unknown>).id ?? null : null,
        userProductVariantId: userDesignData?.variantId ?? userSelectedVariant?.id ?? null,
        resolvedVariantId: variant?.id ?? null,
        resolutionSource,
        sku: variant?.sku ?? cartRow.selected_variant?.sku ?? null,
        size: variant?.size ?? cartRow.selected_variant?.size ?? null,
        gelatoProductUidPresent: Boolean(productUid),
        gelatoProductUidPrefix: typeof productUid === "string" ? productUid.slice(0, 45) : null,
      });

      const designData = resolvedUserProduct?.design_data && typeof resolvedUserProduct.design_data === "object"
        ? (resolvedUserProduct.design_data as Record<string, unknown>)
        : null;
      const frontElements = designData?.sides && typeof designData.sides === "object" && (designData.sides as Record<string, unknown>).front && typeof (designData.sides as Record<string, unknown>).front === "object"
        ? ((designData.sides as Record<string, unknown>).front as Record<string, unknown>).elements
        : null;
      const backElements = designData?.sides && typeof designData.sides === "object" && (designData.sides as Record<string, unknown>).back && typeof (designData.sides as Record<string, unknown>).back === "object"
        ? ((designData.sides as Record<string, unknown>).back as Record<string, unknown>).elements
        : null;
      const frontHasDesign = hasVisiblePrintElements(frontElements);
      const backHasDesign = hasVisiblePrintElements(backElements);
      const hasSecondPrint = frontHasDesign && backHasDesign;
      const printFilesRecord = resolvedUserProduct?.print_files && typeof resolvedUserProduct.print_files === "object"
        ? (resolvedUserProduct.print_files as Record<string, unknown>)
        : {};
      const mockupsRecord = resolvedUserProduct?.mockups && typeof resolvedUserProduct.mockups === "object"
        ? (resolvedUserProduct.mockups as Record<string, unknown>)
        : {};
      const printFilesFinal = buildProductionFiles(printFilesRecord);
      const frontPrintFile = printFilesFinal.find((file) => file.type === "default")?.url ?? null;
      const backPrintFile = printFilesFinal.find((file) => file.type === "back")?.url ?? null;
      const hasBack = backHasDesign && Boolean(backPrintFile);
      const requiredPrintAreas = hasBack ? ["default", "back"] : ["default"];
      // Gelato v4 supports native product UID adjustment based on submitted file types.
      // For apparel with a back file, keep the canonical variant UID (size/color/product)
      // and let Gelato select the matching print configuration from ["default", "back"].
      // Front-only items preserve the existing behavior and omit the flag.
      const adjustProductUidByFileTypes = hasBack;

      console.info("[checkout:draft:print-area-resolution]", {
        cartItemId: cartRow.id,
        currentProductUid,
        productId: cartRow.product_id,
        hasFront: Boolean(frontPrintFile),
        hasBack,
        requiredPrintAreas,
        resolvedProductUid: productUid,
        resolvedFrom: adjustProductUidByFileTypes ? "gelato_adjust_by_file_types" : "current",
        adjustProductUidByFileTypes,
        filesSent: printFilesFinal.map((file) => file.type),
      });
      console.info("[checkout:draft:production-files]", {
        cartItemId: cartRow.id,
        printFilesFound: {
          front: asUrl(printFilesRecord.front) ?? asUrl(printFilesRecord.default) ?? asUrl(printFilesRecord.front_url) ?? null,
          back: asUrl(printFilesRecord.back) ?? asUrl(printFilesRecord.back_url) ?? null,
        },
        mockupsFound: {
          front: asUrl(mockupsRecord.front) ?? asUrl(mockupsRecord.front_url) ?? null,
          back: asUrl(mockupsRecord.back) ?? asUrl(mockupsRecord.back_url) ?? null,
        },
        filesSentToGelato: [
          ...printFilesFinal,
        ],
      });
      console.info("[checkout:draft:05-print-files]", {
        cartItemId: cartRow.id,
        userProductId: resolvedUserProduct?.id ?? null,
        frontHasDesign,
        backHasDesign,
        printFilesKeys: Object.keys(printFilesRecord),
        frontExists: Boolean(frontPrintFile),
        backExists: Boolean(backPrintFile),
        frontProtocol: typeof frontPrintFile === "string" ? frontPrintFile.split(":")[0] : null,
        backProtocol: typeof backPrintFile === "string" ? backPrintFile.split(":")[0] : null,
      });

      if (frontHasDesign && !frontPrintFile) {
        return conflict("PRINT_FILES_NOT_READY", "Print files are not ready for this cart item.", {
          userProductId: resolvedUserProduct?.id ?? cartRow.user_product_id ?? null,
          missingSides: ["front"],
        });
      }
      if (backHasDesign && !backPrintFile) {
        return conflict("PRINT_FILES_NOT_READY", "Print files are not ready for this cart item.", {
          userProductId: resolvedUserProduct?.id ?? cartRow.user_product_id ?? null,
          missingSides: ["back"],
        });
      }
      if (!frontPrintFile && !backPrintFile) {
        return conflict("PRINT_FILES_NOT_READY", "Print files are not ready for this cart item.", {
          userProductId: resolvedUserProduct?.id ?? cartRow.user_product_id ?? null,
          missingSides: frontHasDesign ? ["front"] : [],
        });
      }

      const quantity = Math.max(1, Number(cartRow.quantity) || 1);
      const containsMockupPath = printFilesFinal.some((file) => file.url.includes("/mockups/"));
      if (containsMockupPath) {
        return conflict("PRINT_FILES_NOT_READY", "Print files are not ready for this cart item.", {
          userProductId: resolvedUserProduct?.id ?? cartRow.user_product_id ?? null,
          missingSides: [],
        });
      }
      // Keep the draft financial snapshot aligned with the final Stripe checkout.
      // The current variant is the authoritative base price. If the saved design really
      // has a back print, derive the second-print charge from Gelato printPricing for
      // the delivery market. Never trust a browser-supplied surcharge.
      const currentVariantBasePrice = Number(variant?.price ?? resolvedUserProduct?.price ?? product?.price ?? 0);
      const marketCountryCode = resolveCountryCode(address.countryCode) ?? cleanText(address.countryCode).toUpperCase();
      const dynamicSecondPrintCharge = resolveSecondPrintCharge({
        hasFrontDesign: true,
        hasBackDesign: hasSecondPrint,
      });
      const unitPrice = currentVariantBasePrice + dynamicSecondPrintCharge;

      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        return conflict("INVALID_OFFICIAL_PRICE", "Unable to resolve an official EUR price for this cart item.", {
          cartItemId: cartRow.id,
          variantId: variant?.id ?? null,
        });
      }

      console.info("[checkout:draft:price-resolution]", {
        cartItemId: cartRow.id,
        variantId: variant?.id ?? null,
        variantBasePrice: currentVariantBasePrice,
        userProductId: resolvedUserProduct?.id ?? null,
        storedFinalPrice: resolvedUserProduct?.final_price ?? null,
        hasSecondPrint,
        dynamicSecondPrintCharge,
        printPricingCountryCode: marketCountryCode,
        unitPrice,
        quantity,
        lineTotal: unitPrice * quantity,
        currency: "EUR",
        policy: "current_variant_plus_fixed_second_print_fee_eur",
      });

      resolvedItems.push({
        cartItemId: cartRow.id,
        productId: cartRow.product_id,
        variantId: variant?.id ?? cartRow.variant_id ?? null,
        gelatoProductUid: productUid,
        productUid,
        userProductId: resolvedUserProduct?.id ?? cartRow.user_product_id ?? null,
        quantity,
        size: variant?.size ?? null,
        color: getCartColor(cartRow),
        gelatoColorKey: variant?.product_color_id ?? null,
        officialUnitPrice: unitPrice,
        hasFrontPrint: Boolean(frontPrintFile),
        hasBackPrint: Boolean(backPrintFile),
        files: printFilesFinal,
        adjustProductUidByFileTypes,
      });
      subtotal += unitPrice * quantity;
    }

    const quoteItems = resolvedItems.map((item) => ({
      itemReferenceId: item.cartItemId,
      productUid: item.gelatoProductUid,
      quantity: item.quantity,
      printFiles: item.files,
    }));

    console.info("[checkout:draft:06-quote-items]", {
      count: quoteItems.length,
      items: quoteItems.map((item) => ({
        itemReferenceId: item.itemReferenceId ?? null,
        productUidPresent: Boolean(item.productUid),
        productUidPrefix: typeof item.productUid === "string" ? item.productUid.slice(0, 50) : null,
        quantity: item.quantity,
        printFilesCount: Array.isArray(item.printFiles) ? item.printFiles.length : 0,
        printFileTypes: Array.isArray(item.printFiles) ? item.printFiles.map((file) => file.type) : [],
        printFileProtocols: Array.isArray(item.printFiles)
          ? item.printFiles.map((file) => (typeof file.url === "string" ? file.url.split(":")[0] : null))
          : [],
      })),
    });

    console.info("[checkout:draft:07-address]", {
      countryCode: address.countryCode ?? null,
      postalCodeLength: address.postalCode?.length ?? 0,
      cityPresent: Boolean(address.city),
      addressLine1Present: Boolean(address.addressLine1),
      statePresent: Boolean(address.state),
      stateCodePresent: Boolean(address.stateCode),
      emailPresent: Boolean(address.email),
      phonePresent: Boolean(address.phone),
    });

    const quotePreparationStartedAt = Date.now();
    const quotePayload = buildGelatoCheckoutQuotePayload({
      productUid: quoteItems[0].productUid,
      quantity: quoteItems[0].quantity,
      shippingAddress: {
        ...address,
        countryCode: address.countryCode,
      },
      printFiles: quoteItems[0].printFiles,
      items: quoteItems,
      currencyIsoCode: quoteCurrency,
    });
    timings.quotePreparationMs += elapsedSince(quotePreparationStartedAt);

    const safeQuotePayload = {
      ...quotePayload,
      shippingAddress: quotePayload.recipient
        ? {
            country: quotePayload.recipient.countryIsoCode ?? null,
            postCodePresent: Boolean(quotePayload.recipient.postcode),
            cityPresent: Boolean(quotePayload.recipient.city),
            addressLine1Present: Boolean(quotePayload.recipient.addressLine1),
          }
        : null,
      products: Array.isArray(quotePayload.products)
        ? quotePayload.products.map((item) => ({
            itemReferenceId: item.itemReferenceId ?? null,
            productUid: item.productUid ?? null,
            quantity: item.quantity ?? null,
            pdfUrlPresent: Boolean(item.pdfUrl),
          }))
        : [],
    };

    console.info("[checkout:draft:08-gelato-quote-payload]", JSON.stringify(safeQuotePayload, null, 2));

    const requestedShipmentMethodUid = shippingMethodInput.shipmentMethodUid?.trim();
    const requestedCarrierUid = shippingMethodInput.carrierUid?.trim() ?? null;
    const requestedServiceType = shippingMethodInput.serviceType?.trim().toLowerCase() ?? null;
    const requestedFulfillmentCountry = shippingMethodInput.fulfillmentCountry?.trim().toUpperCase() ?? null;

    console.info("[checkout-draft] server shipping comparison", {
      requestedShippingMethodUid: requestedShipmentMethodUid ?? null,
      requestedCarrierUid,
      requestedServiceType,
      requestedFulfillmentCountry,
      methodsCount: 1,
      methods: [
        {
          shipmentMethodUid: requestedShipmentMethodUid ?? null,
          id: shippingMethodInput.id ?? null,
          code: shippingMethodInput.code ?? null,
          carrierUid: requestedCarrierUid,
          serviceType: requestedServiceType,
          fulfillmentCountry: requestedFulfillmentCountry,
          name: shippingMethodInput.name ?? null,
          price: shippingMethodInput.price ?? null,
          currency: shippingMethodInput.currency ?? null,
        },
      ],
    });
    console.info("[checkout-draft] selected shipping method reused", {
      requestedShippingMethodUid: requestedShipmentMethodUid ?? null,
      requestedCarrierUid,
      requestedServiceType,
      requestedFulfillmentCountry,
      availableUids: [requestedShipmentMethodUid ?? null],
      availableCarrierService: [
        {
          carrierUid: requestedCarrierUid,
          serviceType: requestedServiceType,
          fulfillmentCountry: requestedFulfillmentCountry,
        },
      ],
    });

    const matched = {
      id: shippingMethodInput.id,
      code: shippingMethodInput.code ?? null,
      shipmentMethodUid: requestedShipmentMethodUid ?? shippingMethodInput.shipmentMethodUid,
      carrierUid: requestedCarrierUid,
      serviceType: requestedServiceType,
      fulfillmentCountry: requestedFulfillmentCountry,
      name: shippingMethodInput.name,
      price: Number(shippingMethodInput.price),
      currency: shippingMethodInput.currency ?? "EUR",
    };
    const resolutionSource: "exact_uid" | "stable_service_identity" | null = "exact_uid";
    const resolvedShipmentMethodUid = matched.shipmentMethodUid?.trim();
    if (!resolvedShipmentMethodUid) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_SHIPPING_METHOD",
          message: "The selected shipping method is missing a valid shipment UID.",
        },
        { status: 422 },
      );
    }
    if (isInvalidGelatoShippingMethodUid(resolvedShipmentMethodUid)) {
      return shippingUnavailable();
    }

    const shippingAmount = Number(matched.price);
    if (!Number.isFinite(shippingAmount) || shippingAmount < 0) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_SHIPPING_AMOUNT",
          message: "Unable to resolve a valid shipping amount.",
        },
        { status: 422 },
      );
    }

    const quoteValidationStartedAt = Date.now();
    const quote = await resolveCheckoutQuote({
      productUid: quoteItems[0].productUid,
      quantity: quoteItems[0].quantity,
      shippingAddress: {
        ...address,
        countryCode: address.countryCode,
      },
      printFiles: quoteItems[0].printFiles,
      items: quoteItems,
      currencyIsoCode: quoteCurrency,
    });
    timings.quotePreparationMs += elapsedSince(quoteValidationStartedAt);
    const validShippingMethods = normalizeShippingMethods(quote.shippingOptions, quote.productCurrency);
    const validatedShippingMethod = validShippingMethods.find((method) =>
      shippingMethodMatches({
        requestedId: shippingMethodInput.id ?? null,
        requestedShipmentMethodUid: resolvedShipmentMethodUid,
        requestedCarrierUid,
        requestedServiceType,
        requestedFulfillmentCountry,
        method,
      }),
    ) ?? null;

    console.info("[checkout:draft:shipping-validation-quote]", {
      available: quote.available,
      retryable: quote.retryable,
      reason: quote.reason,
      shippingMethodsCount: validShippingMethods.length,
      requestedShipmentMethodUid: resolvedShipmentMethodUid,
      matched: Boolean(validatedShippingMethod),
    });

    if (!quote.available || validShippingMethods.length === 0 || !validatedShippingMethod) {
      const unavailableItems = await identifyDraftShippingIncompatibleItems({
        resolvedItems,
        address,
        currency: quoteCurrency,
      });
      return shippingUnavailable({
        unavailableItems,
        quoteReason: quote.reason ?? quote.quoteReason ?? null,
      });
    }

    log("[checkout:draft-quote]", {
      available: true,
      retryable: false,
      reason: "validated_selected_shipping_method",
      shippingMethodsCount: validShippingMethods.length,
    });

    console.info("[checkout:draft:09-gelato-http]", {
      status: null,
      ok: null,
      contentType: null,
      bodyLength: null,
    });

    console.info("[checkout:draft:11-shipping-method]", {
      id: matched.id,
      code: matched.code ?? null,
      shipmentMethodUid: matched.shipmentMethodUid,
      name: matched.name,
      price: matched.price,
      currency: matched.currency,
    });

    console.info("[checkout:draft:12-shipping-match]", {
      selectedId: shippingMethodInput.id ?? null,
      selectedCode: shippingMethodInput.code ?? null,
      selectedShipmentMethodUid: shippingMethodInput.shipmentMethodUid ?? null,
      availableCount: 1,
      matched: true,
      matchedId: matched.id,
      matchedCode: matched.code ?? null,
      matchedShipmentMethodUid: resolvedShipmentMethodUid,
    });

    const idempotencySnapshot = buildIdempotencySnapshot(resolvedItems);
    const idempotencyKey = hashIdempotencyKey({
      userId: authData.user.id,
      countryCode: address.countryCode,
      postalCode: address.postalCode,
      shippingMethodUid: resolvedShipmentMethodUid,
      cart: idempotencySnapshot,
    });

    console.info("[checkout-draft] shipping selection resolved", {
      requestedPromiseUid: requestedShipmentMethodUid ?? null,
      resolvedPromiseUid: resolvedShipmentMethodUid,
      carrierUid: matched.carrierUid ?? null,
      serviceType: matched.serviceType ?? null,
      serverPrice: shippingAmount,
      serverCurrency: matched.currency,
      resolutionSource,
    });
    console.info("[checkout-draft] idempotency snapshot", {
      hash: idempotencyKey,
      itemCount: idempotencySnapshot.length,
    });

    const idempotencyLookupStartedAt = Date.now();
    const existingDraft = await loadCheckoutDraftRow(supabase, idempotencyKey, authData.user.id);
    timings.idempotencyMs += elapsedSince(idempotencyLookupStartedAt);

    if (existingDraft?.gelato_draft_order_id) {
      return NextResponse.json({
        success: true,
        draftOrderId: existingDraft.id,
        gelatoDraftOrderId: existingDraft.gelato_draft_order_id,
        shippingMethod: {
          id: matched.id,
          code: matched.code,
          shipmentMethodUid: resolvedShipmentMethodUid,
          name: matched.name,
          price: matched.price,
          currency: matched.currency,
        },
        subtotal: existingDraft.subtotal ?? 0,
        shipping: existingDraft.shipping_amount ?? shippingAmount,
        total: existingDraft.total ?? shippingAmount,
        currency: existingDraft.currency ?? matched.currency,
      });
    }

    const idempotencyClaimStartedAt = Date.now();
    const claim = await claimCheckoutDraftRow({
      supabase,
      idempotencyKey,
      userId: authData.user.id,
      cartItemIds,
      shippingMethod: {
        id: matched.id,
        code: matched.code ?? null,
        shipmentMethodUid: resolvedShipmentMethodUid,
        carrierUid: matched.carrierUid ?? null,
        serviceType: matched.serviceType ?? null,
        fulfillmentCountry: matched.fulfillmentCountry ?? null,
        name: matched.name,
        price: shippingAmount,
        currency: matched.currency,
      },
      address,
      subtotal,
      shippingAmount,
      total: subtotal + shippingAmount,
    });
    timings.idempotencyMs += elapsedSince(idempotencyClaimStartedAt);

    if (!claim.claimed) {
      const waitedDraft = await waitForCheckoutDraft(supabase, idempotencyKey, authData.user.id);
      if (waitedDraft?.gelato_draft_order_id) {
        return NextResponse.json({
          success: true,
          draftOrderId: waitedDraft.id,
          gelatoDraftOrderId: waitedDraft.gelato_draft_order_id,
          shippingMethod: {
            id: matched.id,
            code: matched.code,
            shipmentMethodUid: resolvedShipmentMethodUid,
            name: matched.name,
            price: matched.price,
            currency: matched.currency,
          },
          subtotal: waitedDraft.subtotal ?? subtotal,
          shipping: waitedDraft.shipping_amount ?? shippingAmount,
          total: waitedDraft.total ?? subtotal + shippingAmount,
          currency: waitedDraft.currency ?? matched.currency,
        });
      }

      return NextResponse.json(
        {
          success: false,
          code: "CHECKOUT_DRAFT_IN_PROGRESS",
          message: "The prepared order is still being processed. Please retry shortly.",
          retryable: true,
        },
        { status: 409 },
      );
    }

    const gelatoPayload = gelatoRequestPayload({
      idempotencyKey,
      currency: "EUR",
      shippingMethod: {
        id: matched.id,
        code: matched.code,
        shipmentMethodUid: resolvedShipmentMethodUid,
        name: matched.name,
        price: shippingAmount,
        currency: "EUR",
      },
      address,
      items: resolvedItems,
      email: authData.user.email ?? authData.user.id,
    });

    console.info("[checkout:draft:13-create-start]", {
      itemCount: gelatoPayload.items.length,
      shipmentMethodUidPresent: Boolean(gelatoPayload.shipmentMethodUid),
      shipmentMethodUid: gelatoPayload.shipmentMethodUid,
      currency: gelatoPayload.currency,
      items: gelatoPayload.items.map((item) => ({
        productUid: item.productUid,
        fileTypes: item.files.map((file) => file.type),
        adjustProductUidByFileTypes: item.adjustProductUidByFileTypes ?? false,
      })),
    });

    log("[checkout:variant-resolution]", { itemCount: resolvedItems.length });
    log("[checkout:shipping-validation]", { shippingMethodId: matched.id, shippingMethodCode: matched.code ?? null });

    const gelatoApiKey = process.env.GELATO_API_KEY?.trim();
    if (!gelatoApiKey) return NextResponse.json({ success: false, code: "GELATO_DRAFT_FAILED" }, { status: 500 });

    const gelatoDraftUrl = new URL("/v4/orders", process.env.GELATO_API_BASE_URL?.trim() || "https://order.gelatoapis.com");
    const gelatoDraftStartedAt = Date.now();
    console.info("[checkout:draft:14-gelato-request-start]", {
      endpoint: `${gelatoDraftUrl.origin}${gelatoDraftUrl.pathname}`,
      method: "POST",
      itemCount: gelatoPayload.items.length,
      shipmentMethodUidPresent: Boolean(gelatoPayload.shipmentMethodUid),
    });
    let gelatoResponse: Response;
    try {
      gelatoResponse = await fetch(gelatoDraftUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-KEY": gelatoApiKey },
        body: JSON.stringify(gelatoPayload),
        cache: "no-store",
      });
    } catch (error) {
      logOperationError("gelato.draft_order_fetch", gelatoDraftStartedAt, error);
      throw error;
    }

    const gelatoStatus = gelatoResponse.status;
    const gelatoContentType = gelatoResponse.headers.get("content-type");
    const gelatoRawText = await gelatoResponse.text();
    console.info("[checkout:draft:14-gelato-response]", {
      endpoint: `${gelatoDraftUrl.origin}${gelatoDraftUrl.pathname}`,
      durationMs: Date.now() - gelatoDraftStartedAt,
      httpStatus: gelatoStatus,
      ok: gelatoResponse.ok,
      contentType: gelatoContentType,
      bodyLength: gelatoRawText.length,
      bodyPreview: process.env.NODE_ENV !== "production" ? gelatoRawText.slice(0, 500) : undefined,
    });
    timings.gelatoMs += elapsedSince(gelatoDraftStartedAt);
    console.info("[checkout:draft:15-body-read-start]");
    console.info("[checkout:draft:15-body-read-finished]", {
      bodyLength: gelatoRawText.length,
      preview: process.env.NODE_ENV !== "production" ? gelatoRawText.slice(0, 500) : undefined,
    });
    let gelatoBody: unknown = null;
    console.info("[checkout:draft:16-json-parse-start]");
    try {
      gelatoBody = gelatoRawText ? JSON.parse(gelatoRawText) : null;
    } catch (error) {
      console.error("[checkout:draft:16-json-parse-error]", error);
      return NextResponse.json(
        {
          success: false,
          code: "GELATO_DRAFT_INVALID_RESPONSE",
          message: "Gelato returned an invalid Draft Order response.",
        },
        { status: 502 },
      );
    }
    console.info("[checkout:draft:16-json-parse-success]", {
      keys:
        gelatoBody && typeof gelatoBody === "object" && !Array.isArray(gelatoBody)
          ? Object.keys(gelatoBody as Record<string, unknown>)
          : [],
    });
    console.info("[checkout:draft:16-response-shape]", {
      bodyType: Array.isArray(gelatoBody) ? "array" : gelatoBody === null ? "null" : typeof gelatoBody,
      topLevelKeys:
        gelatoBody && typeof gelatoBody === "object" && !Array.isArray(gelatoBody)
          ? Object.keys(gelatoBody as Record<string, unknown>)
          : [],
      arrayLength: Array.isArray(gelatoBody) ? gelatoBody.length : null,
      firstItemKeys:
        Array.isArray(gelatoBody) && gelatoBody[0] && typeof gelatoBody[0] === "object"
          ? Object.keys(gelatoBody[0] as Record<string, unknown>)
          : [],
    });
    const gelatoError = gelatoBody && typeof gelatoBody === "object" ? (gelatoBody as Record<string, unknown>) : null;
    if (!gelatoResponse.ok) {
      console.error("[checkout:draft:10-gelato-error]", {
        httpStatus: gelatoStatus,
        code: gelatoError?.code ?? null,
        message: gelatoError?.message ?? null,
        requestId: gelatoError?.requestId ?? null,
        details: gelatoError?.details ?? null,
        responseKeys: gelatoError ? Object.keys(gelatoError) : [],
      });
      return NextResponse.json(
        {
          success: false,
          code: "GELATO_QUOTE_FAILED",
          message: typeof gelatoError?.message === "string" ? gelatoError.message : "Gelato quote failed.",
          gelatoCode: gelatoError?.code ?? null,
          gelatoRequestId: gelatoError?.requestId ?? null,
          gelatoDetails: gelatoError?.details ?? null,
        },
        { status: 502 },
      );
    }

    function extractGelatoOrderId(body: unknown): string | null {
      const candidates: unknown[] = [];

      const collect = (value: unknown) => {
        if (!value || typeof value !== "object") return;

        const row = value as Record<string, unknown>;
        candidates.push(row.id, row.orderId, row.order_id, row.draftOrderId, row.orderReferenceId);

        if (row.order && typeof row.order === "object") {
          const order = row.order as Record<string, unknown>;
          candidates.push(order.id, order.orderId, order.order_id, order.orderReferenceId);
        }

        if (row.data && typeof row.data === "object") {
          const data = row.data as Record<string, unknown>;
          candidates.push(data.id, data.orderId, data.order_id, data.draftOrderId, data.orderReferenceId);
        }

        if (row.orders && Array.isArray(row.orders)) {
          for (const order of row.orders) collect(order);
        }
      };

      if (Array.isArray(body)) {
        for (const item of body) collect(item);
      } else {
        collect(body);
      }

      const found = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
      return typeof found === "string" ? found.trim() : null;
    }

    console.info("[checkout:draft:17-id-resolution-start]");
    const gelatoDraftOrderId = extractGelatoOrderId(gelatoBody);
    const gelatoOrderReferenceId = (gelatoResponse as any)?.orderReferenceId ?? (gelatoBody as any)?.orderReferenceId ?? null;
    console.info("[checkout:draft:17-id-resolution]", {
      gelatoDraftOrderId,
      orderId: (gelatoBody as Record<string, unknown> | null)?.id ?? null,
      externalId: (gelatoBody as Record<string, unknown> | null)?.orderId ?? null,
      reference: (gelatoBody as Record<string, unknown> | null)?.orderReferenceId ?? null,
      gelatoDraftOrderIdPresent: Boolean(gelatoDraftOrderId),
    });
    if (!gelatoDraftOrderId) {
      const persistErrorStartedAt = Date.now();
      await supabase
        .from("checkout_drafts")
        .update({
          status: "error",
          updated_at: new Date().toISOString(),
        })
        .eq("id", claim.draftId)
        .eq("user_id", authData.user.id);
      timings.persistMs += elapsedSince(persistErrorStartedAt);
      console.error("[checkout:draft:17-id-missing]", gelatoBody);
      return NextResponse.json(
        {
          success: false,
          code: "GELATO_DRAFT_ID_MISSING",
          message: "Gelato created the draft but did not return a recognized order ID.",
        },
        { status: 502 },
      );
    }
    const draftRow = {
      user_id: authData.user.id,
      cart_item_ids: cartItemIds,
      idempotency_key: idempotencyKey,
      status: "draft",
      gelato_draft_order_id: gelatoDraftOrderId,
      order_reference_id: gelatoOrderReferenceId ?? idempotencyKey,
      selected_shipping_method: {
        id: matched.id,
        code: matched.code,
        shipmentMethodUid: matched.shipmentMethodUid,
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
        status: gelatoStatus,
      },
      updated_at: new Date().toISOString(),
    };

    console.info("[checkout:draft:18-persist-start]", {
      table: "checkout_drafts",
      userIdPresent: Boolean(authData.user.id),
      gelatoDraftOrderIdPresent: Boolean(gelatoDraftOrderId),
      cartItemCount: cartItemIds.length,
      idempotencyKeyPresent: Boolean(idempotencyKey),
      currency: matched.currency,
    });
    console.info("[checkout:draft:18-row]", {
      keys: Object.keys(draftRow),
      draftOrderIdPresent: Boolean((draftRow as { draft_order_id?: unknown }).draft_order_id),
      gelatoDraftOrderIdPresent: Boolean(draftRow.gelato_draft_order_id),
    });

    console.info("[checkout:draft:19-insert-start]");
    const persistStartedAt = Date.now();
    const { data: savedDraft, error: saveError } = await supabase
      .from("checkout_drafts")
      .update(draftRow)
      .eq("id", claim.draftId)
      .eq("user_id", authData.user.id)
      .select("id, gelato_draft_order_id, status")
      .single();
    timings.persistMs += elapsedSince(persistStartedAt);

    console.info("[checkout:draft:19-persist-result]", {
      hasData: Boolean(savedDraft),
      data: savedDraft,
      draftOrderId: savedDraft?.id ?? null,
      gelatoDraftOrderId: savedDraft?.gelato_draft_order_id ?? null,
      status: savedDraft?.status ?? null,
      error: saveError
        ? {
            code: saveError.code ?? null,
            message: saveError.message ?? null,
            details: saveError.details ?? null,
            hint: saveError.hint ?? null,
          }
        : null,
    });

    if (saveError || !savedDraft) {
      console.error("[checkout:draft:persist-failed]", {
        code: saveError?.code ?? null,
        message: saveError?.message ?? null,
        details: saveError?.details ?? null,
        hint: saveError?.hint ?? null,
      });
      const isMissingTable =
        saveError?.code === "42P01" ||
        /does not exist/i.test(saveError?.message ?? "") ||
        /does not exist/i.test(saveError?.details ?? "") ||
        /relation .*checkout_drafts/i.test(saveError?.message ?? "");
      return NextResponse.json(
        isMissingTable
          ? {
              success: false,
              code: "CHECKOUT_DRAFTS_TABLE_MISSING",
              message: "The checkout draft storage is not configured.",
            }
          : {
              success: false,
              code: "DRAFT_PERSIST_FAILED",
              message: "The draft was created but could not be saved.",
            },
        { status: isMissingTable ? 500 : 500 },
      );
    }

    log("[checkout:draft-created]", { draftOrderId: savedDraft.id });

    console.info("[checkout:draft:20-success-response]", {
      checkoutDraftId: savedDraft?.id ?? null,
      gelatoDraftOrderId,
    });

    timings.totalMs = elapsedSince(totalStartedAt);
    console.info("[checkout:draft:timings]", timings);

    return NextResponse.json({
      success: true,
      draftOrderId: savedDraft.id,
      gelatoDraftOrderId: savedDraft.gelato_draft_order_id ?? gelatoDraftOrderId,
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
  } catch (error) {
    console.error("[checkout:draft:99-unhandled]", describeUnknownError(error));
    return NextResponse.json(
      {
        success: false,
        code: "GELATO_DRAFT_FAILED",
        message: error instanceof Error ? error.message : "Unexpected checkout draft error.",
      },
      { status: 500 },
    );
  }
}
