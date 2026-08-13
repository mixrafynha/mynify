import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { buildGelatoCheckoutQuotePayload, resolveCheckoutQuote } from "@/lib/gelato/checkout-quote";
import { isInvalidGelatoShippingMethodUid, normalizeShippingMethods } from "@/lib/gelato/shipping-methods";
import { resolveCountryCode } from "@/lib/gelato/country-code-map";
import { checkGelatoRegionalAvailability } from "@/lib/gelato/regional-availability";

const MAX_BODY_BYTES = 32 * 1024;
const MAX_ITEMS = 10;
const MAX_QUANTITY = 10;
const MAX_PRINT_FILES_PER_ITEM = 2;
const MAX_TEXT_LENGTH = 160;
const MAX_URL_LENGTH = 2_000;
const RATE_LIMITS = {
  burst: { windowMs: 10_000, max: 5 },
  minute: { windowMs: 60_000, max: 30 },
};

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

type AvailabilityItem = {
  itemId?: string;
  title?: string;
  productId?: string;
  variantId?: string | null;
  designId?: string | null;
  userProductId?: string | null;
  cartItemId?: string | null;
  color?: string | null;
  size?: string | null;
  quantity?: number;
  productUid?: string | null;
  printFiles?: Array<{ type?: string; url?: string }>;
  files?: Array<{ type?: string; url?: string }>;
};

type ResolvedVariantSource = {
  productUid: string;
  productId: string;
};

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function boundedText(value: unknown, max = MAX_TEXT_LENGTH) {
  const text = safeText(value);
  return text.length > max ? "" : text;
}

function isUuid(value: unknown) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value.trim())
  );
}

function getClientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function checkWindowLimit(key: string, windowMs: number, max: number) {
  const now = Date.now();
  const bucketKey = `${key}:${windowMs}`;
  const current = rateLimitBuckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= max) return false;
  current.count += 1;
  return true;
}

function checkRateLimit(key: string) {
  return (
    checkWindowLimit(`checkout-availability:burst:${key}`, RATE_LIMITS.burst.windowMs, RATE_LIMITS.burst.max) &&
    checkWindowLimit(`checkout-availability:minute:${key}`, RATE_LIMITS.minute.windowMs, RATE_LIMITS.minute.max)
  );
}

function rejectRateLimited() {
  return NextResponse.json(
    { ok: false, code: "RATE_LIMITED", message: "Too many shipping checks. Try again shortly." },
    { status: 429 },
  );
}

function normalizeStrictQuantity(value: unknown) {
  const quantity = Number(value ?? 1);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) return null;
  return quantity;
}

function badRequest(code: string, message = "Invalid availability request.") {
  return NextResponse.json({ ok: false, code, message }, { status: 400 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) ?? "",
  };
}

function safeLog(value: unknown) {
  if (process.env.NODE_ENV === "production") return "[redacted]";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "[unserializable]";
  }
}

function safeProtocol(url: unknown) {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol.replace(":", "");
  } catch {
    return null;
  }
}

function isPublicHttpsUrl(value: unknown) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" && Boolean(parsed.hostname) && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

