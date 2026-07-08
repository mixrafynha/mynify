import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AiCreditPackRow = {
  id: string;
  name: string;
  credits: number;
  price_eur: number | string;
  stripe_price_id: string;
  badge: string | null;
  popular: boolean;
  active: boolean;
  sort_order: number;
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function toPriceCents(priceEur: number | string) {
  return Math.round(Number(priceEur || 0) * 100);
}

function normalizePack(row: AiCreditPackRow) {
  const credits = Number(row.credits || 0);
  const priceCents = toPriceCents(row.price_eur);

  return {
    id: row.id,
    name: row.name,
    label: `${credits} credits`,
    credits,
    bonusCredits: 0,
    totalCredits: credits,
    priceCents,
    currency: "EUR",
    stripePriceId: row.stripe_price_id,
    note: row.badge || "AI image generation credits",
    badge: row.badge || "",
    highlight: Boolean(row.popular),
    popular: Boolean(row.popular),
    sortOrder: Number(row.sort_order || 0),
  };
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("ai_credit_packs")
      .select("id,name,credits,price_eur,stripe_price_id,badge,popular,active,sort_order")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("CREDIT PACKS ERROR:", error);
      return NextResponse.json(
        { success: false, packs: [], error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      packs: (data || []).map(normalizePack),
    });
  } catch (error: unknown) {
    console.error("CREDIT PACKS SERVER ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        packs: [],
        error: error instanceof Error ? error.message : "Could not load credit packs",
      },
      { status: 500 },
    );
  }
}
