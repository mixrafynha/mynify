export type PricingGroupKey =
  | "tshirt"
  | "hoodie"
  | "sweatshirt"
  | "crewneck"
  | "premium-tshirt"
  | "oversized-tshirt"
  | "cap"
  | "bag"
  | "mug"
  | "poster"
  | "accessory"
  | "default";

type PricingRule = {
  minimumProfit: number;
  match: readonly string[];
};

const PRICING_RULES: PricingRule[] = [
  { minimumProfit: 10, match: ["premium-tshirt", "oversized-tshirt", "oversized tee", "oversized", "premium tee", "premium shirt"] },
  { minimumProfit: 8, match: ["tshirt", "t-shirts", "tee", "shirt"] },
  { minimumProfit: 9.5, match: ["crewneck", "sweatshirt", "sweatshirts"] },
  { minimumProfit: 12.5, match: ["hoodie", "hoodies", "hooded"] },
  { minimumProfit: 8, match: ["cap", "caps", "bag", "bags", "accessory", "accessories"] },
  { minimumProfit: 7, match: ["mug", "mugs", "poster", "posters"] },
];

function normalizeKey(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_/]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]+/g, "");
}

export function resolvePricingGroup(input: {
  category?: string | null;
  title?: string | null;
  slug?: string | null;
}): PricingGroupKey {
  const haystack = normalizeKey(
    [input.category, input.title, input.slug].filter(Boolean).join(" "),
  );

  for (const rule of PRICING_RULES) {
    if (rule.match.some((token) => haystack.includes(normalizeKey(token)))) {
      const first = rule.match[0];
      if (first.includes("hoodie")) return "hoodie";
      if (first.includes("sweat")) return "sweatshirt";
      if (first.includes("crewneck")) return "crewneck";
      if (first.includes("premium") && first.includes("oversized")) return "oversized-tshirt";
      if (first.includes("premium")) return "premium-tshirt";
      if (first.includes("tshirt") || first.includes("tee") || first.includes("shirt")) return "tshirt";
      if (first.includes("cap")) return "cap";
      if (first.includes("bag")) return "bag";
      if (first.includes("mug")) return "mug";
      if (first.includes("poster")) return "poster";
      if (first.includes("accessory")) return "accessory";
    }
  }

  return "default";
}

export function resolveMinimumProfit(input: {
  category?: string | null;
  title?: string | null;
  slug?: string | null;
}): number {
  const group = resolvePricingGroup(input);
  switch (group) {
    case "premium-tshirt":
    case "oversized-tshirt":
      return 10;
    case "tshirt":
      return 8;
    case "crewneck":
    case "sweatshirt":
      return 10;
    case "hoodie":
      return 12;
    case "cap":
    case "bag":
      return 8;
    case "mug":
    case "poster":
      return 7;
    case "accessory":
      return 6;
    default:
      return 8;
  }
}