function validateIncomingItems(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return { items: null, code: "MISSING_ITEMS" };
  if (value.length > MAX_ITEMS) return { items: null, code: "TOO_MANY_ITEMS" };

  const items: AvailabilityItem[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) return { items: null, code: "INVALID_ITEM" };

    const variantId = boundedText(entry.variantId);
    const quantity = normalizeStrictQuantity(entry.quantity);
    if (!variantId || !isUuid(variantId)) return { items: null, code: "INVALID_VARIANT" };
    if (quantity === null) return { items: null, code: "INVALID_QUANTITY" };

    const productId = boundedText(entry.productId) || undefined;
    if (productId && !isUuid(productId)) return { items: null, code: "INVALID_PRODUCT" };

    const designId = boundedText(entry.designId) || null;
    const userProductId = boundedText(entry.userProductId) || null;
    const cartItemId = boundedText(entry.cartItemId) || null;
    const itemId = boundedText(entry.itemId) || undefined;
    if (designId && !isUuid(designId)) return { items: null, code: "INVALID_DESIGN" };
    if (userProductId && !isUuid(userProductId)) return { items: null, code: "INVALID_DESIGN" };
    if (cartItemId && !isUuid(cartItemId)) return { items: null, code: "INVALID_CART_ITEM" };

    const rawPrintFiles = Array.isArray(entry.printFiles)
      ? entry.printFiles
      : Array.isArray(entry.files)
        ? entry.files
        : [];
    if (rawPrintFiles.length > MAX_PRINT_FILES_PER_ITEM) return { items: null, code: "TOO_MANY_PRINT_FILES" };

    for (const file of rawPrintFiles) {
      if (!isRecord(file)) return { items: null, code: "INVALID_PRINT_FILE" };
      const url = safeText(file.url);
      if (url && !isPublicHttpsUrl(url)) return { items: null, code: "INVALID_PRINT_FILE_URL" };
      if (safeText(file.type).length > MAX_TEXT_LENGTH) return { items: null, code: "INVALID_PRINT_FILE" };
    }

    const productUid = boundedText(entry.productUid, 240) || null;
    items.push({
      itemId,
      title: boundedText(entry.title) || undefined,
      productId,
      variantId,
      designId,
      userProductId,
      cartItemId,
      color: boundedText(entry.color) || null,
      size: boundedText(entry.size) || null,
      quantity,
      productUid,
      printFiles: Array.isArray(entry.printFiles) ? (entry.printFiles as AvailabilityItem["printFiles"]) : undefined,
      files: Array.isArray(entry.files) ? (entry.files as AvailabilityItem["files"]) : undefined,
    });
  }

  return { items, code: null };
}

function extractPrintableFiles(source: unknown): Array<{ type: string; url: string }> {
  const files: Array<{ type: string; url: string }> = [];
  const push = (type: unknown, url: unknown) => {
    if (!isPublicHttpsUrl(url)) return;
    const safeUrl = typeof url === "string" ? url.trim() : "";
    if (!safeUrl) return;
    files.push({
      type: typeof type === "string" && type.trim() ? type.trim() : "default",
      url: safeUrl,
    });
  };

  if (!source) return files;

  if (Array.isArray(source)) {
    source.forEach((entry) => {
      if (!entry || typeof entry !== "object") return;
      const record = entry as Record<string, unknown>;
      push(record.type ?? record.side, record.url ?? record.fileUrl ?? record.printFileUrl ?? record.print_file_url ?? record.output_url ?? record.export_url ?? record.final_design_url ?? record.artwork_url ?? record.design_file_url);
    });
    return files;
  }

  if (typeof source === "object") {
    const record = source as Record<string, unknown>;
    ["default", "front", "back", "print", "production"].forEach((type) => {
      const entry = record[type];
      if (!entry) return;
      if (typeof entry === "string") {
        push(type, entry);
        return;
      }
      if (typeof entry === "object") {
        const fileRecord = entry as Record<string, unknown>;
        push(
          fileRecord.type ?? type,
          fileRecord.url ?? fileRecord.fileUrl ?? fileRecord.printFileUrl ?? fileRecord.print_file_url ?? fileRecord.output_url ?? fileRecord.export_url ?? fileRecord.final_design_url ?? fileRecord.artwork_url ?? fileRecord.design_file_url,
        );
      }
    });

    push(
      record.type ?? "default",
      record.url ?? record.fileUrl ?? record.printFileUrl ?? record.print_file_url ?? record.output_url ?? record.export_url ?? record.final_design_url ?? record.artwork_url ?? record.design_file_url,
    );
  }

  return files;
}

function shippingUnavailableMessage(item?: {
  color?: string | null;
  size?: string | null;
}) {
  const label = [item?.color, item?.size].map(safeText).filter(Boolean).join(" / ");
  return label
    ? `${label} is not available for delivery to this address. Choose another size or color.`
    : "One or more items are not available for delivery to this address. Choose another size or color.";
}

function quoteHasInvalidInternalShipping(quote: Awaited<ReturnType<typeof resolveCheckoutQuote>>) {
  return quote.shippingOptions.some((option) =>
    isInvalidGelatoShippingMethodUid(option.carrierUid) ||
    isInvalidGelatoShippingMethodUid(option.id) ||
    isInvalidGelatoShippingMethodUid(option.promiseUid),
  );
}

