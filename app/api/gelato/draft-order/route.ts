import { NextRequest, NextResponse } from "next/server";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

type GelatoFile = {
  type: string;
  url: string;
};

type GelatoOrderItem = {
  itemReferenceId: string;
  productUid: string;
  files: GelatoFile[];
  quantity: number;
  metadata?: Array<{ key: string; value: string }>;
};

type GelatoDraftOrderPayload = {
  orderType: "draft";
  orderReferenceId: string;
  customerReferenceId: string;
  currency: string;
  items: GelatoOrderItem[];
  shipmentMethodUid?: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    state?: string;
    city: string;
    postCode: string;
    country: string;
    email: string;
    phone: string;
  };
  metadata: Array<{ key: string; value: string }>;
};

type GelatoDraftOrderResult = {
  ok: boolean;
  requestUrl: string | null;
  requestPayload: JsonValue;
  responsePayload: JsonValue;
  headers: Record<string, string>;
  status: number;
  durationMs: number;
};

type ValidationIssue = {
  reference: string;
  message: string;
  code: string;
};

const DEFAULT_GELATO_BASE_URL = "https://order.gelatoapis.com";
const GELATO_ORDERS_PATH = "/v4/orders";
const MAX_METADATA_VALUE_LENGTH = 500;

function toJsonValue(value: unknown): JsonValue {
  if (value === null) return null;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value)) return value.map(toJsonValue);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        toJsonValue(entry),
      ]),
    );
  }
  return String(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && !Array.isArray(value) && typeof value === "object";
}

function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

function safeOutboundHeaders(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-API-KEY": apiKey,
  };
}

function logGelatoExchange(result: GelatoDraftOrderResult) {
  console.log(
    "=========================\nGELATO REQUEST\n=========================",
  );
  console.log(
    JSON.stringify(
      { url: result.requestUrl, payload: result.requestPayload },
      null,
      2,
    ),
  );
  console.log(
    "=========================\nGELATO RESPONSE\n=========================",
  );
  console.log(JSON.stringify(result.responsePayload, null, 2));
  console.log("=========================\nHEADERS\n=========================");
  console.log(JSON.stringify(result.headers, null, 2));
  console.log("=========================\nSTATUS\n=========================");
  console.log(result.status);
  console.log(
    "=========================\nREQUEST TIME\n=========================",
  );
  console.log(`${result.durationMs}ms`);
}

async function readGelatoResponse(response: Response): Promise<JsonValue> {
  const text = await response.text();
  if (!text) return null;

  try {
    return toJsonValue(JSON.parse(text));
  } catch {
    return text;
  }
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function stripGelatoDraftSuffix(value: string): string {
  return value.replace(/:draft\/?$/, "");
}

function getDraftOrderUrl(): string {
  const explicitUrl = process.env.GELATO_DRAFT_ORDER_URL?.trim();
  if (explicitUrl) return stripGelatoDraftSuffix(explicitUrl);

  const baseUrl = stripGelatoDraftSuffix(
    normalizeBaseUrl(
      process.env.GELATO_API_BASE_URL?.trim() || DEFAULT_GELATO_BASE_URL,
    ),
  );
  return `${baseUrl}${GELATO_ORDERS_PATH}`;
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function cleanStringFallback(value: unknown, fallback: string): string {
  return cleanString(value) ?? fallback;
}

function cleanPhone(value: unknown): string | null {
  const text = cleanString(value);
  if (!text) return null;
  return text.replace(/\s+/g, "");
}

function cleanMetadataValue(value: unknown): string {
  return cleanStringFallback(value, "").slice(0, MAX_METADATA_VALUE_LENGTH);
}

function positiveInteger(value: unknown, fallback = 1): number {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length <= 1)
    return { firstName: parts[0] || "Customer", lastName: "." };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) || ".",
  };
}

function normalizeShipmentMethod(value: unknown): string | undefined {
  const method = cleanString(value)?.toLowerCase();
  if (!method) return undefined;
  if (method === "normal" || method === "standard" || method === "express")
    return method;
  return method;
}

function isPublicFileUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return /^https:\/\//i.test(trimmed) || /^http:\/\//i.test(trimmed);
}

function normalizeFileType(value: unknown): string {
  const type = cleanString(value)?.toLowerCase() ?? "default";
  if (type === "front") return "default";
  return type;
}

