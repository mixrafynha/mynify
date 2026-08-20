import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

export type AiCreditPurchaseResult =
  | {
      ignored: true;
      reason: "not_ai_credits" | "checkout_not_paid";
    }
  | {
      success: true;
      duplicate: boolean;
      credits: number | null;
      balance: number | null;
      packId: string;
    };

export type ProcessAiCreditPurchaseInput = {
  eventId: string;
  eventType: string;
  sessionId: string;
  userId: string;
  packId: string;
  stripePriceId: string;
};

type AtomicPurchaseRow = {
  processed: boolean;
  duplicate: boolean;
  credits_added: number | null;
  balance: number | null;
  result_pack_id: string | null;
};

export type AiCreditPurchaseDependencies = {
  retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session>;
  processPurchase(input: ProcessAiCreditPurchaseInput): Promise<AtomicPurchaseRow>;
};

export type AiCreditPurchaseErrorCode =
  | "AI_CREDIT_METADATA_INVALID"
  | "AI_CREDIT_SESSION_INVALID"
  | "AI_CREDIT_OWNERSHIP_INVALID"
  | "AI_CREDIT_PRICE_INVALID"
  | "AI_CREDIT_AMOUNT_INVALID"
  | "AI_CREDIT_DATABASE_FAILED";

export class AiCreditPurchaseError extends Error {
  constructor(public readonly code: AiCreditPurchaseErrorCode) {
    super(code);
    this.name = "AiCreditPurchaseError";
  }
}

function getPriceId(price: string | Stripe.Price | null) {
  if (typeof price === "string") return price;
  return price?.id ?? null;
}

function getPriceCurrency(price: string | Stripe.Price | null) {
  return typeof price === "object" && price ? price.currency : null;
}

function getUnitAmount(price: string | Stripe.Price | null) {
  return typeof price === "object" && price ? price.unit_amount : null;
}

export function createAiCreditPurchaseDependencies(args: {
  stripe: Stripe;
  supabase: SupabaseClient;
}): AiCreditPurchaseDependencies {
  return {
    async retrieveSession(sessionId) {
      return args.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["line_items.data.price"],
      });
    },

    async processPurchase(input) {
      const { data, error } = await args.supabase.rpc(
        "process_ai_credit_purchase",
        {
          p_event_id: input.eventId,
          p_event_type: input.eventType,
          p_session_id: input.sessionId,
          p_user_id: input.userId,
          p_pack_id: input.packId,
          p_stripe_price_id: input.stripePriceId,
        },
      );

      if (error) {
        throw new AiCreditPurchaseError("AI_CREDIT_DATABASE_FAILED");
      }

      const row = (Array.isArray(data) ? data[0] : data) as AtomicPurchaseRow | null;
      if (!row) {
        throw new AiCreditPurchaseError("AI_CREDIT_DATABASE_FAILED");
      }

      return row;
    },
  };
}

export async function processAiCreditCheckoutCompleted(args: {
  event: Stripe.Event;
  eventSession: Stripe.Checkout.Session;
  dependencies: AiCreditPurchaseDependencies;
}): Promise<AiCreditPurchaseResult> {
  if (args.eventSession.metadata?.type !== "ai_credits") {
    return { ignored: true, reason: "not_ai_credits" };
  }

  if (args.eventSession.payment_status !== "paid") {
    return { ignored: true, reason: "checkout_not_paid" };
  }

  const session = await args.dependencies.retrieveSession(args.eventSession.id);
  if (
    session.id !== args.eventSession.id ||
    session.mode !== "payment" ||
    session.payment_status !== "paid" ||
    session.metadata?.type !== "ai_credits"
  ) {
    throw new AiCreditPurchaseError("AI_CREDIT_SESSION_INVALID");
  }

  const userId = session.metadata.user_id?.trim();
  const packId = session.metadata.pack_id?.trim();
  if (!userId || !packId) {
    throw new AiCreditPurchaseError("AI_CREDIT_METADATA_INVALID");
  }

  if (!session.client_reference_id || session.client_reference_id !== userId) {
    throw new AiCreditPurchaseError("AI_CREDIT_OWNERSHIP_INVALID");
  }

  const lineItems = session.line_items?.data ?? [];
  if (lineItems.length !== 1 || lineItems[0]?.quantity !== 1) {
    throw new AiCreditPurchaseError("AI_CREDIT_PRICE_INVALID");
  }

  const stripePriceId = getPriceId(lineItems[0].price);
  const priceCurrency = getPriceCurrency(lineItems[0].price);
  const unitAmount = getUnitAmount(lineItems[0].price);
  if (
    !stripePriceId ||
    !stripePriceId.startsWith("price_") ||
    priceCurrency?.toLowerCase() !== "eur" ||
    session.currency?.toLowerCase() !== "eur"
  ) {
    throw new AiCreditPurchaseError("AI_CREDIT_PRICE_INVALID");
  }

  if (
    unitAmount === null ||
    unitAmount <= 0 ||
    session.amount_total === null ||
    session.amount_total <= 0
  ) {
    throw new AiCreditPurchaseError("AI_CREDIT_AMOUNT_INVALID");
  }

  const atomicResult = await args.dependencies.processPurchase({
    eventId: args.event.id,
    eventType: args.event.type,
    sessionId: session.id,
    userId,
    packId,
    stripePriceId,
  });

  if (
    atomicResult.result_pack_id !== packId ||
    (
      !atomicResult.duplicate &&
      (
        !Number.isSafeInteger(atomicResult.credits_added) ||
        Number(atomicResult.credits_added) <= 0
      )
    )
  ) {
    throw new AiCreditPurchaseError("AI_CREDIT_DATABASE_FAILED");
  }

  return {
    success: true,
    duplicate: Boolean(atomicResult.duplicate),
    credits: atomicResult.credits_added ?? null,
    balance:
      atomicResult.balance === null || atomicResult.balance === undefined
        ? null
        : Number(atomicResult.balance),
    packId,
  };
}
