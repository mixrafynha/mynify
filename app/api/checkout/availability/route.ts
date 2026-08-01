import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getGelatoCheckoutQuote } from "@/lib/gelato/checkout-quote";
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

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer();
    const { data: authData } = await supabase.auth.getUser();
    const body = await req.json().catch(() => null);
    const country = safeText(body?.country);
    const countryIso = safeText(body?.countryIso).toUpperCase() || null;
    const items = Array.isArray(body?.items) ? (body.items as AvailabilityItem[]) : [];

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

    const variantIds = [...new Set(items.map((item) => safeText(item.variantId)).filter(Boolean))];
    const cartItemIds = [...new Set(items.map((item) => safeText(item.cartItemId) || safeText(item.itemId)).filter(Boolean))];
    const userProductIds = [...new Set(items.map((item) => safeText(item.userProductId) || safeText(item.designId)).filter(Boolean))];
    const directProductUids = new Map(
      items
        .map((item) => [safeText(item.itemId) || safeText(item.cartItemId) || safeText(item.variantId) || crypto.randomUUID(), safeText(item.productUid)] as const)
        .filter(([, value]) => Boolean(value)),
    );

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
    if (userProductIds.length && authData?.user) {
      const { data: userProductRows } = await supabase
        .from("user_products")
        .select("id, print_files, design_data, mockups, production")
        .in("id", userProductIds)
        .eq("user_id", authData.user.id);

      (userProductRows ?? []).forEach((row) => {
        const record = row as Record<string, unknown> & { id?: string };
        if (record.id) userProductMap.set(record.id, record);
      });
    }

    if (cartItemIds.length && authData?.user) {
      const { data: cartRows } = await supabase
        .from("cart_items")
        .select("id, user_id, user_product_id, design_id, variant_id, product_id")
        .eq("user_id", authData.user.id)
        .in("id", cartItemIds);

      (cartRows ?? []).forEach((row) => {
        const record = row as { id?: string | null; user_product_id?: string | null; design_id?: string | null; variant_id?: string | null };
        const relatedId = record.user_product_id ?? record.design_id;
        if (record.id && relatedId && !userProductMap.has(relatedId)) {
          // fetch happens by userProductIds; this map is only used for lookups.
        }
        if (record.variant_id && record.id && variantMap.has(record.variant_id) === false) {
          // variant map handled separately
        }
      });
    }

    const quoteItems = items
      .map((item, index) => {
        const itemReferenceId = safeText(item.itemId) || safeText(item.cartItemId) || `availability-${index}`;
        const variantId = safeText(item.variantId);
        const cartItemId = safeText(item.cartItemId) || safeText(item.itemId);
        const designId = safeText(item.designId) || safeText(item.userProductId);
        const explicitProductUid = safeText(item.productUid);
        const productUidFromVariant = variantId ? variantMap.get(variantId) ?? null : null;
        const productUid = productUidFromVariant || explicitProductUid || null;

        const userProductRecord = designId ? userProductMap.get(designId) ?? null : null;
        const serverFiles = extractPrintableFiles(
          userProductRecord?.print_files ??
            userProductRecord?.printFiles ??
            userProductRecord?.design_data ??
            userProductRecord?.designData ??
            userProductRecord?.production,
        );
        const frontendFiles = Array.isArray(item.printFiles) ? item.printFiles : Array.isArray(item.files) ? item.files : [];
        const files = serverFiles.length > 0
          ? serverFiles
          : frontendFiles
              .map((file) => ({
                type: safeText(file?.type) || "default",
                url: safeText(file?.url),
              }))
              .filter((file) => isPublicHttpsUrl(file.url));

        const reasons: string[] = [];
        if (!variantId) reasons.push("MISSING_VARIANT");
        if (variantId && !productUidFromVariant && !explicitProductUid) reasons.push("VARIANT_NOT_FOUND");
        if (!productUid) reasons.push("MISSING_PRODUCT_UID");
        if (!designId && !cartItemId) reasons.push("PRINT_FILE_NOT_FOUND");
        if (!userProductRecord && (designId || cartItemId)) reasons.push("DESIGN_NOT_FOUND");
        if (!files.length) reasons.push("MISSING_PRINT_FILES");
        if (frontendFiles.some((file) => file?.url && !isPublicHttpsUrl(file.url))) reasons.push("INVALID_PRINT_FILE_URL");
        if (normalizeQuantity(item.quantity) <= 0) reasons.push("INVALID_QUANTITY");

        return {
          itemReferenceId,
          variantId: variantId || null,
          cartItemId,
          designId,
          productId: safeText(item.productId) || null,
          productUidPresent: Boolean(productUid),
          productUid,
          quantity: normalizeQuantity(item.quantity),
          printFilesPresent: files.length > 0,
          printFilesCount: files.length,
          printFiles: files.map((file) => ({
            type: file.type,
            urlPresent: Boolean(file.url),
            urlProtocol: safeProtocol(file.url),
          })),
          rejectionReason: reasons.length ? reasons.join(",") : null,
          _quoteItem: productUid && files.length ? {
            itemReferenceId,
            productUid,
            quantity: normalizeQuantity(item.quantity),
            printFiles: files,
          } : null,
        };
      });

    const rejectedItems = quoteItems
      .filter((item) => !item._quoteItem)
      .map(({ _quoteItem, ...item }) => item);

    console.log(
      "[CHECKOUT_QUOTE_ITEMS_BUILT]",
      JSON.stringify(
        {
          receivedItems: items.length,
          quoteItemsCount: quoteItems.filter((item) => item._quoteItem).length,
          rejectedItems,
        },
        null,
        2,
      ),
    );

    const validQuoteItems = quoteItems
      .map((item) => item._quoteItem)
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (!validQuoteItems.length) {
      return NextResponse.json(
        {
          ok: false,
          code: "NO_VALID_QUOTE_ITEMS",
          message: "No valid Gelato quote items could be created.",
          diagnostics: {
            receivedItems: items.length,
            rejectedItems: quoteItems.filter((item) => !item._quoteItem).map(({ _quoteItem, ...item }) => item),
          },
        },
        { status: 400 },
      );
    }

    console.log(
      "[GELATO_QUOTE_CALL_START]",
      safeLog({
        quoteItemsCount: quoteItems.length,
        countryCode: countryIso ?? country,
        postalCodePresent: Boolean(body?.postalCode || body?.shippingAddress?.postalCode),
      }),
    );

    const quote = await getGelatoCheckoutQuote({
      productUid: validQuoteItems[0].productUid,
      quantity: validQuoteItems[0].quantity,
      shippingAddress,
      printFiles: validQuoteItems[0].printFiles,
      items: validQuoteItems,
      currencyIsoCode: safeText(body?.currency) || "EUR",
      customerReferenceId: safeText(body?.customerReferenceId) || undefined,
      orderReferenceId: safeText(body?.orderReferenceId) || undefined,
    });

    console.log(
      "[GELATO_QUOTE_CALL_END]",
      safeLog({
        available: quote.available,
        retryable: quote.retryable,
        reason: quote.reason,
        shippingMethodsCount: quote.shippingOptions.length,
      }),
    );

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
          code: "NO_SHIPPING_METHODS_PARSED",
          message: "The Gelato response did not contain recognized shipping methods.",
          responseKeys: [],
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      ok: true,
      shippingMethods: quote.shippingOptions.map((option) => ({
        id: option.id,
        title: option.name,
        price: option.price,
        estimatedDays: option.estimatedDeliveryMin && option.estimatedDeliveryMax
          ? `${option.estimatedDeliveryMin} - ${option.estimatedDeliveryMax}`
          : option.estimatedDeliveryMin || option.estimatedDeliveryMax || null,
        currency: option.currency,
        fulfillmentCountry: option.fulfillmentCountry,
        promiseUid: option.promiseUid,
        serviceType: option.serviceType,
      })),
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
