import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

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

async function getUser() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {}
        },
      },
    },
  );

  return supabase.auth.getUser();
}

function getAppUrl(req: Request) {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return new URL(req.url).origin;
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase service env vars");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(req: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json(
        { success: false, error: "Missing STRIPE_SECRET_KEY" },
        { status: 500 },
      );
    }

    const {
      data: { user },
      error: authError,
    } = await getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const packId = String(body?.packId || "").trim();
    const source = String(body?.source || "editor").trim().slice(0, 40);

    if (!packId) {
      return NextResponse.json(
        { success: false, error: "Missing credit pack id" },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    const { data: pack, error: packError } = await supabase
      .from("ai_credit_packs")
      .select("id,name,credits,price_eur,stripe_price_id,badge,popular,active,sort_order")
      .eq("id", packId)
      .eq("active", true)
      .maybeSingle<AiCreditPackRow>();

    if (packError) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not load credit pack",
          details: packError.message,
        },
        { status: 500 },
      );
    }

    if (!pack) {
      return NextResponse.json(
        { success: false, error: "Invalid AI credits pack" },
        { status: 400 },
      );
    }

    const credits = Number(pack.credits || 0);

    if (credits <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid credit pack configuration" },
        { status: 500 },
      );
    }

    if (!pack.stripe_price_id || !pack.stripe_price_id.startsWith("price_")) {
      return NextResponse.json(
        { success: false, error: "Invalid stripe_price_id for this credit pack" },
        { status: 500 },
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const appUrl = getAppUrl(req);
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page",
      mode: "payment",
      redirect_on_completion: "never",
      payment_method_types: ["card"],
      customer_email: user.email || undefined,
      client_reference_id: user.id,
      metadata: {
        type: "ai_credits",
        user_id: user.id,
        pack_id: pack.id,
        credits: String(credits),
        source,
      },
      line_items: [
        {
          price: pack.stripe_price_id,
          quantity: 1,
        },
      ],
    });
    if (!session.client_secret) {
      return NextResponse.json(
        { success: false, error: "Stripe did not return a client secret" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      clientSecret: session.client_secret,
      sessionId: session.id,
    });
  } catch (error: unknown) {
    console.error("CREATE AI CREDITS EMBEDDED CHECKOUT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Could not create embedded credits checkout",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
