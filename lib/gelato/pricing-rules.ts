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
  group: PricingGroupKey;
  minimumProfit: number;
  match: readonly string[];
};

const PRICING_RULES: PricingRule[] = [
  { group: "hoodie", minimumProfit: 12, match: ["hoodie", "hoodies", "hooded"] },
  { group: "crewneck", minimumProfit: 10, match: ["crewneck"] },
  { group: "sweatshirt", minimumProfit: 10, match: ["sweatshirt", "sweatshirts"] },
  { group: "oversized-tshirt", minimumProfit: 10, match: ["oversized-tshirt", "oversized tee", "oversized"] },
  { group: "premium-tshirt", minimumProfit: 10, match: ["premium-tshirt", "premium tee", "premium shirt"] },
  { group: "tshirt", minimumProfit: 8, match: ["tshirt", "t-shirt", "t-shirts", "tee", "shirt"] },
  { group: "cap", minimumProfit: 8, match: ["cap", "caps"] },
  { group: "bag", minimumProfit: 8, match: ["bag", "bags"] },
  { group: "mug", minimumProfit: 7, match: ["mug", "mugs"] },
  { group: "poster", minimumProfit: 7, match: ["poster", "posters"] },
  { group: "accessory", minimumProfit: 6, match: ["accessory", "accessories"] },
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
  gelatoProductUid?: string | null;
  variantName?: string | null;
}): PricingGroupKey {
  const haystack = normalizeKey(
    [input.category, input.title, input.slug, input.gelatoProductUid, input.variantName].filter(Boolean).join(" "),
  );

  for (const rule of PRICING_RULES) {
    if (rule.match.some((token) => haystack.includes(normalizeKey(token)))) {
      return rule.group;
    }
  }

  return "default";
}

export function resolvePricingRule(input: {
  category?: string | null;
  title?: string | null;
  slug?: string | null;
  gelatoProductUid?: string | null;
  variantName?: string | null;
}): { group: PricingGroupKey; minimumProfit: number } {
  const group = resolvePricingGroup(input);
  switch (group) {
    case "premium-tshirt":
    case "oversized-tshirt":
      return { group, minimumProfit: 10 };
    case "tshirt":
      return { group, minimumProfit: 8 };
    case "crewneck":
    case "sweatshirt":
      return { group, minimumProfit: 10 };
    case "hoodie":
      return { group, minimumProfit: 12 };
    case "cap":
    case "bag":
      return { group, minimumProfit: 8 };
    case "mug":
    case "poster":
      return { group, minimumProfit: 7 };
    case "accessory":
      return { group, minimumProfit: 6 };
    default:
      return { group, minimumProfit: 8 };
  }
}

export function resolveMinimumProfit(input: {
  category?: string | null;
  title?: string | null;
  slug?: string | null;
  gelatoProductUid?: string | null;
  variantName?: string | null;
}): number {
  return resolvePricingRule(input).minimumProfit;
}
