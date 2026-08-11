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

export type GelatoCheckoutQuotePayload = {
  order: {
    orderReferenceId: string;
    customerReferenceId: string;
    currencyIsoCode: string;
  };
  recipient: {
    countryIsoCode: string;
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    stateCode?: string;
    city: string;
    postcode: string;
    email?: string;
    phone?: string;
  };
  products: Array<{
    itemReferenceId: string;
    productUid: string;
    pdfUrl: string;
    quantity: number;
  }>;
};

export type NormalizedGelatoQuote = {
  available: boolean;
  retryable: boolean;
  productCost: number | null;
  productCurrency: string | null;
  shippingOptions: Array<{
    id: string;
    name: string;
    price: number | null;
    currency: string;
    fulfillmentCountry: string | null;
    estimatedDaysMin: number | null;
    estimatedDaysMax: number | null;
    estimatedDeliveryMin: string | null;
    estimatedDeliveryMax: string | null;
    promiseUid: string | null;
    carrierUid: string | null;
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

export type ResolvedGelatoCheckoutQuote = NormalizedGelatoQuote & {
  rawQuote: unknown;
  responseKeys: string[];
  quoteReason: string | null;
  httpStatus: number | null;
  contentType: string | null;
  bodyLength: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  requestId: string | null;
  details: unknown;
};

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const GELATO_QUOTE_URL = "https://api.gelato.com/v2/quote";
const TEMPORARY_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524]);
const GELATO_QUOTE_TIMEOUT_MS = 15_000;

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
  if (value === null || value === undefined || value === "") return null;
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

function getQuoteUrl(): string {
  return process.env.GELATO_QUOTE_URL?.trim() || GELATO_QUOTE_URL;
}

export function buildGelatoCheckoutQuotePayload(input: GelatoCheckoutQuoteInput): GelatoCheckoutQuotePayload {
  return {
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
}

function safeJsonString(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function logLine(prefix: string, payload: unknown) {
  if (process.env.NODE_ENV === "production") return;
  const serialized = safeJsonString(payload);
  console.log(`${prefix} ${serialized ?? "\"[unserializable]\""}`);
}

function normalizeQuoteResponse(raw: unknown, quoteCurrency: string): ResolvedGelatoCheckoutQuote {
  if (!raw || typeof raw !== "object") {
    return {
      available: false,
      retryable: false,
      productCost: null,
      productCurrency: null,
      shippingOptions: [],
      reason: "invalid_quote_response",
      rawQuote: raw ?? null,
      responseKeys: [],
      quoteReason: "invalid_quote_response",
      httpStatus: null,
      contentType: null,
      bodyLength: null,
      errorCode: null,
      errorMessage: null,
      requestId: null,
      details: null,
    };
  }

  const record = raw as Record<string, unknown>;
  const production = record.production && typeof record.production === "object" ? (record.production as Record<string, unknown>) : null;
  const shipments = Array.isArray(production?.shipments) ? (production.shipments as Record<string, unknown>[]) : [];
  const responseKeys = Object.keys(record);
  const currency = normalizeCurrency(quoteCurrency);
  if (currency !== "EUR") {
    throw new Error("Invalid checkout quote currency");
  }

  const shippingOptions = shipments
    .map((shipment) => {
      const price = normalizeNumber(shipment.price);
      console.info("[gelato:quote:shipment-price-original]", {
        uid: cleanString(shipment.uid) ?? null,
        promiseUidPresent: Boolean(cleanString(shipment.promiseUid)),
        name: cleanString(shipment.name) ?? null,
        originalPrice: shipment.price ?? null,
        originalPriceType: shipment.price === null ? "null" : typeof shipment.price,
        normalizedPrice: price,
      });
      const shipmentCurrency = currency;
      const fulfillmentCountry = normalizeCountryCode(shipment.fulfillmentCountry ?? production?.productionCountry ?? null);
      const id = cleanString(shipment.promiseUid) ?? cleanString(shipment.uid) ?? cleanString(shipment.name) ?? "";
      const name = cleanString(shipment.name) ?? cleanString(shipment.uid) ?? id;
      return {
        id,
        name,
        price,
        currency: shipmentCurrency,
        fulfillmentCountry,
        estimatedDaysMin: Number.isFinite(Number(shipment.minDeliveryDays)) ? Number(shipment.minDeliveryDays) : null,
        estimatedDaysMax: Number.isFinite(Number(shipment.maxDeliveryDays)) ? Number(shipment.maxDeliveryDays) : null,
        estimatedDeliveryMin: normalizeDate(shipment.minDeliveryDate),
        estimatedDeliveryMax: normalizeDate(shipment.maxDeliveryDate),
        promiseUid: cleanString(shipment.promiseUid),
        carrierUid: cleanString(shipment.uid),
        serviceType: cleanString(shipment.serviceType)?.toLowerCase() ?? null,
      };
    })
    .filter((option) => Boolean(option.id) && Boolean(option.currency));

  return {
    available: shippingOptions.some((option) => option.price !== null && Number.isFinite(option.price) && option.price >= 0),
    retryable: false,
    productCost: null,
    productCurrency: currency,
    shippingOptions,
    reason: shippingOptions.some((option) => option.price !== null && Number.isFinite(option.price) && option.price >= 0) ? null : "invalid_quote_response",
    rawQuote: raw,
    responseKeys,
    quoteReason: shippingOptions.some((option) => option.price !== null && Number.isFinite(option.price) && option.price >= 0) ? null : "invalid_quote_response",
    httpStatus: null,
    contentType: null,
    bodyLength: null,
    errorCode: null,
    errorMessage: null,
    requestId: null,
    details: null,
  };
}

function classifyQuoteFailure(status: number, payload: JsonValue | null): ResolvedGelatoCheckoutQuote {
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
      rawQuote: payload,
      responseKeys: [],
      quoteReason: "temporary_gelato_error",
      httpStatus: null,
      contentType: null,
      bodyLength: null,
      errorCode: null,
      errorMessage: null,
      requestId: null,
      details: null,
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
      rawQuote: payload,
      responseKeys: [],
      quoteReason: "invalid_address",
      httpStatus: null,
      contentType: null,
      bodyLength: null,
      errorCode: null,
      errorMessage: null,
      requestId: null,
      details: null,
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
      rawQuote: payload,
      responseKeys: [],
      quoteReason: "product_not_supported",
      httpStatus: null,
      contentType: null,
      bodyLength: null,
      errorCode: null,
      errorMessage: null,
      requestId: null,
      details: null,
    };
  }

  return {
    available: false,
    retryable: false,
    productCost: null,
    productCurrency: null,
    shippingOptions: [],
    reason: "invalid_quote_response",
    rawQuote: payload,
    responseKeys: [],
    quoteReason: "invalid_quote_response",
    httpStatus: null,
    contentType: null,
    bodyLength: null,
    errorCode: null,
    errorMessage: null,
    requestId: null,
    details: null,
  };
}

