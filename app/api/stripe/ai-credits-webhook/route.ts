import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import {
  createAiCreditPurchaseDependencies,
  processAiCreditCheckoutCompleted,
  AiCreditPurchaseError,
} from "@/lib/server/stripe/ai-credit-purchase";
import {
  verifyStripeWebhookRequest,
  StripeWebhookError,
} from "@/lib/server/stripe/verify-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY");

  return new Stripe(secretKey, {
    apiVersion: "2026-04-22.dahlia",
  });
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase service env vars");

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Compatibility endpoint only. AI credit business logic is canonical in
// processAiCreditCheckoutCompleted and shared with /api/stripe/webhook.
export async function POST(req: Request) {
  let stripe: Stripe;
  try {
    stripe = getStripeClient();
  } catch {
    return NextResponse.json({ error: "WEBHOOK_CONFIG_INVALID" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = await verifyStripeWebhookRequest({
      request: req,
      webhookSecret: process.env.STRIPE_AI_CREDITS_WEBHOOK_SECRET,
      stripe,
    });
  } catch (error) {
    const webhookError = error instanceof StripeWebhookError ? error : null;
    return NextResponse.json(
      { error: webhookError?.code ?? "WEBHOOK_VERIFICATION_FAILED" },
      { status: webhookError?.status ?? 400 },
    );
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true, ignored: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.metadata?.type !== "ai_credits") {
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    const result = await processAiCreditCheckoutCompleted({
      event,
      eventSession: session,
      dependencies: createAiCreditPurchaseDependencies({
        stripe,
        supabase: getServiceSupabase(),
      }),
    });

    return NextResponse.json({
      received: true,
      aiCredits: result,
    });
  } catch (error) {
    console.error("[stripe:ai-credits-legacy:error]", {
      eventId: event.id,
      eventType: event.type,
      code:
        error instanceof AiCreditPurchaseError
          ? error.code
          : "AI_CREDIT_HANDLER_FAILED",
    });

    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
