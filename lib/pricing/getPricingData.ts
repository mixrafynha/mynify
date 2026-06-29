import { supabase } from "@/lib/supabase";

export type PricingPlan = {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  interval_label: string;
  description: string;
  ai_credits: number;
  credits_note: string;
  features: string[];
  button_label: string;
  href: string;
  highlight: boolean;
  is_active: boolean;
  sort_order: number;
};

export type CreditPack = {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  credits: number;
  bonus_credits: number;
  note: string;
  highlight: boolean;
  is_active: boolean;
  sort_order: number;
};

export type PricingData = {
  plans: PricingPlan[];
  creditPacks: CreditPack[];
};

export const formatMoney = (priceCents: number, currency = "EUR") => {
  const safeCents = Number.isFinite(priceCents) ? priceCents : 0;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeCents / 100);
};

export const fallbackPricingData: PricingData = {
  plans: [
    {
      id: "free",
      name: "Free",
      price_cents: 0,
      currency: "EUR",
      interval_label: "/ forever",
      description: "Start creating products without paying monthly.",
      ai_credits: 5,
      credits_note: "included when you create your account",
      features: [
        "Unlimited product creation",
        "Product editor included",
        "Save designs",
        "Mockup preview",
        "Secure checkout",
        "Community support",
      ],
      button_label: "Start Free",
      href: "/signup",
      highlight: false,
      is_active: true,
      sort_order: 1,
    },
    {
      id: "pro",
      name: "Pro",
      price_cents: 1999,
      currency: "EUR",
      interval_label: "/ month",
      description: "For creators who use AI tools and launch products often.",
      ai_credits: 100,
      credits_note: "included every month",
      features: [
        "Everything in Free",
        "Premium creator tools",
        "Priority support",
        "Faster AI processing",
        "Early access to features",
        "Creator workflow upgrades",
      ],
      button_label: "Go Pro",
      href: "/signup",
      highlight: true,
      is_active: true,
      sort_order: 2,
    },
    {
      id: "business",
      name: "Business",
      price_cents: 4999,
      currency: "EUR",
      interval_label: "/ month",
      description: "For brands that need more credits, support and scale.",
      ai_credits: 300,
      credits_note: "included every month",
      features: [
        "Everything in Pro",
        "Advanced analytics",
        "Team-ready workflows",
        "Dedicated support",
        "Priority processing",
        "Business support queue",
      ],
      button_label: "Contact Sales",
      href: "/contact",
      highlight: false,
      is_active: true,
      sort_order: 3,
    },
  ],
  creditPacks: [
    {
      id: "starter-pack",
      name: "Starter Pack",
      price_cents: 499,
      currency: "EUR",
      credits: 100,
      bonus_credits: 0,
      note: "Best for testing AI tools",
      highlight: false,
      is_active: true,
      sort_order: 1,
    },
    {
      id: "creator-pack",
      name: "Creator Pack",
      price_cents: 1499,
      currency: "EUR",
      credits: 350,
      bonus_credits: 50,
      note: "Most popular credit pack",
      highlight: true,
      is_active: true,
      sort_order: 2,
    },
    {
      id: "studio-pack",
      name: "Studio Pack",
      price_cents: 3499,
      currency: "EUR",
      credits: 900,
      bonus_credits: 150,
      note: "For frequent product creation",
      highlight: false,
      is_active: true,
      sort_order: 3,
    },
    {
      id: "business-pack",
      name: "Business Pack",
      price_cents: 7499,
      currency: "EUR",
      credits: 2200,
      bonus_credits: 400,
      note: "For heavy AI usage",
      highlight: false,
      is_active: true,
      sort_order: 4,
    },
  ],
};

const normalizePlan = (item: Partial<PricingPlan>): PricingPlan | null => {
  if (!item?.id || !item?.name) return null;

  return {
    id: String(item.id),
    name: String(item.name),
    price_cents: Number(item.price_cents ?? 0),
    currency: String(item.currency ?? "EUR"),
    interval_label: String(item.interval_label ?? ""),
    description: String(item.description ?? ""),
    ai_credits: Number(item.ai_credits ?? 0),
    credits_note: String(item.credits_note ?? ""),
    features: Array.isArray(item.features) ? item.features.map(String) : [],
    button_label: String(item.button_label ?? "Get started"),
    href: String(item.href ?? "/signup"),
    highlight: Boolean(item.highlight),
    is_active: item.is_active !== false,
    sort_order: Number(item.sort_order ?? 999),
  };
};

const normalizePack = (item: Partial<CreditPack>): CreditPack | null => {
  if (!item?.id || !item?.name) return null;

  return {
    id: String(item.id),
    name: String(item.name),
    price_cents: Number(item.price_cents ?? 0),
    currency: String(item.currency ?? "EUR"),
    credits: Number(item.credits ?? 0),
    bonus_credits: Number(item.bonus_credits ?? 0),
    note: String(item.note ?? ""),
    highlight: Boolean(item.highlight),
    is_active: item.is_active !== false,
    sort_order: Number(item.sort_order ?? 999),
  };
};

export async function getPricingData(): Promise<PricingData> {
  try {
    const [plansResult, packsResult] = await Promise.all([
      supabase
        .from("pricing_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabase
        .from("credit_packs")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);

    const plans = (plansResult.data ?? [])
      .map(normalizePlan)
      .filter((item): item is PricingPlan => Boolean(item))
      .filter((item) => item.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);

    const creditPacks = (packsResult.data ?? [])
      .map(normalizePack)
      .filter((item): item is CreditPack => Boolean(item))
      .filter((item) => item.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);

    return {
      plans: plans.length > 0 ? plans : fallbackPricingData.plans,
      creditPacks:
        creditPacks.length > 0 ? creditPacks : fallbackPricingData.creditPacks,
    };
  } catch {
    return fallbackPricingData;
  }
}
