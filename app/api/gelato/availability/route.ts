import { NextResponse } from "next/server";
import { resolveCountryCode } from "@/lib/gelato/country-code-map";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getDurableRateLimiter, getTrustedRequestIp } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_BODY_BYTES = 24 * 1024;
const MAX_ITEMS = 10;
const MAX_QUANTITY = 10;
const MAX_TEXT_LENGTH = 160;
const GELATO_TIMEOUT_MS = 15_000;
const gelatoAvailabilityRateLimiter = getDurableRateLimiter({
  namespace: "gelato-availability",
  limit: 60,
  window: "1 m",
});

type AvailabilityBody = {
  country?: string;
  countryIso?: string | null;
  items?: Array<{
    itemId?: string;
    title?: string;
    productId?: string;
    variantId?: string | null;
    color?: string | null;
    size?: string | null;
    quantity?: number;
  }>;
};

const DEFAULT_SHIPPING_METHODS = [
  { id: "standard", title: "Standard", price: 4.99, estimatedDays: "Estimated after Gelato validation" },
  { id: "express", title: "Express", price: 9.99, estimatedDays: "Estimated after Gelato validation" },
];

function cleanBaseUrl(value: string) {
  return value.replace(/\/$/, "");
}

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function boundedText(value: unknown, max = MAX_TEXT_LENGTH) {
  const text = safeText(value);
  return text.length > max ? "" : text;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUuid(value: unknown) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim())
  );
}

function rejectRateLimited() {
  return NextResponse.json({ error: "Too many availability checks" }, { status: 429 });
}

function normalizeQuantity(value: unknown) {
  const quantity = Number(value ?? 1);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) return null;
  return quantity;
}

async function readLimitedJson(req: Request) {
  const contentLength = req.headers.get("content-length");
  const declaredLength = contentLength ? Number(contentLength) : null;

  if (declaredLength !== null && Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return null;
  }

  if (!req.body) return {};

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    received += value.byteLength;
    if (received > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => undefined);
      return null;
    }

    chunks.push(value);
  }

  try {
    return JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)) || "{}") as unknown;
  } catch {
    return null;
  }
}

async function resolveVariantProductUid(variantId: string) {
  const supabase = await createSupabaseServer();
  const { data: variant, error: variantError } = await supabase
    .from("product_variants")
    .select("id, product_color_id, gelato_product_uid")
    .eq("id", variantId)
    .maybeSingle();

  if (variantError || !variant?.product_color_id) return null;

  const { data: color, error: colorError } = await supabase
    .from("product_colors")
    .select("id, product_id")
    .eq("id", variant.product_color_id)
    .maybeSingle();

  if (colorError || !color?.product_id) return null;

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, is_active")
    .eq("id", color.product_id)
    .maybeSingle();

  if (productError || !product?.is_active) return null;

  return {
    productId: product.id as string,
    productUid: safeText(variant.gelato_product_uid),
  };
}

async function resolveActiveProduct(productId: string) {
  const supabase = await createSupabaseServer();
  const { data: product, error } = await supabase
    .from("products")
    .select("id, is_active")
    .eq("id", productId)
    .maybeSingle();

  if (error || !product?.is_active) return null;
  return product.id as string;
}

async function normalizeRequestBody(raw: unknown) {
  if (!isRecord(raw)) return null;

  const country = boundedText(raw.country);
  const countryIso = resolveCountryCode(raw.countryIso) ?? resolveCountryCode(country);
  const rawItems = Array.isArray(raw.items) ? raw.items : [];

  if (!country || !countryIso || !rawItems.length || rawItems.length > MAX_ITEMS) {
    return null;
  }

  const items: NonNullable<AvailabilityBody["items"]> = [];

  for (const rawItem of rawItems) {
    if (!isRecord(rawItem)) return null;

    const itemId = boundedText(rawItem.itemId);
    const title = boundedText(rawItem.title);
    const productId = boundedText(rawItem.productId);
    const variantId = rawItem.variantId === null || rawItem.variantId === undefined ? null : boundedText(rawItem.variantId);
    const color = rawItem.color === null || rawItem.color === undefined ? null : boundedText(rawItem.color);
    const size = rawItem.size === null || rawItem.size === undefined ? null : boundedText(rawItem.size);
    const quantity = normalizeQuantity(rawItem.quantity);

    if (rawItem.productId !== undefined && (!productId || !isUuid(productId))) return null;
    if (rawItem.variantId !== undefined && rawItem.variantId !== null && (!variantId || !isUuid(variantId))) {
      return null;
    }
    if (quantity === null) return null;

    let resolvedProductId = productId;

    if (variantId) {
      const resolved = await resolveVariantProductUid(variantId);
      if (!resolved?.productUid) return null;
      resolvedProductId = resolved.productId;
      if (productId && productId !== resolved.productId) return null;
    } else if (productId) {
      const resolvedProduct = await resolveActiveProduct(productId);
      if (!resolvedProduct) return null;
      resolvedProductId = resolvedProduct;
    }

    items.push({
      ...(itemId ? { itemId } : {}),
      ...(title ? { title } : {}),
      ...(resolvedProductId ? { productId: resolvedProductId } : {}),
      variantId,
      color,
      size,
      quantity,
    });
  }

  return { country, countryIso, items } satisfies AvailabilityBody;
}

