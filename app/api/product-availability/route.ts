import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { resolveCountryCode } from "@/lib/gelato/country-code-map";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ProductAvailabilityRequest = {
  variantId?: unknown;
  countryCode?: unknown;
};

type GelatoRegionAvailability = {
  stockRegionUid?: string;
  status?: string;
  replenishmentDate?: string | null;
};

const GELATO_REGION_BY_COUNTRY: Record<string, string> = {
  US: "US-CA",
  CA: "US-CA",
  BR: "SA",
  AR: "SA",
  BO: "SA",
  CL: "SA",
  CO: "SA",
  EC: "SA",
  GY: "SA",
  PY: "SA",
  PE: "SA",
  SR: "SA",
  UY: "SA",
  VE: "SA",
  AU: "OC",
  NZ: "OC",
  SG: "AS",
  VN: "AS",
  BN: "AS",
  KH: "AS",
  CN: "AS",
  ID: "AS",
  JP: "AS",
  LA: "AS",
  TH: "AS",
  TW: "AS",
  KR: "AS",
  MM: "AS",
  PH: "AS",
  MY: "AS",
  GB: "UK",
  PT: "EU",
  FR: "EU",
  ES: "EU",
  DE: "EU",
  IT: "EU",
  BE: "EU",
  NL: "EU",
  LU: "EU",
  AT: "EU",
  CH: "EU",
  IE: "EU",
  PL: "EU",
  CZ: "EU",
  DK: "EU",
  SE: "EU",
  NO: "EU",
  FI: "EU",
};

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function mapAvailability(status: string | undefined) {
  const normalized = String(status ?? "").trim().toLowerCase();

  switch (normalized) {
    case "available":
    case "in-stock":
      return "available" as const;
    case "unavailable":
    case "out-of-stock":
      return "unavailable" as const;
    case "out-of-stock-replenishable":
    case "non-stockable":
    case "not-supported":
    case "unknown":
    case "":
      return "unknown" as const;
    default:
      return "unknown" as const;
  }
}

function resolveGelatoRegion(countryCode: string) {
  return GELATO_REGION_BY_COUNTRY[countryCode] ?? (countryCode ? "ROW" : null);
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

    const region = resolveGelatoRegion(countryCode);
    if (!region) {
      return NextResponse.json(
        { status: "unknown", variantId, countryCode, reason: "unsupported_country_region" },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }

    const gelatoApiKey = process.env.GELATO_API_KEY?.trim();
    if (!gelatoApiKey) {
      return NextResponse.json(
        { status: "unknown", variantId, countryCode, reason: "missing_gelato_api_key" },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const gelatoResponse = await fetch("https://product.gelatoapis.com/v3/stock/region-availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": gelatoApiKey,
        },
        body: JSON.stringify({ products: [gelatoProductUid] }),
        cache: "no-store",
        signal: controller.signal,
      });

      const gelatoData = await gelatoResponse.json().catch(() => null);
      console.info("[product:regional-availability:gelato]", {
        variantId,
        gelatoProductUid,
        countryCode,
        region,
        httpStatus: gelatoResponse.status,
      });

      if (!gelatoResponse.ok) {
        return NextResponse.json(
          { status: "unknown", variantId, countryCode, reason: "gelato_http_error" },
          { status: 200, headers: { "Cache-Control": "no-store" } },
        );
      }

      const productAvailability = Array.isArray(gelatoData?.productsAvailability)
        ? gelatoData.productsAvailability.find((entry: any) => safeText(entry?.productUid) === gelatoProductUid)
        : null;
      const availabilityList = Array.isArray(productAvailability?.availability)
        ? (productAvailability.availability as GelatoRegionAvailability[])
        : [];
      const regionAvailability = availabilityList.find((entry) => entry.stockRegionUid === region) || null;
      const status = mapAvailability(regionAvailability?.status);

      console.info("[product:regional-availability:result]", {
        variantId,
        gelatoProductUid,
        countryCode,
        region,
        gelatoStatus: regionAvailability?.status ?? null,
        status,
        elapsedMs: Date.now() - requestStartedAt,
      });

      return NextResponse.json(
        {
          status,
          variantId,
          countryCode,
          reason: regionAvailability?.status ?? null,
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    } finally {
      clearTimeout(timeout);
    }
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
