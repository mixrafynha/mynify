type GelatoCheckoutPrintFile = {
  type: string;
  url: string;
};

export type GelatoCheckoutQuoteInput = {
  productUid: string;
  quantity: number;
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
  printFiles: GelatoCheckoutPrintFile[];
  items?: Array<{
    productUid: string;
    quantity: number;
    printFiles: GelatoCheckoutPrintFile[];
  }>;
  currencyIsoCode?: string;
  customerReferenceId?: string;
  orderReferenceId?: string;
};

export type NormalizedGelatoQuote = {
  available: boolean;
  retryable: boolean;
  productCost: number | null;
  productCurrency: string | null;
  shippingOptions: Array<{
    id: string;
    name: string;
    price: number;
    currency: string;
    fulfillmentCountry: string | null;
    estimatedDeliveryMin: string | null;
    estimatedDeliveryMax: string | null;
    promiseUid: string | null;
    serviceType: string | null;
  }>;
  reason:
    | null
    | "no_shipping_options"
    | "product_not_supported"
    | "invalid_address"
    | "temporary_gelato_error"
    | "invalid_quote_response";
};

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const GELATO_QUOTE_URL = "https://api.gelato.com/v2/quote";
const TEMPORARY_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524]);

function cleanString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeCountryCode(value: unknown): string | null {
  const code = cleanString(value)?.toUpperCase() ?? null;
  return code && /^[A-Z]{2}$/.test(code) ? code : null;
}

function normalizeCurrency(value: unknown): string | null {
  const currency = cleanString(value)?.toUpperCase() ?? null;
  return currency && /^[A-Z]{3}$/.test(currency) ? currency : null;
}

function normalizeNumber(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeDate(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toJsonValue(value: unknown): JsonValue {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map(toJsonValue);
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, toJsonValue(entry)]));
  }
  return String(value);
}

function isTemporaryStatus(status: number): boolean {
  return TEMPORARY_STATUS_CODES.has(status);
}

async function readGelatoJson(response: Response): Promise<JsonValue | null> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return toJsonValue(JSON.parse(text));
  } catch {
    return text as unknown as JsonValue;
  }
}

function getQuoteUrl(): string {
  return process.env.GELATO_QUOTE_URL?.trim() || GELATO_QUOTE_URL;
}

function normalizeQuoteResponse(raw: unknown): NormalizedGelatoQuote {
  if (!raw || typeof raw !== "object") {
    return {
      available: false,
      retryable: false,
      productCost: null,
      productCurrency: null,
      shippingOptions: [],
      reason: "invalid_quote_response",
    };
  }

  const record = raw as Record<string, unknown>;
  const production = record.production && typeof record.production === "object" ? (record.production as Record<string, unknown>) : null;
  const shipments = Array.isArray(production?.shipments) ? production?.shipments as Record<string, unknown>[] : [];

  const shippingOptions = shipments
    .map((shipment) => {
      const price = normalizeNumber(shipment.price);
      const currency = normalizeCurrency(shipment.currency) ?? null;
      const fulfillmentCountry = normalizeCountryCode(shipment.fulfillmentCountry ?? production?.productionCountry ?? null);
      const id = cleanString(shipment.promiseUid) ?? cleanString(shipment.uid) ?? cleanString(shipment.name) ?? "";
      const name = cleanString(shipment.name) ?? cleanString(shipment.uid) ?? id;
      return {
        id,
        name,
        price: price ?? 0,
        currency: currency ?? "",
        fulfillmentCountry,
        estimatedDeliveryMin: normalizeDate(shipment.minDeliveryDate),
        estimatedDeliveryMax: normalizeDate(shipment.maxDeliveryDate),
        promiseUid: cleanString(shipment.promiseUid),
        serviceType: cleanString(shipment.serviceType)?.toLowerCase() ?? null,
      };
    })
    .filter((option) => Boolean(option.id) && Number.isFinite(option.price) && option.price > 0 && Boolean(option.currency));

  return {
    available: shippingOptions.length > 0,
    retryable: false,
    productCost: null,
    productCurrency: normalizeCurrency(record.currencyIsoCode ?? record.currency ?? null),
    shippingOptions,
    reason:
      shippingOptions.length > 0
        ? null
        : "no_shipping_options",
  };
}

