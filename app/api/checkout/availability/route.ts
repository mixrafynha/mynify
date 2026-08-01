import { NextResponse } from "next/server";
import { getGelatoCheckoutQuote } from "@/lib/gelato/checkout-quote";
import { resolveCountryCode } from "@/lib/gelato/country-code-map";

type AvailabilityItem = {
  itemId?: string;
  title?: string;
  productId?: string;
  variantId?: string | null;
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

function normalizeQuantity(value: unknown) {
  const quantity = Math.max(1, Math.floor(Number(value) || 1));
  return Number.isFinite(quantity) ? quantity : 1;
}

export async function POST(req: Request) {
  try {
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

    const quoteItems = items
      .map((item, index) => {
        const productUid = safeText(item.productUid) || safeText(item.productId);
        const printFiles = Array.isArray(item.printFiles) ? item.printFiles : Array.isArray(item.files) ? item.files : [];
        return {
          itemReferenceId: safeText(item.itemId) || `availability-${index}`,
          productUid,
          quantity: normalizeQuantity(item.quantity),
          printFiles: printFiles
            .map((file) => ({
              type: safeText(file?.type) || "default",
              url: safeText(file?.url),
            }))
            .filter((file) => Boolean(file.url)),
        };
      })
      .filter((item) => Boolean(item.productUid) && item.printFiles.length > 0);

    console.log(
      "[CHECKOUT_QUOTE_ITEMS_BUILT]",
      safeLog({
        receivedItems: items.length,
        quoteItemsCount: quoteItems.length,
        rejectedItems: items
          .map((item, index) => {
            const productUid = safeText(item.productUid) || safeText(item.productId);
            const printFiles = Array.isArray(item.printFiles) ? item.printFiles : Array.isArray(item.files) ? item.files : [];
            const missing: string[] = [];
            if (!productUid) missing.push("productUid");
            if (!printFiles.length) missing.push("printFiles");
            return missing.length
              ? {
                  itemReferenceId: safeText(item.itemId) || `availability-${index}`,
                  variantId: item.variantId ?? null,
                  reason: missing.join(","),
                }
              : null;
          })
          .filter(Boolean),
      }),
    );

    if (!quoteItems.length) {
      return NextResponse.json(
        {
          ok: false,
          code: "NO_VALID_QUOTE_ITEMS",
          message: "No valid Gelato quote items could be created.",
          diagnostics: {
            receivedItems: items.length,
            rejectedItems: items.map((item, index) => ({
              itemReferenceId: safeText(item.itemId) || `availability-${index}`,
              variantId: item.variantId ?? null,
              reason: [
                !safeText(item.productUid) && !safeText(item.productId) ? "missing_product_uid" : null,
                !(
                  (Array.isArray(item.printFiles) ? item.printFiles : Array.isArray(item.files) ? item.files : []).length
                )
                  ? "missing_print_files"
                  : null,
              ]
                .filter(Boolean)
                .join(","),
            })),
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
      productUid: quoteItems[0].productUid,
      quantity: quoteItems[0].quantity,
      shippingAddress,
      printFiles: quoteItems[0].printFiles,
      items: quoteItems,
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
