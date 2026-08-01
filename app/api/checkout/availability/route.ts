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

    if (!country && !countryIso) {
      return NextResponse.json({
        configured: false,
        available: false,
        country,
        countryIso,
        shippingMethods: [],
        unavailableItems: [],
        loading: false,
        message: "Select a delivery country to calculate shipping.",
      });
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

    if (!quoteItems.length) {
      return NextResponse.json({
        configured: false,
        available: true,
        country,
        countryIso: resolvedCountryIso ?? countryIso ?? null,
        shippingMethods: [],
        unavailableItems: [],
        message: "Complete your shipping address to see available delivery methods.",
      });
    }

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

    if (quote.retryable) {
      return NextResponse.json(
        {
          configured: true,
        available: false,
        retryable: true,
        country,
        countryIso: resolvedCountryIso ?? countryIso ?? null,
        shippingMethods: [],
        unavailableItems: [],
        message: "We couldn't calculate shipping. Check the address and try again.",
      },
      { status: 503 },
    );
  }

    if (!quote.available) {
      return NextResponse.json({
        configured: true,
        available: false,
        retryable: false,
        country,
        countryIso: resolvedCountryIso ?? countryIso ?? null,
        shippingMethods: [],
        unavailableItems: items.map((item) => ({
          itemId: item.itemId || item.productId || crypto.randomUUID(),
          title: item.title || "Product",
          productId: item.productId || "",
          variantId: item.variantId ?? null,
          color: item.color ?? null,
          size: item.size ?? null,
          quantity: normalizeQuantity(item.quantity),
          available: false,
          reason: quote.reason || "No shipping options available.",
        })),
        message: quote.reason === "no_shipping_options"
          ? "This product cannot be delivered to the selected country."
          : "This product cannot be delivered to the selected country.",
      });
    }

    return NextResponse.json({
      configured: true,
      available: true,
      retryable: false,
      country,
      countryIso: resolvedCountryIso ?? countryIso ?? null,
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
      unavailableItems: [],
      message: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        configured: true,
        available: false,
        retryable: true,
        country: null,
        countryIso: null,
        shippingMethods: [],
        unavailableItems: [],
        message: error instanceof Error ? error.message : "Shipping could not be calculated.",
      },
      { status: 503 },
    );
  }
}
