import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { resolveCountryCode } from "@/lib/gelato/country-code-map";
import { checkGelatoRegionalAvailability } from "@/lib/gelato/regional-availability";
import { getDurableRateLimiter, getTrustedRequestIp } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_BODY_BYTES = 8 * 1024;
const productAvailabilityRateLimiter = getDurableRateLimiter({
  namespace: "product-availability",
  limit: 120,
  window: "1 m",
});

type ProductAvailabilityRequest = {
  variantId?: unknown;
  countryCode?: unknown;
};

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function rejectRateLimited() {
  return NextResponse.json(
    { status: "unknown", variantId: null, countryCode: null, reason: "rate_limited" },
    { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "10" } },
  );
}

function rejectRateLimitUnavailable() {
  return NextResponse.json(
    { status: "unknown", variantId: null, countryCode: null, reason: "RATE_LIMIT_UNAVAILABLE" },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  const requestStartedAt = Date.now();

  try {
    const rateLimitKey = getTrustedRequestIp(req);
    try {
      const rateLimit = await productAvailabilityRateLimiter.limit(rateLimitKey);
      if (!rateLimit.success) return rejectRateLimited();
    } catch (error) {
      console.error("[product-availability:rate-limit-error]", {
        message: error instanceof Error ? error.message : String(error),
      });
      return rejectRateLimitUnavailable();
    }

    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { status: "unknown", variantId: null, countryCode: null, reason: "request_too_large" },
        { status: 413, headers: { "Cache-Control": "no-store" } },
      );
    }

    const rawBody = await req.text().catch(() => "");
    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return NextResponse.json(
        { status: "unknown", variantId: null, countryCode: null, reason: "request_too_large" },
        { status: 413, headers: { "Cache-Control": "no-store" } },
      );
    }

    let body: ProductAvailabilityRequest | null = null;
    try {
      body = (JSON.parse(rawBody || "null") as ProductAvailabilityRequest | null) ?? null;
    } catch {
      return NextResponse.json(
        { status: "unknown", variantId: null, countryCode: null, reason: "invalid_body" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    const variantId = safeText(body?.variantId);
    const countryCode = resolveCountryCode(body?.countryCode);

    console.info("[product:availability:request]", {
      variantId: variantId || null,
      countryCode,
    });

    if (!variantId) {
      return NextResponse.json(
        { status: "unknown", variantId: null, countryCode: countryCode ?? null, reason: "missing_variant_id" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!countryCode) {
      return NextResponse.json(
        { status: "unknown", variantId, countryCode: null, reason: "invalid_country_code" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const supabase = await createSupabaseServer();
    const { data: variant, error: variantError } = await supabase
      .from("product_variants")
      .select("id, product_color_id, size, gelato_product_uid")
      .eq("id", variantId)
      .maybeSingle();

    console.info("[product:regional-availability:resolved-variant]", {
      variantId,
      productColorId: variant?.product_color_id ?? null,
      size: variant?.size ?? null,
      hasGelatoProductUid: Boolean(variant?.gelato_product_uid),
    });

    if (variantError || !variant) {
      return NextResponse.json(
        { status: "unknown", variantId, countryCode, reason: "variant_not_found" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    const gelatoProductUid = safeText(variant.gelato_product_uid);
    if (!gelatoProductUid) {
      return NextResponse.json(
        { status: "unknown", variantId, countryCode, reason: "missing_gelato_product_uid" },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }

    const availability = await checkGelatoRegionalAvailability({
      variantId,
      countryCode,
      gelatoApiKey: process.env.GELATO_API_KEY?.trim() ?? null,
      resolveVariant: async (resolvedVariantId) => {
        const { data: variant, error: variantError } = await supabase
          .from("product_variants")
          .select("id, product_color_id, size, gelato_product_uid")
          .eq("id", resolvedVariantId)
          .maybeSingle();

        console.info("[product:regional-availability:resolved-variant]", {
          variantId: resolvedVariantId,
          productColorId: variant?.product_color_id ?? null,
          size: variant?.size ?? null,
          hasGelatoProductUid: Boolean(variant?.gelato_product_uid),
        });

        if (variantError || !variant) return null;
        return variant;
      },
    });

    console.info("[product:regional-availability:result]", {
      variantId,
      countryCode,
      region: availability.region,
      gelatoStatus: availability.gelatoStatus,
      status: availability.status,
      elapsedMs: Date.now() - requestStartedAt,
    });

    return NextResponse.json(
      {
        status: availability.status,
        variantId,
        countryCode,
        reason: availability.reason,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[product:regional-availability:error]", {
      message: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { status: "unknown", variantId: null, countryCode: null, reason: "unexpected_error" },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
}