function normalizeAvailabilityResponse(data: any, body: AvailabilityBody) {
  const unavailableItems = Array.isArray(data?.unavailableItems)
    ? data.unavailableItems
    : Array.isArray(data?.items)
      ? data.items.filter((item: any) => item?.available === false)
      : [];

  const shippingMethods = Array.isArray(data?.shippingMethods)
    ? data.shippingMethods.map((method: any) => ({
        id: String(method.id ?? method.code ?? method.name ?? "standard"),
        title: String(method.title ?? method.name ?? method.id ?? "Shipping"),
        price: typeof method.price === "number" ? method.price : typeof method.amount === "number" ? method.amount : null,
        estimatedDays: method.estimatedDays ?? method.eta ?? method.deliveryTime ?? null,
      }))
    : DEFAULT_SHIPPING_METHODS;

  return {
    configured: true,
    available: data?.available !== false && unavailableItems.length === 0,
    country: data?.country ?? body.country ?? null,
    countryIso: data?.countryIso ?? body.countryIso ?? null,
    shippingMethods,
    unavailableItems,
    message: data?.message ?? null,
  };
}

export async function POST(req: Request) {
  try {
    const rateLimitKey = getTrustedRequestIp(req);
    try {
      const rateLimit = await gelatoAvailabilityRateLimiter.limit(rateLimitKey);
      if (!rateLimit.success) return rejectRateLimited();
    } catch (error) {
      console.error("[gelato-availability:rate-limit-error]", {
        message: error instanceof Error ? error.message : String(error),
      });
    }

    const rawBody = await readLimitedJson(req);
    const body = await normalizeRequestBody(rawBody);

    if (!body) {
      return NextResponse.json({ error: "Invalid availability request" }, { status: 400 });
    }

    const country = body.country;
    const items = body.items ?? [];
    const customAvailabilityUrl = process.env.GELATO_AVAILABILITY_URL?.trim();
    const gelatoApiKey = process.env.GELATO_API_KEY?.trim();

    if (customAvailabilityUrl) {
      const res = await fetch(customAvailabilityUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(gelatoApiKey ? { Authorization: `Bearer ${gelatoApiKey}` } : {}),
        },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(GELATO_TIMEOUT_MS),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        return NextResponse.json(
          {
            configured: true,
            available: false,
            country,
            countryIso: body.countryIso ?? null,
            shippingMethods: [],
            unavailableItems: items.map((item) => ({
              itemId: item.itemId,
              title: item.title,
              productId: item.productId,
              variantId: item.variantId,
              color: item.color,
              size: item.size,
              quantity: item.quantity ?? 1,
              available: false,
              reason: data?.error || "Gelato availability check failed",
            })),
            message: data?.error || "Gelato availability check failed",
          },
          { status: 200, headers: { "Cache-Control": "no-store" } },
        );
      }

      return NextResponse.json(normalizeAvailabilityResponse(data, body), {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const gelatoBaseUrl = process.env.GELATO_API_BASE_URL?.trim();

    if (gelatoApiKey && gelatoBaseUrl) {
      const res = await fetch(`${cleanBaseUrl(gelatoBaseUrl)}/availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${gelatoApiKey}`,
        },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(GELATO_TIMEOUT_MS),
      });

      const data = await res.json().catch(() => null);
      if (res.ok) {
        return NextResponse.json(normalizeAvailabilityResponse(data, body), {
          status: 200,
          headers: { "Cache-Control": "no-store" },
        });
      }
    }

    // Development-safe fallback.
    // Do not block checkout while the real Gelato product availability endpoint is not connected yet.
    // The frontend receives a valid availability response with no warning message.
    return NextResponse.json(
      {
        configured: false,
        available: true,
        country,
        countryIso: body.countryIso ?? null,
        shippingMethods: DEFAULT_SHIPPING_METHODS,
        unavailableItems: [],
        message: null,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Availability check failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