async function identifyShippingIncompatibleItems(input: {
  quoteItems: Array<{
    itemReferenceId: string;
    productUid: string;
    quantity: number;
    printFiles: Array<{ type: string; url: string }>;
  }>;
  sourceItems: AvailabilityItem[];
  shippingAddress: {
    firstName?: string;
    lastName?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    countryCode: string;
    email?: string;
    phone?: string;
  };
  currency: string;
}) {
  const sourceByReference = new Map(
    input.sourceItems.map((item) => [
      safeText(item.itemId) || safeText(item.cartItemId) || "availability",
      item,
    ]),
  );
  const incompatible: Array<{
    cartItemId: string | null;
    variantId: string | null;
    productUid: string;
    color: string | null;
    size: string | null;
    reason: string;
  }> = [];

  await Promise.all(
    input.quoteItems.map(async (quoteItem) => {
      const quote = await resolveCheckoutQuote({
        productUid: quoteItem.productUid,
        quantity: quoteItem.quantity,
        shippingAddress: input.shippingAddress,
        printFiles: quoteItem.printFiles,
        items: [quoteItem],
        currencyIsoCode: input.currency,
      });
      const shippingMethods = normalizeShippingMethods(quote.shippingOptions, quote.productCurrency);
      if (quote.available && shippingMethods.length > 0 && !quoteHasInvalidInternalShipping(quote)) return;

      const source = sourceByReference.get(quoteItem.itemReferenceId) ?? null;
      incompatible.push({
        cartItemId: safeText(source?.cartItemId) || safeText(source?.itemId) || null,
        variantId: safeText(source?.variantId) || null,
        productUid: quoteItem.productUid,
        color: source?.color ?? null,
        size: source?.size ?? null,
        reason: quoteHasInvalidInternalShipping(quote) ? "invalid_internal_shipping_method" : "no_valid_shipping_method",
      });
    }),
  );

  return incompatible;
}