function normalizeFiles(value: unknown): GelatoFile[] {
  if (!Array.isArray(value)) return [];

  return value.reduce<GelatoFile[]>((files, entry) => {
    if (!isRecord(entry) || !isPublicFileUrl(entry.url)) return files;
    const file = { type: normalizeFileType(entry.type), url: entry.url.trim() };
    const exists = files.some(
      (current) => current.type === file.type && current.url === file.url,
    );
    return exists ? files : [...files, file];
  }, []);
}

function resolveProductUid(item: Record<string, unknown>): string | null {
  return (
    cleanString(item.productUid) ??
    cleanString(item.product_uid) ??
    cleanString(item.gelatoProductUid) ??
    cleanString(item.gelato_product_uid)
  );
}

function metadataEntry(
  key: string,
  value: unknown,
): { key: string; value: string } | null {
  const cleaned = cleanMetadataValue(value);
  if (!cleaned) return null;
  return { key, value: cleaned };
}

function compactMetadata(
  entries: Array<{ key: string; value: string } | null>,
) {
  return entries.filter((entry): entry is { key: string; value: string } =>
    Boolean(entry),
  );
}

function validationResponse(
  requestPayload: JsonValue,
  issues: ValidationIssue[],
  durationMs: number,
) {
  const result: GelatoDraftOrderResult = {
    ok: false,
    requestUrl: null,
    requestPayload,
    responsePayload: {
      error: "Checkout payload is not ready for Gelato draft preview.",
      details: issues,
    },
    headers: {},
    status: 422,
    durationMs,
  };
  logGelatoExchange(result);
  return NextResponse.json(result, { status: 422 });
}

function configurationError(
  requestPayload: JsonValue,
  message: string,
  status = 500,
) {
  const result: GelatoDraftOrderResult = {
    ok: false,
    requestUrl: null,
    requestPayload,
    responsePayload: { error: message },
    headers: {},
    status,
    durationMs: 0,
  };
  logGelatoExchange(result);
  return NextResponse.json(result, { status });
}

