export type NormalizedShippingMethod = {
  id: string;
  code: string | null;
  shipmentMethodUid?: string | null;
  name: string;
  price: number;
  currency: string;
  minDays: number | null;
  maxDays: number | null;
  raw: unknown;
};

function cleanString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeId(method: Record<string, any>) {
  const name = cleanString(method.name) ?? cleanString(method.title) ?? "Shipping";
  const price = toNumber(method.price) ?? 0;
  const minDays = toNumber(method.minDays ?? method.estimatedDaysMin ?? method.estimatedDaysMinimum);
  const maxDays = toNumber(method.maxDays ?? method.estimatedDaysMax ?? method.estimatedDaysMaximum);
  return (
    cleanString(method.shipmentMethodUid) ??
    cleanString(method.uid) ??
    cleanString(method.id) ??
    cleanString(method.code) ??
    cleanString(method.type) ??
    `${name}:${price}:${minDays ?? "x"}:${maxDays ?? "x"}`
  );
}

export function normalizeShippingMethods(response: unknown): NormalizedShippingMethod[] {
  const methods = Array.isArray(response)
    ? response
    : response && typeof response === "object"
      ? (response as Record<string, any>).shippingMethods ?? (response as Record<string, any>).shippingOptions ?? []
      : [];

  const normalized = (Array.isArray(methods) ? methods : [])
    .filter((method) => method && typeof method === "object")
    .map((method) => {
      const record = method as Record<string, any>;
      const name = cleanString(record.name) ?? cleanString(record.title) ?? "Shipping";
      const price = toNumber(record.price) ?? Number.POSITIVE_INFINITY;
      const currency = (cleanString(record.currency) ?? "EUR").toUpperCase();
      const minDays = toNumber(record.minDays ?? record.estimatedDaysMin ?? record.estimatedDaysMinimum);
      const maxDays = toNumber(record.maxDays ?? record.estimatedDaysMax ?? record.estimatedDaysMaximum);

      return {
        id: normalizeId(record),
        code: cleanString(record.code) ?? cleanString(record.serviceType) ?? null,
        shipmentMethodUid: cleanString(record.shipmentMethodUid) ?? cleanString(record.uid) ?? cleanString(record.id) ?? null,
        name,
        price,
        currency,
        minDays,
        maxDays,
        raw: method,
      };
    });

  const deduped = new Map<string, NormalizedShippingMethod>();
  for (const method of normalized) {
    if (!deduped.has(method.id)) deduped.set(method.id, method);
  }

  return Array.from(deduped.values()).sort((a, b) => {
    const priceA = Number.isFinite(a.price) ? a.price : Number.POSITIVE_INFINITY;
    const priceB = Number.isFinite(b.price) ? b.price : Number.POSITIVE_INFINITY;
    if (priceA !== priceB) return priceA - priceB;
    const maxA = a.maxDays ?? Number.POSITIVE_INFINITY;
    const maxB = b.maxDays ?? Number.POSITIVE_INFINITY;
    if (maxA !== maxB) return maxA - maxB;
    return a.name.localeCompare(b.name);
  });
}
