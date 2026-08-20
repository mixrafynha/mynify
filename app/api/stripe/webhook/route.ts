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

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function getStripeClient() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: "2026-04-22.dahlia",
  });
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

function moneyToCents(value: unknown): number | null {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  const cents = Math.round((numeric + Number.EPSILON) * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}

async function ensureGelatoDraftConverted(gelatoDraftOrderId: string) {
  const apiKey = process.env.GELATO_API_KEY?.trim();
  if (!apiKey) throw new Error("Missing GELATO_API_KEY");

  const url = `https://order.gelatoapis.com/v4/orders/${encodeURIComponent(gelatoDraftOrderId)}`;

  const patchResponse = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({ orderType: "order" }),
    cache: "no-store",
  });

  const patchText = await patchResponse.text();
  let patchBody: Record<string, unknown> | null = null;

  try {
    patchBody = patchText ? (JSON.parse(patchText) as Record<string, unknown>) : null;
  } catch {
    patchBody = null;
  }

  if (patchResponse.ok) {
    return {
      alreadyOrdered: false,
      body: patchBody,
      status: patchResponse.status,
    };
  }

  // Idempotency/retry safety: if a previous webhook already converted the
  // Gelato draft but failed later while updating Ryfio, accept the existing
  // regular order instead of trying to create a second one.
  const getResponse = await fetch(url, {
    method: "GET",
    headers: {
      "X-API-KEY": apiKey,
    },
    cache: "no-store",
  });

  const getText = await getResponse.text();
  let getBody: Record<string, unknown> | null = null;

  try {
    getBody = getText ? (JSON.parse(getText) as Record<string, unknown>) : null;
  } catch {
    getBody = null;
  }

  if (getResponse.ok && getBody?.orderType === "order") {
    return {
      alreadyOrdered: true,
      body: getBody,
      status: getResponse.status,
    };
  }

  throw new Error(
    `Gelato draft conversion failed (${patchResponse.status}): ${patchText.slice(0, 500)}`,
  );
}

