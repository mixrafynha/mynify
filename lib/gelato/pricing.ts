import { resolveMinimumProfit } from "@/lib/gelato/pricing-rules";

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
  minimumProfit?: unknown;
  category?: string | null;
  title?: string | null;
  slug?: string | null;
}): number | null {
  const productionCost = cleanNumber(input.productionCost);
  if (productionCost === null || productionCost <= 0) return null;

  const markupPercentage = normalizeProfitMarkupPercentage(input.markupPercentage);
  const percentagePrice = productionCost * (1 + markupPercentage / 100);
  const minimumProfit = cleanNumber(input.minimumProfit);
  const resolvedMinimumProfit =
    minimumProfit !== null && minimumProfit >= 0
      ? minimumProfit
      : resolveMinimumProfit({
          category: input.category,
          title: input.title,
          slug: input.slug,
        });
  const minimumProfitPrice = productionCost + resolvedMinimumProfit;
  return roundSellingPrice(Math.max(percentagePrice, minimumProfitPrice));
}

export function pricesAlmostEqual(left: unknown, right: unknown, tolerance = 0.0001): boolean {
  const leftNumber = cleanNumber(left);
  const rightNumber = cleanNumber(right);
  if (leftNumber === null || rightNumber === null) return false;
  return Math.abs(leftNumber - rightNumber) < tolerance;
}
