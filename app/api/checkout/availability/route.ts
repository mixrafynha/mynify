import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { resolveCheckoutQuote } from "@/lib/gelato/checkout-quote";
import { normalizeShippingMethods } from "@/lib/gelato/shipping-methods";
import { resolveCountryCode } from "@/lib/gelato/country-code-map";

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

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

function normalizeQuantity(value: unknown) {
  const quantity = Math.max(1, Math.floor(Number(value) || 1));
  return Number.isFinite(quantity) ? quantity : 1;
}

function isPublicHttpsUrl(value: unknown) {
  if (typeof value !== "string") return false;
  return value.trim().startsWith("https://");
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

async function resolveCartItemSources(
  supabase: ReturnType<typeof createSupabaseServer>,
  userId: string | null,
  items: AvailabilityItem[],
) {
  const variantIds = [...new Set(items.map((item) => safeText(item.variantId)).filter(Boolean))];
  const cartItemIds = [...new Set(items.map((item) => safeText(item.cartItemId) || safeText(item.itemId)).filter(Boolean))];
  const userProductIds = [...new Set(items.map((item) => safeText(item.userProductId) || safeText(item.designId)).filter(Boolean))];

  const variantMap = new Map<string, string>();
  if (variantIds.length) {
    const { data: variantRows } = await supabase
      .from("product_variants")
      .select("id, gelato_product_uid")
      .in("id", variantIds);

    (variantRows ?? []).forEach((row) => {
      const record = row as { id?: string | null; gelato_product_uid?: string | null };
      if (record.id && record.gelato_product_uid) {
        variantMap.set(record.id, record.gelato_product_uid);
      }
    });
  }

  const userProductMap = new Map<string, Record<string, unknown>>();
  const cartItemMap = new Map<string, { user_product_id: string | null; design_id: string | null; variant_id: string | null }>();
  if (userId && userProductIds.length) {
    const { data: userProductRows } = await supabase
      .from("user_products")
      .select("id, print_files, design_data, mockups, production")
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
    const body = await req.json().catch(() => null);
    const country = safeText(body?.country);
    const countryIso = safeText(body?.countryIso).toUpperCase() || null;
    const items = Array.isArray(body?.items) ? (body.items as AvailabilityItem[]) : [];

    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[CHECKOUT_AVAILABILITY_RECEIVED]",
        safeLog({
          itemsCount: items.length,
          countryCode: body?.shippingAddress?.countryCode ?? body?.countryIso ?? body?.country ?? null,
          postalCodePresent: Boolean(body?.shippingAddress?.postalCode ?? body?.postalCode),
          cityPresent: Boolean(body?.shippingAddress?.city ?? body?.city),
          addressLine1Present: Boolean(body?.shippingAddress?.addressLine1 ?? body?.addressLine1 ?? body?.address),
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
    const shippingAddress = {
      firstName: "Customer",
      lastName: ".",
      addressLine1: safeText(body?.addressLine1) || safeText(body?.address) || "Address",
      addressLine2: safeText(body?.addressLine2) || undefined,
      city: safeText(body?.city) || "City",
      state: safeText(body?.state) || undefined,
      postalCode: safeText(body?.postalCode) || "0000",
      countryCode: resolvedCountryIso ?? countryIso ?? country,
      email: safeText(body?.email) || undefined,
      phone: safeText(body?.phone) || undefined,
    };

    const { variantMap, userProductMap, cartItemMap } = await resolveCartItemSources(supabase, authData?.user?.id ?? null, items);

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
      const quantity = Number.isFinite(Number(item.quantity)) ? Math.max(1, Math.floor(Number(item.quantity) || 1)) : null;
      const productUidFromVariant = variantId ? variantMap.get(variantId) ?? null : null;
      const productUidFromFrontend = safeText(item.productUid) || null;
      const resolvedProductUid = productUidFromVariant || productUidFromFrontend || null;
      const designLookupAttempted = Boolean(designId || cartItemId);
      const designFound = Boolean(designId && userProductMap.has(designId));

      const userProductRecord = designId ? userProductMap.get(designId) ?? null : null;
      const serverFiles = extractPrintableFiles(
        userProductRecord?.print_files ??
          userProductRecord?.printFiles ??
          userProductRecord?.design_data ??
          userProductRecord?.designData ??
          userProductRecord?.production,
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
      } else if (!productUidFromVariant && !productUidFromFrontend) {
        reason = "VARIANT_NOT_FOUND";
      } else if (!resolvedProductUid) {
        reason = "MISSING_PRODUCT_UID";
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
          productUidSource: productUidFromVariant ? "database" : productUidFromFrontend ? "frontend" : "missing",
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

    const quotePayload = {
      productUid: quoteItems[0].productUid,
      quantity: quoteItems[0].quantity,
      shippingAddress,
      printFiles: quoteItems[0].printFiles,
      items: quoteItems,
      currencyIsoCode: safeText(body?.currency) || "EUR",
      customerReferenceId: safeText(body?.customerReferenceId) || undefined,
      orderReferenceId: safeText(body?.orderReferenceId) || undefined,
    };
    const safeQuotePayload = {
      ...quotePayload,
      shippingAddress: quotePayload.shippingAddress
        ? {
            country: quotePayload.shippingAddress.countryCode ?? null,
            postCodePresent: Boolean(quotePayload.shippingAddress.postalCode),
            cityPresent: Boolean(quotePayload.shippingAddress.city),
            addressLine1Present: Boolean(quotePayload.shippingAddress.addressLine1),
          }
        : null,
      items: Array.isArray(quotePayload.items)
        ? quotePayload.items.map((item) => ({
            itemReferenceId: item.itemReferenceId ?? null,
            productUid: item.productUid ?? null,
            quantity: item.quantity ?? null,
            files: Array.isArray(item.printFiles)
              ? item.printFiles.map((file) => ({
                  type: file.type,
                  protocol: typeof file.url === "string" ? file.url.split(":")[0] : null,
                }))
              : undefined,
            printFiles: Array.isArray(item.printFiles)
              ? item.printFiles.map((file) => ({
                  type: file.type,
                  protocol: typeof file.url === "string" ? file.url.split(":")[0] : null,
                }))
              : undefined,
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
          postalCodePresent: Boolean(body?.postalCode || body?.shippingAddress?.postalCode),
        }),
      );
    }

    const quote = await resolveCheckoutQuote(quotePayload);

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

    if (!quote.available) {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_QUOTE_RESPONSE",
          message: "The Gelato response did not contain recognized shipping methods.",
          responseKeys: quote.responseKeys,
          quoteReason: quote.quoteReason ?? null,
        },
        { status: 422 },
      );
    }

    const shippingMethods = normalizeShippingMethods(quote.shippingOptions);
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
