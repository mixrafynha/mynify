import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-04-22.dahlia",
});

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

async function grantAiCredits(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
) {
  if (session.payment_status !== "paid") {
    return {
      ignored: true,
      reason: "checkout_not_paid",
    };
  }

  if (session.metadata?.type !== "ai_credits") {
    return {
      ignored: true,
      reason: "not_ai_credits",
    };
  }

  const userId = session.metadata.user_id;
  const packId = session.metadata.pack_id;

  if (!userId || !packId) {
    throw new Error("Invalid AI credits checkout metadata");
  }

  const supabase = getServiceSupabase();

  const { error: eventInsertError } = await supabase
    .from("stripe_processed_events")
    .insert({
      event_id: event.id,
      event_type: event.type,
      session_id: session.id,
    });

  if (eventInsertError) {
    if (eventInsertError.code === "23505") {
      return {
        ignored: true,
        reason: "already_processed",
      };
    }

    throw new Error(eventInsertError.message);
  }

  const { data: pack, error: packError } = await supabase
    .from("ai_credit_packs")
    .select("id,credits,active")
    .eq("id", packId)
    .eq("active", true)
    .maybeSingle();

  if (packError) {
    throw new Error(packError.message);
  }

  if (!pack) {
    throw new Error("Invalid or inactive AI credits pack");
  }

  const creditsToAdd = Number(pack.credits ?? 0);

  if (!Number.isFinite(creditsToAdd) || creditsToAdd <= 0) {
    throw new Error("Invalid AI credits pack amount");
  }

  const { data: newBalance, error: rpcError } = await supabase.rpc(
    "increment_ai_credits",
    {
      p_user_id: userId,
      p_amount: creditsToAdd,
    },
  );

  if (rpcError) {
    throw new Error(rpcError.message);
  }

  return {
    success: true,
    credits: creditsToAdd,
    balance: Number(newBalance ?? 0),
    packId,
  };
}

export async function POST(req: Request) {
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET" },
      { status: 500 },
    );
  }

  const body = await req.text();
  const headerStore = await headers();
  const signature = headerStore.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe signature" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.metadata?.type === "ai_credits") {
        const result = await grantAiCredits(event, session);

        return NextResponse.json({
          received: true,
          aiCredits: result,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown webhook handler error";

    return NextResponse.json(
      {
        error: "Webhook handler failed",
        details: message,
      },
      { status: 500 },
    );
  }
}