import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { randomUUID } from "node:crypto";
import {
  createAiCreditPurchaseDependencies,
  processAiCreditCheckoutCompleted,
  AiCreditPurchaseError,
} from "@/lib/server/stripe/ai-credit-purchase";
import {
  verifyStripeWebhookRequest,
  StripeWebhookError,
} from "@/lib/server/stripe/verify-webhook";
import {
  ensureGelatoDraftConverted,
  runRyfioOrderWorkflow,
  validateRyfioOrderRelations,
} from "@/lib/server/stripe/ryfio-order-processing";

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

  const { data: draft, error: draftError } = await supabase
    .from("checkout_drafts")
    .select(
      "id,user_id,gelato_draft_order_id,order_reference_id,cart_item_ids,subtotal,shipping_amount,total,currency,status",
    )
    .eq("id", checkoutDraftId)
    .eq("user_id", userId)
    .maybeSingle();

  if (draftError) throw new Error(draftError.message);
  if (!draft) throw new Error("Checkout draft not found");

  const { gelatoDraftOrderId } = validateRyfioOrderRelations({
    expectedOrderId: orderId,
    expectedUserId: userId,
    expectedCheckoutDraftId: checkoutDraftId,
    expectedStripeSessionId: session.id,
    metadataGelatoDraftOrderId:
      typeof session.metadata?.gelato_draft_order_id === "string"
        ? session.metadata.gelato_draft_order_id
        : null,
    order,
    draft,
  });

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

  const cartItemIds = Array.isArray(draft.cart_item_ids)
    ? draft.cart_item_ids.filter(
        (value): value is string =>
          typeof value === "string" && value.length > 0,
      )
    : [];
  const processingToken = randomUUID();
  const gelatoApiKey = process.env.GELATO_API_KEY?.trim();

  if (!gelatoApiKey) throw new Error("Missing GELATO_API_KEY");

  const workflowResult = await runRyfioOrderWorkflow({
    claim: async () => {
      const { data, error } = await supabase.rpc("claim_ryfio_order_webhook", {
        p_event_id: event.id,
        p_event_type: event.type,
        p_session_id: session.id,
        p_order_id: orderId,
        p_checkout_draft_id: checkoutDraftId,
        p_processing_token: processingToken,
      });

      if (error) throw new Error(error.message);
      if (data !== "acquired" && data !== "busy" && data !== "completed") {
        throw new Error("Invalid Ryfio order webhook claim result");
      }

      return data;
    },
    convertGelatoDraft: async () => {
      console.info("[stripe:webhook:ryfio-order:gelato-convert-start]", {
        orderId,
        checkoutDraftId,
        gelatoDraftOrderId,
        stripeSessionId: session.id,
        amountTotal: paidTotalCents,
        currency: "EUR",
      });

      return ensureGelatoDraftConverted({
        gelatoDraftOrderId,
        expectedOrderReferenceId:
          typeof draft.order_reference_id === "string" &&
          draft.order_reference_id.trim()
            ? draft.order_reference_id.trim()
            : null,
        apiKey: gelatoApiKey,
      });
    },
    updateOrder: async (gelatoResult) => {
      const gelatoBody = gelatoResult.body ?? {};
      const gelatoStatus =
        typeof gelatoBody.fulfillmentStatus === "string"
          ? gelatoBody.fulfillmentStatus
          : typeof gelatoBody.orderType === "string"
            ? gelatoBody.orderType
            : "order";

      const { error } = await supabase
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

      if (error) throw new Error(error.message);
    },
    updateDraft: async () => {
      const { error } = await supabase
        .from("checkout_drafts")
        .update({
          status: "ordered",
          updated_at: new Date().toISOString(),
        })
        .eq("id", checkoutDraftId)
        .eq("user_id", userId);

      if (error) throw new Error(error.message);
    },
    clearPurchasedCartItems: async () => {
      if (!cartItemIds.length) return;

      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", userId)
        .in("id", cartItemIds);

      if (error) throw new Error(error.message);
    },
    completeClaim: async () => {
      const { data, error } = await supabase.rpc(
        "complete_ryfio_order_webhook",
        {
          p_session_id: session.id,
          p_processing_token: processingToken,
        },
      );
      if (error) throw new Error(error.message);
      return data === true;
    },
    releaseClaim: async () => {
      const { error } = await supabase.rpc("release_ryfio_order_webhook", {
        p_session_id: session.id,
        p_processing_token: processingToken,
      });
      if (error) {
        console.error("[stripe:webhook:ryfio-order:claim-release-failed]", {
          orderId,
          checkoutDraftId,
          stripeSessionId: session.id,
          code: error.code,
        });
      }
    },
  });

  if (workflowResult.alreadyCompleted) {
    return {
      ignored: true,
      reason: "already_processed",
      orderId,
    };
  }

  const gelatoResult = workflowResult.gelatoResult;

  console.info("[stripe:webhook:ryfio-order:success]", {
    orderId,
    checkoutDraftId,
    gelatoDraftOrderId,
    gelatoAlreadyOrdered: gelatoResult?.alreadyOrdered ?? true,
    clearedCartItems: cartItemIds.length,
  });

  return {
    success: true,
    orderId,
    checkoutDraftId,
    gelatoDraftOrderId,
    gelatoAlreadyOrdered: gelatoResult?.alreadyOrdered ?? true,
  };
}

export async function POST(req: Request) {
  let stripe: Stripe;
  try {
    stripe = getStripeClient();
  } catch {
    return NextResponse.json(
      { error: "WEBHOOK_CONFIG_INVALID" },
      { status: 500 },
    );
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
          dependencies: createAiCreditPurchaseDependencies({
            stripe,
            supabase,
          }),
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
