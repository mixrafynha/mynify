export const DEFAULT_PROFIT_MARKUP_PERCENTAGE = 30;

function cleanNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

export function normalizeProfitMarkupPercentage(value: unknown): number {
  const number = cleanNumber(value);
  if (number === null) return DEFAULT_PROFIT_MARKUP_PERCENTAGE;
  return Math.min(500, Math.max(0, number));
}

export function roundSellingPrice(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateSellingPrice(input: {
  productionCost: unknown;
  markupPercentage: unknown;
}): number | null {
  const productionCost = cleanNumber(input.productionCost);
  if (productionCost === null || productionCost <= 0) return null;

  const markupPercentage = normalizeProfitMarkupPercentage(input.markupPercentage);
  return roundSellingPrice(productionCost * (1 + markupPercentage / 100));
}

export function pricesAlmostEqual(left: unknown, right: unknown, tolerance = 0.0001): boolean {
  const leftNumber = cleanNumber(left);
  const rightNumber = cleanNumber(right);
  if (leftNumber === null || rightNumber === null) return false;
  return Math.abs(leftNumber - rightNumber) < tolerance;
}
