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

export type GelatoRegionalAvailabilityStatus = "available" | "unavailable" | "unknown";

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function mapAvailability(status: string | null | undefined): GelatoRegionalAvailabilityStatus {
  const normalized = String(status ?? "").trim().toLowerCase();
  switch (normalized) {
    case "available":
    case "in-stock":
      return "available";
    case "unavailable":
    case "out-of-stock":
      return "unavailable";
    case "out-of-stock-replenishable":
    case "non-stockable":
    case "not-supported":
    case "unknown":
    case "":
      return "unknown";
    default:
      return "unknown";
  }
}

export function resolveGelatoRegion(countryCode: string | null | undefined) {
  const normalized = safeText(countryCode).toUpperCase();
  return GELATO_REGION_BY_COUNTRY[normalized] ?? (normalized ? "ROW" : null);
}

export async function checkGelatoRegionalAvailability(input: {
  variantId: string;
  countryCode: string;
  resolveVariant: (variantId: string) => Promise<{ id?: string | null; product_color_id?: string | null; size?: string | null; gelato_product_uid?: string | null } | null>;
  gelatoApiKey?: string | null;
  signal?: AbortSignal;
}) {
  const variantId = safeText(input.variantId);
  const countryCode = safeText(input.countryCode).toUpperCase();
  const region = resolveGelatoRegion(countryCode);

  if (!variantId || !countryCode || !region) {
    return { status: "unknown" as const, gelatoStatus: null as string | null, region: region ?? null, reason: "invalid_input" };
  }

  const variant = await input.resolveVariant(variantId);
  if (!variant) {
    return { status: "unknown" as const, gelatoStatus: null as string | null, region, reason: "variant_not_found" };
  }

  const gelatoProductUid = safeText(variant.gelato_product_uid);
  if (!gelatoProductUid) {
    return { status: "unknown" as const, gelatoStatus: null as string | null, region, reason: "missing_gelato_product_uid" };
  }

  const gelatoApiKey = safeText(input.gelatoApiKey);
  if (!gelatoApiKey) {
    return { status: "unknown" as const, gelatoStatus: null as string | null, region, reason: "missing_gelato_api_key" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const signal = input.signal ?? controller.signal;

  try {
    const gelatoResponse = await fetch("https://product.gelatoapis.com/v3/stock/region-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": gelatoApiKey },
      body: JSON.stringify({ products: [gelatoProductUid] }),
      cache: "no-store",
      signal,
    });

    const gelatoData = await gelatoResponse.json().catch(() => null);
    if (!gelatoResponse.ok) {
      return { status: "unknown" as const, gelatoStatus: null as string | null, region, reason: "gelato_http_error" };
    }

    const productAvailability = Array.isArray(gelatoData?.productsAvailability)
      ? gelatoData.productsAvailability.find((entry: any) => safeText(entry?.productUid) === gelatoProductUid)
      : null;
    const availabilityList = Array.isArray(productAvailability?.availability)
      ? (productAvailability.availability as GelatoRegionAvailability[])
      : [];
    const regionAvailability = availabilityList.find((entry) => entry.stockRegionUid === region) || null;
    const gelatoStatus = regionAvailability?.status ?? null;
    return {
      status: mapAvailability(gelatoStatus),
      gelatoStatus,
      region,
      reason: gelatoStatus ?? null,
    };
  } finally {
    clearTimeout(timeout);
  }
}
