type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function numericCost(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function hasVisiblePrintElements(elements: unknown) {
  return Array.isArray(elements) && elements.some((element) => {
    const record = asRecord(element);
    const meta = asRecord(record?.meta);
    return meta?.hidden !== true &&
      ["image", "text", "shape"].includes(String(record?.type || ""));
  });
}

export function resolveSecondPrintCharge(args: {
  attributes?: unknown;
  printPricing?: unknown;
  countryCode?: string | null;
  currency?: string | null;
  allowMarketFallback?: boolean;
}): number | null {
  const attributes = asRecord(args.attributes);
  const printPricing = asRecord(args.printPricing ?? attributes?.printPricing);
  if (!printPricing) return null;

  const countryCode = String(args.countryCode || "").trim().toUpperCase();
  const currency = String(args.currency || "EUR").trim().toUpperCase();
  const preferredMarket = countryCode ? asRecord(printPricing[countryCode]) : null;
  const fallbackMarket = args.allowMarketFallback
    ? Object.values(printPricing)
        .map(asRecord)
        .find((market) => Boolean(asRecord(market?.[currency]))) ?? null
    : null;
  const pricing = asRecord((preferredMarket ?? fallbackMarket)?.[currency]);
  const front = asRecord(pricing?.front);
  const frontBack = asRecord(pricing?.frontBack);
  const frontCost = numericCost(front?.cost);
  const frontBackCost = numericCost(frontBack?.cost);

  if (frontCost === null || frontBackCost === null) return null;
  return Math.max(0, Math.round((frontBackCost - frontCost) * 100) / 100);
}
