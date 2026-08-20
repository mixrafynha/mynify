import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { resolveCheckoutQuote } from "@/lib/gelato/checkout-quote";
import { isInvalidGelatoShippingMethodUid, normalizeShippingMethods } from "@/lib/gelato/shipping-methods";
import { resolveCountryCode } from "@/lib/gelato/country-code-map";
import { checkGelatoRegionalAvailability } from "@/lib/gelato/regional-availability";
import { getDurableRateLimiter, getTrustedRequestIp } from "@/lib/server/rate-limit";
import {
  TrustedPrintFileError,
  type TrustedPrintFile,
} from "@/lib/server/trusted-print-files";
import {
  authorizeAvailabilityRequest,
  buildSafeAvailabilityQuoteLog,
  resolveAvailabilityTrustedPrintFiles,
} from "./security";

const MAX_BODY_BYTES = 32 * 1024;
const MAX_ITEMS = 10;
const MAX_QUANTITY = 10;
const MAX_TEXT_LENGTH = 160;
const checkoutAvailabilityRateLimiter = getDurableRateLimiter({
  namespace: "checkout-availability",
  limit: 60,
  window: "1 m",
});

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
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim())
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

function validateIncomingItems(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return { items: null, code: "MISSING_ITEMS" };
  if (value.length > MAX_ITEMS) return { items: null, code: "TOO_MANY_ITEMS" };

  const items: AvailabilityItem[] = [];
  for (const [itemIndex, entry] of value.entries()) {
    if (!isRecord(entry)) return { items: null, code: "INVALID_ITEM" };

    const variantId = boundedText(entry.variantId);
    const quantity = normalizeStrictQuantity(entry.quantity);
    if (!variantId || !isUuid(variantId)) {
      console.warn("[availability:INVALID_VARIANT]", {
        itemIndex,
        variantIdType: typeof entry.variantId,
      });
      return { items: null, code: "INVALID_VARIANT" };
    }
    if (quantity === null) return { items: null, code: "INVALID_QUANTITY" };

    const productId = boundedText(entry.productId) || undefined;
    if (productId && !isUuid(productId)) return { items: null, code: "INVALID_PRODUCT" };

    const designId = boundedText(entry.designId) || null;
    const userProductId = boundedText(entry.userProductId) || null;
    const cartItemId = boundedText(entry.cartItemId) || boundedText(entry.itemId) || null;
    const itemId = boundedText(entry.itemId) || undefined;
    if (designId && !isUuid(designId)) return { items: null, code: "INVALID_DESIGN" };
    if (userProductId && !isUuid(userProductId)) return { items: null, code: "INVALID_DESIGN" };
    if (!cartItemId || !isUuid(cartItemId)) return { items: null, code: "INVALID_CART_ITEM" };

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
    });
  }

  return { items, code: null };
}