function classifyQuoteFailure(status: number, payload: JsonValue | null): NormalizedGelatoQuote {
  const message = typeof payload === "string" ? payload.toLowerCase() : "";
  const payloadText = JSON.stringify(payload ?? {}).toLowerCase();
  const isRetryable = isTemporaryStatus(status);

  if (isRetryable) {
    return {
      available: false,
      retryable: true,
      productCost: null,
      productCurrency: null,
      shippingOptions: [],
      reason: "temporary_gelato_error",
    };
  }

  if (message.includes("invalid") || payloadText.includes("invalid") || payloadText.includes("postcode") || payloadText.includes("address")) {
    return {
      available: false,
      retryable: false,
      productCost: null,
      productCurrency: null,
      shippingOptions: [],
      reason: "invalid_address",
    };
  }

  if (payloadText.includes("not supported") || payloadText.includes("unsupported") || payloadText.includes("cannot be produced")) {
    return {
      available: false,
      retryable: false,
      productCost: null,
      productCurrency: null,
      shippingOptions: [],
      reason: "product_not_supported",
    };
  }

  return {
    available: false,
    retryable: false,
    productCost: null,
    productCurrency: null,
    shippingOptions: [],
    reason: "invalid_quote_response",
  };
}

export async function getGelatoCheckoutQuote(
  input: GelatoCheckoutQuoteInput,
): Promise<NormalizedGelatoQuote> {
  const apiKey = process.env.GELATO_API_KEY?.trim();
  if (!apiKey) {
    return {
      available: false,
      retryable: false,
      productCost: null,
      productCurrency: null,
      shippingOptions: [],
      reason: "temporary_gelato_error",
    };
  }

  const payload = {
    order: {
      orderReferenceId: input.orderReferenceId || `ryfio-quote-${Date.now()}`,
      customerReferenceId: input.customerReferenceId || input.shippingAddress.email || input.orderReferenceId || `ryfio-quote-${Date.now()}`,
      currencyIsoCode: normalizeCurrency(input.currencyIsoCode) ?? "EUR",
    },
    recipient: {
      countryIsoCode: normalizeCountryCode(input.shippingAddress.countryCode) ?? input.shippingAddress.countryCode.trim().toUpperCase(),
      firstName: cleanString(input.shippingAddress.firstName) ?? "Customer",
      lastName: cleanString(input.shippingAddress.lastName) ?? ".",
      addressLine1: input.shippingAddress.addressLine1.trim(),
      ...(input.shippingAddress.addressLine2 ? { addressLine2: input.shippingAddress.addressLine2.trim() } : {}),
      ...(input.shippingAddress.state ? { stateCode: input.shippingAddress.state.trim().toUpperCase() } : {}),
      city: input.shippingAddress.city.trim(),
      postcode: input.shippingAddress.postalCode.trim(),
      ...(input.shippingAddress.email ? { email: input.shippingAddress.email.trim() } : {}),
      ...(input.shippingAddress.phone ? { phone: input.shippingAddress.phone.trim() } : {}),
    },
    products:
      input.items?.length
        ? input.items.map((item, index) => ({
            itemReferenceId: `ryfio-${index}-${item.productUid}`,
            productUid: item.productUid,
            pdfUrl: item.printFiles[0]?.url ?? "",
            quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
          }))
        : input.printFiles.length
          ? [
              {
                itemReferenceId: `ryfio-${input.productUid}`,
                productUid: input.productUid,
                pdfUrl: input.printFiles[0].url,
                quantity: Math.max(1, Math.floor(Number(input.quantity) || 1)),
              },
            ]
          : [],
  };

  try {
    const response = await fetch(getQuoteUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const raw = await readGelatoJson(response);

    if (!response.ok) {
      return classifyQuoteFailure(response.status, raw);
    }

    return normalizeQuoteResponse(raw);
  } catch {
    return {
      available: false,
      retryable: true,
      productCost: null,
      productCurrency: null,
      shippingOptions: [],
      reason: "temporary_gelato_error",
    };
  }
}