function buildGelatoDraftPayload(rawPayload: unknown): {
  payload: GelatoDraftOrderPayload | null;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  if (!isRecord(rawPayload)) {
    return {
      payload: null,
      issues: [
        {
          reference: "body",
          message: "Request body must be a JSON object.",
          code: "invalid_body",
        },
      ],
    };
  }

  const requestedOrderType = rawPayload.orderType;
  if (requestedOrderType !== undefined && requestedOrderType !== "draft") {
    issues.push({
      reference: "orderType",
      message: "Gelato draft test only accepts orderType: draft.",
      code: "invalid_order_type",
    });
  }

  const customer = isRecord(rawPayload.customer) ? rawPayload.customer : {};
  const shipping = isRecord(rawPayload.shipping) ? rawPayload.shipping : {};
  const items = Array.isArray(rawPayload.items) ? rawPayload.items : [];

  const orderReferenceId = cleanString(rawPayload.orderReferenceId);
  const currency = cleanString(rawPayload.currency) ?? "EUR";
  const customerReferenceId =
    cleanString(rawPayload.customerReferenceId) ??
    cleanString(customer.email) ??
    orderReferenceId;

  if (!orderReferenceId) {
    issues.push({
      reference: "orderReferenceId",
      message: "Missing Ryfio orderReferenceId.",
      code: "missing_required_field",
    });
  }

  if (!customerReferenceId) {
    issues.push({
      reference: "customerReferenceId",
      message: "Missing customerReferenceId or customer email.",
      code: "missing_required_field",
    });
  }

  if (!items.length) {
    issues.push({
      reference: "items",
      message: "At least one checkout item is required.",
      code: "missing_required_field",
    });
  }

  const fullName = cleanStringFallback(customer.fullName, "Customer");
  const { firstName, lastName } = splitFullName(fullName);
  const country =
    cleanString(customer.countryIso) ?? cleanString(customer.country);
  const shippingAddress = {
    firstName,
    lastName,
    addressLine1: cleanStringFallback(customer.address, ""),
    addressLine2: cleanString(customer.apartment) ?? undefined,
    state: cleanString(customer.state) ?? undefined,
    city: cleanStringFallback(customer.city, ""),
    postCode: cleanStringFallback(customer.postalCode, ""),
    country: country ?? "",
    email: cleanStringFallback(customer.email, ""),
    phone: cleanPhone(customer.phone) ?? "",
  };

  (
    [
      ["shippingAddress.addressLine1", shippingAddress.addressLine1],
      ["shippingAddress.city", shippingAddress.city],
      ["shippingAddress.postCode", shippingAddress.postCode],
      ["shippingAddress.country", shippingAddress.country],
      ["shippingAddress.email", shippingAddress.email],
      ["shippingAddress.phone", shippingAddress.phone],
    ] as const
  ).forEach(([reference, value]) => {
    if (!value) {
      issues.push({
        reference,
        message: "This Gelato shipping address field is required.",
        code: "missing_required_field",
      });
    }
  });

  const gelatoItems = items.reduce<GelatoOrderItem[]>(
    (mappedItems, entry, index) => {
      if (!isRecord(entry)) {
        issues.push({
          reference: `items[${index}]`,
          message: "Checkout item must be an object.",
          code: "invalid_item",
        });
        return mappedItems;
      }

      const itemReferenceId = cleanString(entry.itemReferenceId);
      const productUid = resolveProductUid(entry);
      const files = normalizeFiles(entry.files ?? entry.printFiles);

      if (!itemReferenceId) {
        issues.push({
          reference: `items[${index}].itemReferenceId`,
          message: "Missing itemReferenceId.",
          code: "missing_required_field",
        });
      }

      if (!productUid) {
        issues.push({
          reference: `items[${index}].productUid`,
          message:
            "Missing Gelato productUid. SKU is not enough; save/pass the official Gelato product UID for the selected variant.",
          code: "missing_gelato_product_uid",
        });
      }

      if (!files.length) {
        issues.push({
          reference: `items[${index}].files`,
          message:
            "Missing public production print file URL. Mockup images and data:image URLs cannot be used by Gelato for preview/production.",
          code: "missing_print_file_url",
        });
      }

      if (!itemReferenceId || !productUid || !files.length) return mappedItems;

      mappedItems.push({
        itemReferenceId,
        productUid,
        files,
        quantity: positiveInteger(entry.quantity),
        metadata: compactMetadata([
          metadataEntry("cartItemId", entry.id),
          metadataEntry("productId", entry.product_id),
          metadataEntry("userProductId", entry.user_product_id),
          metadataEntry("baseProductId", entry.base_product_id),
          metadataEntry("variantId", entry.variant_id),
          metadataEntry("title", entry.title),
          metadataEntry("sku", entry.sku),
          metadataEntry("size", entry.size),
          metadataEntry("color", entry.color),
        ]),
      });

      return mappedItems;
    },
    [],
  );

  if (issues.length || !orderReferenceId || !customerReferenceId) {
    return { payload: null, issues };
  }

  return {
    payload: {
      orderType: "draft",
      orderReferenceId,
      customerReferenceId,
      currency,
      items: gelatoItems,
      shipmentMethodUid: normalizeShipmentMethod(shipping.method),
      shippingAddress,
      metadata: compactMetadata([
        metadataEntry("source", "ryfio_checkout"),
        metadataEntry("shippingMethod", shipping.method),
        metadataEntry("checkoutShippingPrice", shipping.price),
      ]),
    },
    issues,
  };
}

export async function POST(request: NextRequest) {
  const startedAt = performance.now();
  const rawPayload = await request.json().catch(() => null);
  const inboundPayload = toJsonValue(rawPayload);
  const apiKey = process.env.GELATO_API_KEY?.trim();

  if (!apiKey) {
    return configurationError(
      inboundPayload,
      "Missing GELATO_API_KEY. Configure the Gelato API key before testing.",
    );
  }

  const { payload: gelatoPayload, issues } =
    buildGelatoDraftPayload(rawPayload);
  if (!gelatoPayload || issues.length) {
    return validationResponse(
      inboundPayload,
      issues,
      Math.round(performance.now() - startedAt),
    );
  }

  const draftOrderUrl = getDraftOrderUrl();
  const gelatoResponse = await fetch(draftOrderUrl, {
    method: "POST",
    headers: safeOutboundHeaders(apiKey),
    body: JSON.stringify(gelatoPayload),
    cache: "no-store",
  });

  const responsePayload = await readGelatoResponse(gelatoResponse);
  const durationMs = Math.round(performance.now() - startedAt);
  const result: GelatoDraftOrderResult = {
    ok: gelatoResponse.ok,
    requestUrl: draftOrderUrl,
    requestPayload: toJsonValue(gelatoPayload),
    responsePayload,
    headers: headersToRecord(gelatoResponse.headers),
    status: gelatoResponse.status,
    durationMs,
  };

  logGelatoExchange(result);

  return NextResponse.json(result, {
    status: gelatoResponse.ok ? 200 : gelatoResponse.status,
  });
}