function shippingUnavailableMessage(item?: {
  title?: string | null;
  productId?: string | null;
  color?: string | null;
  size?: string | null;
}) {
  const labelParts = [item?.title, item?.color, item?.size].map(safeText).filter(Boolean);
  const label = labelParts.join(" / ");
  const fallback = [item?.productId, item?.color, item?.size].map(safeText).filter(Boolean).join(" / ");
  const subject = label || fallback;
  return subject
    ? `${subject} is not available for delivery to this address. Choose another size or color.`
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
    title: string | null;
    variantId: string | null;
    productUid: string;
    productId: string | null;
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
        title: safeText(source?.title) || null,
        variantId: safeText(source?.variantId) || null,
        productUid: quoteItem.productUid,
        productId: safeText(source?.productId) || null,
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
  userId: string,
  items: AvailabilityItem[],
) {
  const variantIds = [...new Set(items.map((item) => safeText(item.variantId)).filter(Boolean))];
  const cartItemIds = [...new Set(items.map((item) => safeText(item.cartItemId) || safeText(item.itemId)).filter(Boolean))];

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

  const cartItemMap = new Map<string, {
    user_product_id: string | null;
    design_id: string | null;
    variant_id: string | null;
    product_id: string | null;
  }>();
  if (cartItemIds.length) {
    const { data: cartRows } = await supabase
      .from("cart_items")
      .select("id, user_id, user_product_id, design_id, variant_id, product_id")
      .eq("user_id", userId)
      .in("id", cartItemIds);

    (cartRows ?? []).forEach((row) => {
      const record = row as {
        id?: string | null;
        user_product_id?: string | null;
        design_id?: string | null;
        variant_id?: string | null;
        product_id?: string | null;
      };
      if (record.id) {
        cartItemMap.set(record.id, {
          user_product_id: record.user_product_id ?? null,
          design_id: record.design_id ?? null,
          variant_id: record.variant_id ?? null,
          product_id: record.product_id ?? null,
        });
      }
    });
  }

  const userProductIds = [
    ...new Set(
      [...cartItemMap.values()]
        .map((item) => item.user_product_id ?? item.design_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const userProductMap = new Map<string, Record<string, unknown>>();
  if (userProductIds.length) {
    const { data: userProductRows } = await supabase
      .from("user_products")
      .select("id, user_id, print_files")
      .eq("user_id", userId)
      .in("id", userProductIds);

    (userProductRows ?? []).forEach((row) => {
      const record = row as Record<string, unknown> & { id?: string };
      if (record.id) userProductMap.set(record.id, record);
    });
  }

  return { variantMap, userProductMap, cartItemMap };
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  try {
    const supabase = createSupabaseServer();
    const access = await authorizeAvailabilityRequest({
      loadUserId: async () => {
        const { data, error } = await supabase.auth.getUser();
        return error ? null : data.user?.id ?? null;
      },
      consumeRateLimit: (key) => checkoutAvailabilityRateLimiter.limit(key),
      requestIp: getTrustedRequestIp(req),
    });
    if (!access.ok) {
      if (access.code === "RATE_LIMIT_UNAVAILABLE") {
        console.error("[checkout-availability:rate-limit-error]", {
          requestId,
          code: access.code,
        });
      }
      return NextResponse.json(
        { ok: false, code: access.code, message: access.message },
        { status: access.status },
      );
    }
    const userId = access.userId;

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
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[CHECKOUT_AVAILABILITY_RECEIVED]",
        safeLog({
          requestId,
          itemsCount: items.length,
          countryCode: resolvedCountryIso,
          postalCodePresent: Boolean(shippingAddressInput.postalCode ?? body.postalCode),
          cityPresent: Boolean(shippingAddressInput.city ?? body.city),
          addressLine1Present: Boolean(shippingAddressInput.addressLine1 ?? body.addressLine1 ?? body.address),
          items: items.map((item) => ({
            productId: item.productId ?? null,
            variantId: item.variantId ?? null,
            quantity: item.quantity ?? null,
          })),
        }),
      );
    }
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

    const { variantMap, userProductMap, cartItemMap } = await resolveCartItemSources(supabase, userId, items);

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
      printFiles: TrustedPrintFile[];
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
      reason: string;
    }> = [];

    for (const item of items) {
      const itemReferenceId = safeText(item.itemId) || safeText(item.cartItemId) || "availability";
      const variantId = safeText(item.variantId);
      const cartItemId = safeText(item.cartItemId) || safeText(item.itemId) || null;
      const cartItemRow = cartItemId ? cartItemMap.get(cartItemId) ?? null : null;
      const requestedUserProductId = safeText(item.userProductId) || safeText(item.designId) || null;
      const designId = cartItemRow?.user_product_id ?? cartItemRow?.design_id ?? null;
      const productId = safeText(item.productId) || null;
      const quantity = normalizeStrictQuantity(item.quantity);
      const productUidFromVariant = variantId ? variantMap.get(variantId)?.productUid ?? null : null;
      const productUidFromFrontend = safeText(item.productUid) || null;
      const resolvedProductUid = productUidFromVariant;
      const designFound = Boolean(designId && userProductMap.has(designId));

      const userProductRecord = designId ? userProductMap.get(designId) ?? null : null;
      let availabilityPrintFiles: Array<{ type: "default" | "back"; url: string }> = [];
      let printFileErrorCode: string | null = null;
      if (userProductRecord && designId) {
        try {
          availabilityPrintFiles = resolveAvailabilityTrustedPrintFiles({
            storedPrintFiles: isRecord(userProductRecord.print_files)
              ? userProductRecord.print_files
              : null,
            userId,
            userProductId: designId,
          });
        } catch (error) {
          printFileErrorCode = error instanceof TrustedPrintFileError
            ? error.code
            : "PRINT_FILE_VALIDATION_FAILED";
        }
      }

      let reason = "";
      if (!cartItemRow) {
        reason = "CART_ITEM_NOT_FOUND";
      } else if (cartItemRow.variant_id !== variantId) {
        reason = "INVALID_CART_VARIANT";
      } else if (productId && cartItemRow.product_id !== productId) {
        reason = "INVALID_CART_PRODUCT";
      } else if (requestedUserProductId && requestedUserProductId !== designId) {
        reason = "INVALID_USER_PRODUCT";
      } else if (!variantId) {
        reason = "MISSING_VARIANT";
      } else if (!productUidFromVariant) {
        reason = "VARIANT_NOT_FOUND";
      } else if (!resolvedProductUid) {
        reason = "MISSING_PRODUCT_UID";
      } else if (productUidFromFrontend && productUidFromFrontend !== resolvedProductUid) {
        reason = "INVALID_PRODUCT_UID";
      } else if (quantity === null) {
        reason = "INVALID_QUANTITY";
      } else if (printFileErrorCode) {
        reason = printFileErrorCode;
      } else if (!availabilityPrintFiles.length) {
        reason = !designFound ? "DESIGN_NOT_FOUND" : "MISSING_PRINT_FILES";
      }

      console.log(
        `[CHECKOUT_ITEM_RESOLVED] ${JSON.stringify({
          variantId,
          productUidSource: productUidFromVariant ? "database" : "missing",
          productUidPresent: Boolean(resolvedProductUid),
          printFilesSource: availabilityPrintFiles.length > 0 ? "trusted_user_product" : "missing",
          printFilesCount: availabilityPrintFiles.length,
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
          printFilesCount: availabilityPrintFiles.length,
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
        printFiles: availabilityPrintFiles,
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

    console.info(
      "[checkout:availability:08-gelato-quote-payload]",
      buildSafeAvailabilityQuoteLog({
        requestId,
        userId,
        countryCode: shippingAddress.countryCode,
        items: quoteItems,
      }),
    );

    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[GELATO_QUOTE_CALL_START]",
        safeLog({
          quoteItemsCount: quoteItems.length,
          countryCode: shippingAddress.countryCode,
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
        correlationId: requestId,
        httpStatus: quote.httpStatus,
        code: quote.errorCode ?? null,
        providerRequestId: quote.requestId ?? null,
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
            title: item.title,
            variantId: item.variantId,
            productUid: item.productUid,
            productId: item.productId,
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
