import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AiCreditPackRow = {
  id: string;
  credits: number;
  price_eur: number | string;
  stripe_price_id: string;
  active: boolean;
};

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

function getWebhookSecret() {
  return (
    process.env.STRIPE_AI_CREDITS_WEBHOOK_SECRET ||
    process.env.STRIPE_WEBHOOK_SECRET ||
    ""
  );
}

export async function POST(req: Request) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = getWebhookSecret();

    if (!stripeSecret || !webhookSecret) {
      return NextResponse.json(
        { success: false, error: "Missing Stripe webhook env vars" },
        { status: 500 },
      );
    }

    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { success: false, error: "Missing stripe-signature" },
        { status: 400 },
      );
    }

    const stripe = new Stripe(stripeSecret);
    const rawBody = await req.text();
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ received: true, ignored: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (session.metadata?.type !== "ai_credits") {
      return NextResponse.json({ received: true, ignored: true });
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true, ignored: true, reason: "unpaid_session" });
    }

    const userId = session.metadata.user_id;
    const packId = session.metadata.pack_id;

    if (!userId || !packId) {
      return NextResponse.json(
        { success: false, error: "Invalid AI credits metadata" },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    const { data: pack, error: packError } = await supabase
      .from("ai_credit_packs")
      .select("id,credits,price_eur,stripe_price_id,active")
      .eq("id", packId)
      .eq("active", true)
      .maybeSingle<AiCreditPackRow>();

    if (packError) {
      return NextResponse.json(
        { success: false, error: packError.message },
        { status: 500 },
      );
    }

    if (!pack) {
      return NextResponse.json(
        { success: false, error: "Invalid or inactive AI credits pack" },
        { status: 400 },
      );
    }

    const credits = Number(pack.credits || 0);

    if (credits <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid AI credits pack amount" },
        { status: 500 },
      );
    }

    const reference = `stripe:${session.id}`;

    const { error: insertError } = await supabase.from("ai_credit_transactions").insert({
      user_id: userId,
      amount: credits,
      reason: "stripe_purchase",
      reference,
      metadata: {
        pack_id: packId,
        stripe_session_id: session.id,
        payment_intent: session.payment_intent,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_details?.email ?? session.customer_email ?? null,
      },
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ received: true, success: true, duplicate: true });
      }

      console.error("GRANT AI CREDITS INSERT ERROR:", insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ received: true, success: true, credits });
  } catch (error: unknown) {
    console.error("AI CREDITS WEBHOOK ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Webhook error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