async function processRyfioOrder(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
) {
  if (session.payment_status !== "paid") {
    return {
      ignored: true,
      reason: "checkout_not_paid",
    };
  }

  if (
    session.metadata?.type !== "ryfio_order" &&
    session.metadata?.source !== "ryfio_checkout"
  ) {
    return {
      ignored: true,
      reason: "not_ryfio_order",
    };
  }

  const orderId = session.metadata?.order_id?.trim();
  const userId = session.metadata?.user_id?.trim();
  const checkoutDraftId = session.metadata?.checkout_draft_id?.trim();

  if (!orderId || !userId || !checkoutDraftId) {
    throw new Error("Invalid Ryfio checkout metadata");
  }

  if ((session.currency ?? "").toUpperCase() !== "EUR") {
    throw new Error("Ryfio orders must be paid in EUR");
  }

  const supabase = getServiceSupabase();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id,user_id,status,payment_status,stripe_session_id,checkout_draft_id,gelato_draft_order_id,total,currency",
    )
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (orderError) throw new Error(orderError.message);
  if (!order) throw new Error("Ryfio order not found");

  if (
    order.payment_status === "paid" &&
    order.status !== "pending"
  ) {
    return {
      ignored: true,
      reason: "already_processed",
      orderId,
    };
  }

  const { data: draft, error: draftError } = await supabase
    .from("checkout_drafts")
    .select(
      "id,user_id,gelato_draft_order_id,cart_item_ids,subtotal,shipping_amount,total,currency,status",
    )
    .eq("id", checkoutDraftId)
    .eq("user_id", userId)
    .maybeSingle();

  if (draftError) throw new Error(draftError.message);
  if (!draft) throw new Error("Checkout draft not found");

  const draftCurrency = String(draft.currency ?? "").toUpperCase();
  if (draftCurrency !== "EUR") {
    throw new Error("Checkout draft currency is not EUR");
  }

  const expectedTotalCents = moneyToCents(draft.total);
  const paidTotalCents = session.amount_total ?? null;

  if (
    expectedTotalCents === null ||
    paidTotalCents === null ||
    expectedTotalCents !== paidTotalCents
  ) {
    throw new Error(
      `Stripe total mismatch: expected ${expectedTotalCents}, paid ${paidTotalCents}`,
    );
  }

  const gelatoDraftOrderId =
    String(
      order.gelato_draft_order_id ??
        draft.gelato_draft_order_id ??
        session.metadata?.gelato_draft_order_id ??
        "",
    ).trim();

  if (!gelatoDraftOrderId) {
    throw new Error("Missing Gelato draft order id");
  }

  // Shared event table remains exactly the same mechanism used by AI Credits.
  // For Ryfio orders we remove this claim again on failure so Stripe retries
  // can safely resume.
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
        orderId,
      };
    }
    throw new Error(eventInsertError.message);
  }

  let completed = false;

  try {
    console.info("[stripe:webhook:ryfio-order:gelato-convert-start]", {
      orderId,
      checkoutDraftId,
      gelatoDraftOrderId,
      stripeSessionId: session.id,
      amountTotal: paidTotalCents,
      currency: "EUR",
    });

    const gelatoResult = await ensureGelatoDraftConverted(gelatoDraftOrderId);
    const gelatoBody = gelatoResult.body ?? {};

    const gelatoStatus =
      typeof gelatoBody.fulfillmentStatus === "string"
        ? gelatoBody.fulfillmentStatus
        : typeof gelatoBody.orderType === "string"
          ? gelatoBody.orderType
          : "order";

    const { error: updateOrderError } = await supabase
      .from("orders")
      .update({
        status: "processing",
        payment_status: "paid",
        gelato_status: gelatoStatus,
        stripe_session_id: session.id,
        checkout_draft_id: checkoutDraftId,
        gelato_draft_order_id: gelatoDraftOrderId,
        subtotal: Number(draft.subtotal ?? 0),
        shipping_amount: Number(draft.shipping_amount ?? 0),
        total: Number(draft.total ?? 0),
        currency: "EUR",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("user_id", userId);

    if (updateOrderError) throw new Error(updateOrderError.message);

    const { error: draftUpdateError } = await supabase
      .from("checkout_drafts")
      .update({
        status: "ordered",
        updated_at: new Date().toISOString(),
      })
      .eq("id", checkoutDraftId)
      .eq("user_id", userId);

    if (draftUpdateError) throw new Error(draftUpdateError.message);

    const cartItemIds = Array.isArray(draft.cart_item_ids)
      ? draft.cart_item_ids.filter(
          (value): value is string => typeof value === "string" && value.length > 0,
        )
      : [];

    if (cartItemIds.length) {
      const { error: clearCartError } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", userId)
        .in("id", cartItemIds);

      if (clearCartError) throw new Error(clearCartError.message);
    }

    completed = true;

    console.info("[stripe:webhook:ryfio-order:success]", {
      orderId,
      checkoutDraftId,
      gelatoDraftOrderId,
      gelatoAlreadyOrdered: gelatoResult.alreadyOrdered,
      clearedCartItems: cartItemIds.length,
    });

    return {
      success: true,
      orderId,
      checkoutDraftId,
      gelatoDraftOrderId,
      gelatoAlreadyOrdered: gelatoResult.alreadyOrdered,
    };
  } finally {
    if (!completed) {
      await supabase
        .from("stripe_processed_events")
        .delete()
        .eq("event_id", event.id);
    }
  }
}

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
      webhookSecret,
      stripe,
    });
  } catch (error) {
    const webhookError = error instanceof StripeWebhookError ? error : null;
    return NextResponse.json(
      { error: webhookError?.code ?? "WEBHOOK_VERIFICATION_FAILED" },
      { status: webhookError?.status ?? 400 },
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // AI Credits branch is processed by the single canonical implementation.
      if (session.metadata?.type === "ai_credits") {
        const supabase = getServiceSupabase();
        const result = await processAiCreditCheckoutCompleted({
          event,
          eventSession: session,
          dependencies: createAiCreditPurchaseDependencies({ stripe, supabase }),
        });

        return NextResponse.json({
          received: true,
          aiCredits: result,
        });
      }

      if (
        session.metadata?.type === "ryfio_order" ||
        session.metadata?.source === "ryfio_checkout"
      ) {
        const result = await processRyfioOrder(event, session);

        return NextResponse.json({
          received: true,
          ryfioOrder: result,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const code =
      error instanceof AiCreditPurchaseError
        ? error.code
        : "WEBHOOK_HANDLER_FAILED";

    console.error("[stripe:webhook:error]", {
      eventId: event.id,
      eventType: event.type,
      code,
    });

    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