async function resolveCartItemSources(
  supabase: ReturnType<typeof createSupabaseServer>,
  userId: string | null,
  items: AvailabilityItem[],
) {
  const variantIds = [...new Set(items.map((item) => safeText(item.variantId)).filter(Boolean))];
  const cartItemIds = [...new Set(items.map((item) => safeText(item.cartItemId) || safeText(item.itemId)).filter(Boolean))];
  const userProductIds = [...new Set(items.map((item) => safeText(item.userProductId) || safeText(item.designId)).filter(Boolean))];

  const variantMap = new Map<string, ResolvedVariantSource>();
  if (variantIds.length) {
    const { data: variantRows } = await supabase
      .from("product_variants")
      .select("id, gelato_product_uid, product_color_id")
      .in("id", variantIds);

    const colorIds = [
      ...new Set(
        (variantRows ?? [])
          .map((row) => (row as { product_color_id?: string | null }).product_color_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const { data: colorRows } = colorIds.length
      ? await supabase
          .from("product_colors")
          .select("id, product_id")
          .in("id", colorIds)
      : { data: [] };
    const productIds = [
      ...new Set(
        (colorRows ?? [])
          .map((row) => (row as { product_id?: string | null }).product_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const { data: productRows } = productIds.length
      ? await supabase
          .from("products")
          .select("id, is_active, status")
          .in("id", productIds)
          .eq("is_active", true)
          .eq("status", "active")
      : { data: [] };
    const colorProductMap = new Map(
      (colorRows ?? []).map((row) => {
        const record = row as { id?: string | null; product_id?: string | null };
        return [record.id, record.product_id] as const;
      }),
    );
    const activeProductIds = new Set((productRows ?? []).map((row) => String((row as { id: string }).id)));

    (variantRows ?? []).forEach((row) => {
      const record = row as { id?: string | null; gelato_product_uid?: string | null; product_color_id?: string | null };
      const productId = record.product_color_id ? colorProductMap.get(record.product_color_id) ?? null : null;
      if (record.id && record.gelato_product_uid && productId && activeProductIds.has(productId)) {
        variantMap.set(record.id, {
          productUid: record.gelato_product_uid,
          productId,
        });
      }
    });
  }

  const userProductMap = new Map<string, Record<string, unknown>>();
  const cartItemMap = new Map<string, { user_product_id: string | null; design_id: string | null; variant_id: string | null }>();
  if (userId && userProductIds.length) {
    const { data: userProductRows } = await supabase
      .from("user_products")
      .select("id, print_files, design_data, mockups")
      .eq("user_id", userId)
      .in("id", userProductIds);

    (userProductRows ?? []).forEach((row) => {
      const record = row as Record<string, unknown> & { id?: string };
      if (record.id) userProductMap.set(record.id, record);
    });
  }

  if (userId && cartItemIds.length) {
    const { data: cartRows } = await supabase
      .from("cart_items")
      .select("id, user_id, user_product_id, design_id, variant_id, product_id")
      .eq("user_id", userId)
      .in("id", cartItemIds);

    (cartRows ?? []).forEach((row) => {
      const record = row as { id?: string | null; user_product_id?: string | null; design_id?: string | null; variant_id?: string | null };
      if (record.id) {
        cartItemMap.set(record.id, {
          user_product_id: record.user_product_id ?? null,
          design_id: record.design_id ?? null,
          variant_id: record.variant_id ?? null,
        });
      }
    });
  }

  return { variantMap, userProductMap, cartItemMap };
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer();
    const { data: authData } = await supabase.auth.getUser();
    const rateLimitKey = `${authData?.user?.id ?? "guest"}:${getClientIp(req)}`;
    if (!checkRateLimit(rateLimitKey)) return rejectRateLimited();

    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { ok: false, code: "REQUEST_TOO_LARGE", message: "Availability request is too large." },
        { status: 413 },
      );
    }

    const rawBody = await req.text().catch(() => "");
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { ok: false, code: "REQUEST_TOO_LARGE", message: "Availability request is too large." },
        { status: 413 },
      );
    }

    let body: Record<string, unknown> | null = null;
    try {
      body = JSON.parse(rawBody || "null") as Record<string, unknown> | null;
    } catch {
      return badRequest("INVALID_JSON");
    }
    if (!isRecord(body)) return badRequest("INVALID_BODY");

    const validation = validateIncomingItems(body.items);
    if (!validation.items) return badRequest(validation.code ?? "INVALID_ITEMS");
    const items = validation.items;
    const shippingAddressInput = isRecord(body.shippingAddress) ? body.shippingAddress : {};
    const country = boundedText(body.country) || boundedText(shippingAddressInput.countryCode);
    const countryIso = (boundedText(body.countryIso) || boundedText(shippingAddressInput.countryCode)).toUpperCase() || null;

    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[CHECKOUT_AVAILABILITY_RECEIVED]",
        safeLog({
          itemsCount: items.length,
          countryCode: shippingAddressInput.countryCode ?? body.countryIso ?? body.country ?? null,
          postalCodePresent: Boolean(shippingAddressInput.postalCode ?? body.postalCode),
          cityPresent: Boolean(shippingAddressInput.city ?? body.city),
          addressLine1Present: Boolean(shippingAddressInput.addressLine1 ?? body.addressLine1 ?? body.address),
          items: items.map((item) => ({
            productId: item.productId ?? null,
            variantId: item.variantId ?? null,
            productUid: item.productUid ?? null,
            quantity: item.quantity ?? null,
            printFilesCount: Array.isArray(item.printFiles) ? item.printFiles.length : Array.isArray(item.files) ? item.files.length : 0,
          })),
        }),
      );
    }

    if (!country && !countryIso) {
      return NextResponse.json(
        {
          ok: false,
          code: "MISSING_COUNTRY",
          message: "Select a delivery country to calculate shipping.",
          diagnostics: {
            itemsReceived: items.length,
            quoteItemsCreated: 0,
            missingFields: ["country"],
          },
        },
        { status: 400 },
      );
    }

    const resolvedCountryIso = resolveCountryCode(countryIso ?? country);
    if (!resolvedCountryIso) return badRequest("INVALID_COUNTRY", "Select a valid delivery country.");
    const fullName =
      boundedText(body.fullName) ||
      boundedText(body.name) ||
      boundedText(shippingAddressInput.fullName) ||
      boundedText(shippingAddressInput.name);
    const splitName = splitFullName(fullName);
    const firstName =
      boundedText(body.firstName) ||
      boundedText(shippingAddressInput.firstName) ||
      splitName?.firstName ||
      "";
    const lastName =
      boundedText(body.lastName) ||
      boundedText(shippingAddressInput.lastName) ||
      splitName?.lastName ||
      "";

    const shippingAddress = {
      firstName,
      lastName,
      addressLine1:
        boundedText(shippingAddressInput.addressLine1) ||
        boundedText(body.addressLine1) ||
        boundedText(body.address),
      addressLine2:
        boundedText(shippingAddressInput.addressLine2) ||
        boundedText(body.addressLine2) ||
        undefined,
      city: boundedText(shippingAddressInput.city) || boundedText(body.city),
      state:
        boundedText(shippingAddressInput.state) ||
        boundedText(shippingAddressInput.stateCode) ||
        boundedText(body.state) ||
        boundedText(body.stateCode) ||
        undefined,
      stateCode:
        boundedText(shippingAddressInput.stateCode) ||
        boundedText(body.stateCode) ||
        boundedText(body.state) ||
        undefined,
      postalCode:
        boundedText(shippingAddressInput.postalCode, 32) ||
        boundedText(body.postalCode, 32),
      countryCode: resolvedCountryIso,
      email:
        boundedText(shippingAddressInput.email, 254) ||
        boundedText(body.email, 254) ||
        undefined,
      phone:
        boundedText(shippingAddressInput.phone, 48) ||
        boundedText(body.phone, 48) ||
        undefined,
    };

    if (
      !shippingAddress.firstName ||
      !shippingAddress.lastName ||
      !shippingAddress.addressLine1 ||
      !shippingAddress.city ||
      !shippingAddress.postalCode ||
      !shippingAddress.countryCode
    ) {
      return NextResponse.json(
        {
          ok: false,
          code: "INCOMPLETE_SHIPPING_ADDRESS",
          message: "Complete the delivery name and address before calculating shipping.",
        },
        { status: 400 },
      );
    }

    const { variantMap, userProductMap, cartItemMap } = await resolveCartItemSources(supabase, authData?.user?.id ?? null, items);

    for (const item of items) {
      const variantId = safeText(item.variantId);
      const resolvedVariant = variantMap.get(variantId) ?? null;
      const productId = safeText(item.productId);
      const productUid = safeText(item.productUid);

      if (!resolvedVariant) return badRequest("VARIANT_NOT_FOUND");
      if (productId && productId !== resolvedVariant.productId) return badRequest("INVALID_PRODUCT_VARIANT");
      if (productUid && productUid !== resolvedVariant.productUid) return badRequest("INVALID_PRODUCT_UID");
    }

    const regionalAvailabilityIssues: Array<{
      itemId: string;
      title: string;
      productId: string;
      variantId?: string | null;
      color?: string | null;
      size?: string | null;
      quantity: number;
      available: boolean;
      reason?: string | null;
    }> = [];

    for (const item of items) {
      const variantId = safeText(item.variantId);
      const availability = await checkGelatoRegionalAvailability({
        variantId,
        countryCode: shippingAddress.countryCode,
        gelatoApiKey: process.env.GELATO_API_KEY?.trim() ?? null,
        resolveVariant: async (resolvedVariantId) => {
          const { data: variant } = await supabase
            .from("product_variants")
            .select("id, product_color_id, size, gelato_product_uid")
            .eq("id", resolvedVariantId)
            .maybeSingle();
          return variant ?? null;
        },
      });

      console.info("[checkout:availability:item]", {
        cartItemId: item.cartItemId ?? item.itemId ?? null,
        variantId,
        gelatoProductUid: null,
        countryCode: shippingAddress.countryCode,
      });

      console.info("[checkout:availability:result]", {
        cartItemId: item.cartItemId ?? item.itemId ?? null,
        variantId,
        countryCode: shippingAddress.countryCode,
        gelatoStatus: availability.gelatoStatus,
        status: availability.status,
      });

      if (availability.status === "unavailable" || availability.status === "unknown") {
        regionalAvailabilityIssues.push({
          itemId: item.itemId ?? item.cartItemId ?? variantId,
          title: item.title ?? "Item",
          productId: item.productId ?? "unknown",
          variantId,
          color: item.color ?? null,
          size: item.size ?? null,
          quantity: item.quantity ?? 1,
          available: false,
          reason: availability.reason ?? availability.status,
        });
      }
    }

    if (regionalAvailabilityIssues.length) {
      console.info("[checkout:availability:blocked]", {
        countryCode: shippingAddress.countryCode,
        unavailableCount: regionalAvailabilityIssues.length,
      });

      return NextResponse.json({
        ok: true,
        available: false,
        configured: true,
        country: country,
        countryIso: shippingAddress.countryCode,
        unavailableItems: regionalAvailabilityIssues,
        message:
          regionalAvailabilityIssues.length > 0
            ? "Some items aren't available for delivery to this country."
            : null,
        shippingMethods: [],
      });
    }

    const quoteItems: Array<{
      itemReferenceId: string;
      productUid: string;
      quantity: number;
      printFiles: Array<{ type: string; url: string }>;
    }> = [];
    const rejectedItems: Array<{
      productId: string | null;
      variantId: string | null;
      designId: string | null;
      cartItemId: string | null;
      productUid: string | null;
      productUidPresent: boolean;
      quantity: number | null;
      printFilesCount: number;
      printFiles: Array<{ type: string | null; hasUrl: boolean; protocol: string | null }>;
      reason: string;
    }> = [];

    for (const item of items) {
      const itemReferenceId = safeText(item.itemId) || safeText(item.cartItemId) || "availability";
      const variantId = safeText(item.variantId);
      const cartItemId = safeText(item.cartItemId) || safeText(item.itemId) || null;
      const cartItemRow = cartItemId ? cartItemMap.get(cartItemId) ?? null : null;
      const designId = safeText(item.designId) || safeText(item.userProductId) || (cartItemRow?.design_id ?? cartItemRow?.user_product_id ?? null);
      const productId = safeText(item.productId) || null;
      const quantity = normalizeStrictQuantity(item.quantity);
      const productUidFromVariant = variantId ? variantMap.get(variantId)?.productUid ?? null : null;
      const productUidFromFrontend = safeText(item.productUid) || null;
      const resolvedProductUid = productUidFromVariant;
      const designLookupAttempted = Boolean(designId || cartItemId);
      const designFound = Boolean(designId && userProductMap.has(designId));

      const userProductRecord = designId ? userProductMap.get(designId) ?? null : null;
      const serverFiles = extractPrintableFiles(
        userProductRecord?.print_files ??
          userProductRecord?.printFiles ??
          userProductRecord?.design_data ??
          userProductRecord?.designData,
      );
      const frontendFiles = Array.isArray(item.printFiles) ? item.printFiles : Array.isArray(item.files) ? item.files : [];
      const resolvedPrintFiles = serverFiles.length > 0
        ? serverFiles
        : frontendFiles
            .map((file) => ({
              type: safeText(file?.type) || "default",
              url: safeText(file?.url),
            }))
            .filter((file) => isPublicHttpsUrl(file.url));

      let reason = "";
      if (!variantId) {
        reason = "MISSING_VARIANT";
      } else if (!productUidFromVariant) {
        reason = "VARIANT_NOT_FOUND";
      } else if (!resolvedProductUid) {
        reason = "MISSING_PRODUCT_UID";
      } else if (productUidFromFrontend && productUidFromFrontend !== resolvedProductUid) {
        reason = "INVALID_PRODUCT_UID";
      } else if (quantity === null) {
        reason = "INVALID_QUANTITY";
      } else if (frontendFiles.some((file) => file?.url && !isPublicHttpsUrl(file.url))) {
        reason = "INVALID_PRINT_FILE_URL";
      } else if (!resolvedPrintFiles.length) {
        reason = designLookupAttempted && !designFound ? "DESIGN_NOT_FOUND" : "MISSING_PRINT_FILES";
      }

      console.log(
        `[CHECKOUT_ITEM_RESOLVED] ${JSON.stringify({
          variantId,
          productUidSource: productUidFromVariant ? "database" : "missing",
          productUidPresent: Boolean(resolvedProductUid),
          printFilesSource: serverFiles.length > 0 ? "user_product" : frontendFiles.length > 0 ? "frontend" : "missing",
          printFilesCount: resolvedPrintFiles.length,
          quantity,
        })}`,
      );

      if (reason) {
        const rejection = {
          productId,
          variantId: variantId || null,
          designId,
          cartItemId,
          productUid: resolvedProductUid,
          productUidPresent: Boolean(resolvedProductUid),
          quantity,
          printFilesCount: Array.isArray(frontendFiles) ? frontendFiles.length : 0,
          printFiles: (Array.isArray(frontendFiles) ? frontendFiles : []).map((file) => ({
            type: typeof file?.type === "string" ? file.type : null,
            hasUrl: Boolean(file?.url),
            protocol: typeof file?.url === "string" ? safeProtocol(file.url) : null,
          })),
          reason,
        };
        rejectedItems.push(rejection);
        console.error(`[CHECKOUT_ITEM_REJECTED] ${JSON.stringify(rejection)}`);
        continue;
      }

      quoteItems.push({
        itemReferenceId,
        productUid: resolvedProductUid!,
        quantity: quantity ?? 1,
        printFiles: resolvedPrintFiles,
      });
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`[CHECKOUT_QUOTE_ITEMS_BUILT_JSON] ${JSON.stringify({
        receivedItems: items.length,
        quoteItemsCount: quoteItems.length,
        rejectedItems,
      })}`);
    }

    if (!quoteItems.length) {
      return NextResponse.json(
        {
          ok: false,
          code: "NO_VALID_QUOTE_ITEMS",
          message: "No valid Gelato quote items could be created.",
          diagnostics: {
            receivedItems: items.length,
            rejectedItems,
          },
        },
        { status: 400 },
      );
    }

    console.info("[checkout:availability:06-quote-items]", {
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

    console.info("[checkout:availability:07-address]", {
      countryCode: shippingAddress.countryCode ?? null,
      postalCodeLength: shippingAddress.postalCode?.length ?? 0,
      cityPresent: Boolean(shippingAddress.city),
      addressLine1Present: Boolean(shippingAddress.addressLine1),
      statePresent: Boolean(shippingAddress.state),
      emailPresent: Boolean(shippingAddress.email),
      phonePresent: Boolean(shippingAddress.phone),
    });

    const quotePayload = buildGelatoCheckoutQuotePayload({
      productUid: quoteItems[0].productUid,
      quantity: quoteItems[0].quantity,
      shippingAddress,
      printFiles: quoteItems[0].printFiles,
      items: quoteItems,
      currencyIsoCode: boundedText(body.currency, 3) || "EUR",
      customerReferenceId: boundedText(body.customerReferenceId) || undefined,
      orderReferenceId: boundedText(body.orderReferenceId) || undefined,
    });
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
    console.info("[checkout:availability:08-gelato-quote-payload]", JSON.stringify(safeQuotePayload, null, 2));

    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[GELATO_QUOTE_CALL_START]",
        safeLog({
          quoteItemsCount: quoteItems.length,
          countryCode: countryIso ?? country,
          postalCodePresent: Boolean(body.postalCode || shippingAddressInput.postalCode),
        }),
      );
    }

    const quote = await resolveCheckoutQuote({
      productUid: quoteItems[0].productUid,
      quantity: quoteItems[0].quantity,
      shippingAddress,
      printFiles: quoteItems[0].printFiles,
      items: quoteItems,
      currencyIsoCode: boundedText(body.currency, 3) || "EUR",
      customerReferenceId: boundedText(body.customerReferenceId) || undefined,
      orderReferenceId: boundedText(body.orderReferenceId) || undefined,
    });

    console.info("[checkout:availability:09-gelato-http]", {
      status: quote.httpStatus,
      ok: quote.httpStatus ? quote.httpStatus >= 200 && quote.httpStatus < 300 : null,
      contentType: quote.contentType,
      bodyLength: quote.bodyLength,
    });
    if (quote.errorCode || quote.errorMessage || quote.requestId || quote.details) {
      console.error("[checkout:availability:10-gelato-error]", {
        httpStatus: quote.httpStatus,
        code: quote.errorCode ?? null,
        message: quote.errorMessage ?? null,
        requestId: quote.requestId ?? null,
        details: quote.details ?? null,
        responseKeys: quote.responseKeys,
      });
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[GELATO_QUOTE_CALL_END]",
        safeLog({
          available: quote.available,
          retryable: quote.retryable,
          reason: quote.reason,
          shippingMethodsCount: quote.shippingOptions.length,
        }),
      );
    }

    if (quote.retryable) {
      return NextResponse.json(
        {
          ok: false,
          code: "GELATO_QUOTE_FAILED",
          retryable: true,
          message: "We couldn't calculate shipping. Check the address and try again.",
        },
        { status: 503 },
      );
    }

    const shippingMethods = normalizeShippingMethods(quote.shippingOptions, quote.productCurrency);
    const hasInvalidInternalShipping = quoteHasInvalidInternalShipping(quote);

    if (!quote.available || !shippingMethods.length || hasInvalidInternalShipping) {
      const incompatibleItems = await identifyShippingIncompatibleItems({
        quoteItems,
        sourceItems: items,
        shippingAddress,
        currency: boundedText(body.currency, 3) || "EUR",
      });
      const firstIncompatible = incompatibleItems[0];
      return NextResponse.json(
        {
          ok: true,
          available: false,
          configured: true,
          code: "CHECKOUT_SHIPPING_UNAVAILABLE",
          message: shippingUnavailableMessage(firstIncompatible),
          unavailableItems: incompatibleItems.map((item) => ({
            itemId: item.cartItemId ?? item.variantId ?? item.productUid,
            cartItemId: item.cartItemId,
            variantId: item.variantId,
            productUid: item.productUid,
            color: item.color,
            size: item.size,
            available: false,
            reason: item.reason,
          })),
          shippingMethods: [],
          responseKeys: quote.responseKeys,
          quoteReason: quote.quoteReason ?? null,
          invalidShippingMethod: hasInvalidInternalShipping,
        },
        { status: 200 },
      );
    }

    console.info("[shipping-origin] gelato raw", {
      requestedCurrency: boundedText(body.currency, 3) || "EUR",
      shippingOptions: Array.isArray(quote.shippingOptions)
        ? quote.shippingOptions.map((option) => ({
            id: option.id ?? null,
            promiseUid: option.promiseUid ?? null,
            carrierUid: option.carrierUid ?? null,
            serviceType: option.serviceType ?? null,
            price: option.price ?? null,
            currency: option.currency ?? null,
            fulfillmentCountry: option.fulfillmentCountry ?? null,
          }))
        : [],
    });

    console.info("[shipping-origin] normalized", {
      requestedCurrency: boundedText(body.currency, 3) || "EUR",
      shippingMethods: shippingMethods.map((method) => ({
        id: method.id ?? null,
        promiseUid: method.promiseUid ?? null,
        shipmentMethodUid: method.shipmentMethodUid ?? null,
        carrierUid: method.carrierUid ?? null,
        serviceType: method.serviceType ?? null,
        price: method.price ?? null,
        currency: method.currency ?? null,
        fulfillmentCountry: method.fulfillmentCountry ?? null,
      })),
    });
    console.info("[checkout:availability:11-quote-shape]", {
      responseKeys: quote.rawQuote && typeof quote.rawQuote === "object" ? Object.keys(quote.rawQuote as Record<string, unknown>) : [],
      dataKeys:
        quote.rawQuote && typeof quote.rawQuote === "object" && (quote.rawQuote as Record<string, unknown>).data && typeof (quote.rawQuote as Record<string, unknown>).data === "object"
          ? Object.keys((quote.rawQuote as Record<string, unknown>).data as Record<string, unknown>)
          : [],
      shippingMethodsCount: shippingMethods.length,
    });
    for (const method of shippingMethods) {
      console.info("[checkout:availability:11-shipping-method]", {
        id: method.id,
        code: method.code ?? null,
        shipmentMethodUid: method.shipmentMethodUid ?? null,
        carrierUid: method.carrierUid ?? null,
        serviceType: method.serviceType ?? null,
        fulfillmentCountry: method.fulfillmentCountry ?? null,
        name: method.name,
        price: method.price,
        currency: method.currency,
      });
    }

    return NextResponse.json({
      ok: true,
      shippingMethods,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        code: "GELATO_QUOTE_FAILED",
        retryable: true,
        message: error instanceof Error ? error.message : "Shipping could not be calculated.",
      },
      { status: 503 },
    );
  }
}