function classifyGelatoHttpFailure(status: number): {
  ok: boolean;
  retryable: boolean;
  code: string;
  reason: NormalizedGelatoQuote["reason"];
} {
  if (status === 401 || status === 403) {
    return {
      ok: false,
      retryable: false,
      code: "GELATO_QUOTE_REJECTED",
      reason: "invalid_quote_response",
    };
  }

  if (status === 404) {
    return {
      ok: false,
      retryable: false,
      code: "GELATO_QUOTE_REJECTED",
      reason: "invalid_quote_response",
    };
  }

  if (status === 429 || (status >= 500 && status <= 504) || isTemporaryStatus(status)) {
    return {
      ok: false,
      retryable: true,
      code: "GELATO_TEMPORARILY_UNAVAILABLE",
      reason: "temporary_gelato_error",
    };
  }

  return {
    ok: false,
    retryable: false,
    code: "GELATO_QUOTE_REJECTED",
    reason: "invalid_quote_response",
  };
}

export async function resolveCheckoutQuote(
  input: GelatoCheckoutQuoteInput,
): Promise<ResolvedGelatoCheckoutQuote> {
  const apiKey = process.env.GELATO_API_KEY?.trim();
  if (!apiKey) {
    return {
      available: false,
      retryable: false,
      productCost: null,
      productCurrency: null,
      shippingOptions: [],
      reason: "temporary_gelato_error",
      rawQuote: null,
      responseKeys: [],
      quoteReason: "temporary_gelato_error",
      httpStatus: null,
      contentType: null,
      bodyLength: null,
      errorCode: null,
      errorMessage: null,
      requestId: null,
      details: null,
    };
  }

  const payload = buildGelatoCheckoutQuotePayload(input);
  const requestedCurrency = normalizeCurrency(payload.order.currencyIsoCode);
  if (requestedCurrency !== "EUR") {
    throw new Error("Invalid checkout quote currency");
  }

  const url = new URL(getQuoteUrl());
  const startedAt = Date.now();
  const endpointDetails = {
    host: url.host,
    path: url.pathname,
    method: "POST",
    itemsCount: input.items?.length ?? (input.printFiles.length > 0 ? 1 : 0),
    countryCode: normalizeCountryCode(input.shippingAddress.countryCode) ?? input.shippingAddress.countryCode.trim().toUpperCase(),
    postalCodePresent: Boolean(input.shippingAddress.postalCode?.trim()),
    printFilesCount: input.items?.reduce((count, item) => count + (item.printFiles?.length ?? 0), 0) ?? input.printFiles.length,
  };

  logLine("[GELATO_QUOTE_CALL_START]", {
    ...endpointDetails,
    startedAt: new Date(startedAt).toISOString(),
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error("GELATO_QUOTE_TIMEOUT")), GELATO_QUOTE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });

    const rawText = await response.text();
    const contentType = response.headers.get("content-type");
    const rawPreview = rawText.slice(0, 500);
    let rawJson: JsonValue | null = null;
    let jsonParseFailed = false;

    if (rawText.trim()) {
      try {
        rawJson = toJsonValue(JSON.parse(rawText));
      } catch {
        jsonParseFailed = true;
      }
    }

    logLine("[GELATO_QUOTE_HTTP_RESPONSE]", {
      httpStatus: response.status,
      ok: response.ok,
      durationMs: Date.now() - startedAt,
      contentType,
      bodyLength: rawText.length,
      bodyPreview: rawPreview,
    });

    if (jsonParseFailed) {
      logLine("[GELATO_QUOTE_JSON_PARSE_ERROR]", {
        httpStatus: response.status,
        bodyPreview: rawPreview,
      });
    }

    if (!response.ok) {
      const classification = classifyGelatoHttpFailure(response.status);
      const errorObject = rawJson && typeof rawJson === "object" ? (rawJson as Record<string, unknown>) : null;
      return {
        available: false,
        retryable: classification.retryable,
        productCost: null,
        productCurrency: null,
        shippingOptions: [],
        reason: classification.reason,
        rawQuote: rawJson,
        responseKeys: rawJson && typeof rawJson === "object" ? Object.keys(rawJson as Record<string, unknown>) : [],
        quoteReason: classification.reason,
        httpStatus: response.status,
        contentType,
        bodyLength: rawText.length,
        errorCode: typeof errorObject?.code === "string" ? errorObject.code : null,
        errorMessage: typeof errorObject?.message === "string" ? errorObject.message : null,
        requestId: typeof errorObject?.requestId === "string" ? errorObject.requestId : null,
        details: errorObject?.details ?? null,
      };
    }

    const normalized = normalizeQuoteResponse(rawJson, requestedCurrency);

    logLine("[GELATO_QUOTE_CALL_END]", {
      httpStatus: response.status,
      shippingMethodsCount: normalized.shippingOptions.length,
      available: normalized.available,
      retryable: normalized.retryable,
      reason: normalized.reason,
      durationMs: Date.now() - startedAt,
    });

    return normalized;
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      (error.name === "AbortError" || error.message.includes("GELATO_QUOTE_TIMEOUT"));
    const errorDetails = {
      durationMs: Date.now() - startedAt,
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      cause:
        error instanceof Error && "cause" in error && error.cause
          ? String(error.cause)
          : null,
      stack: error instanceof Error ? error.stack?.split("\n").slice(0, 4).join("\n") ?? null : null,
      signalAborted: controller.signal.aborted,
      abortReason: controller.signal.reason instanceof Error ? controller.signal.reason.message : controller.signal.reason ?? null,
      timeout: isTimeout,
    };

    console.error("[GELATO_QUOTE_CALL_ERROR]", errorDetails);
    logLine("[GELATO_QUOTE_CALL_ERROR]", errorDetails);

    return {
      available: false,
      retryable: true,
      productCost: null,
      productCurrency: null,
      shippingOptions: [],
      reason: isTimeout ? "temporary_gelato_error" : "temporary_gelato_error",
      rawQuote: null,
      responseKeys: [],
      quoteReason: "temporary_gelato_error",
      httpStatus: null,
      contentType: null,
      bodyLength: null,
      errorCode: null,
      errorMessage: null,
      requestId: null,
      details: null,
    };
  } finally {
    clearTimeout(timeoutId);
    logLine("[GELATO_QUOTE_CALL_FINALLY]", {
      durationMs: Date.now() - startedAt,
    });
  }
}

export async function getGelatoCheckoutQuote(
  input: GelatoCheckoutQuoteInput,
): Promise<NormalizedGelatoQuote> {
  return resolveCheckoutQuote(input);
}
