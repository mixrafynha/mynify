import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { resolveCountryCode } from "@/lib/gelato/country-code-map";
import { checkGelatoRegionalAvailability } from "@/lib/gelato/regional-availability";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ProductAvailabilityRequest = {
  variantId?: unknown;
  countryCode?: unknown;
};

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  const requestStartedAt = Date.now();

  try {
    const body = (await req.json().catch(() => null)) as ProductAvailabilityRequest | null;
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
