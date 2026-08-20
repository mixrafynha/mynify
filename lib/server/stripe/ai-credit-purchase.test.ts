import assert from "node:assert/strict";
import { test } from "node:test";
import type Stripe from "stripe";
import {
  AiCreditPurchaseError,
  processAiCreditCheckoutCompleted,
  type AiCreditPurchaseDependencies,
  type ProcessAiCreditPurchaseInput,
} from "./ai-credit-purchase";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const PACK_ID = "creator";
const PRICE_ID = "price_creator";
const SESSION_ID = "cs_test_ai_credit_purchase";
const EVENT_ID = "evt_ai_credit_purchase";

function eventSession(overrides: Record<string, unknown> = {}) {
  return {
    id: SESSION_ID,
    object: "checkout.session",
    mode: "payment",
    payment_status: "paid",
    amount_total: 1490,
    currency: "eur",
    client_reference_id: USER_ID,
    metadata: {
      type: "ai_credits",
      user_id: USER_ID,
      pack_id: PACK_ID,
      credits: "999999",
    },
    ...overrides,
  } as unknown as Stripe.Checkout.Session;
}

function retrievedSession(overrides: Record<string, unknown> = {}) {
  return eventSession({
    line_items: {
      object: "list",
      data: [
        {
          id: "li_ai_credits",
          object: "item",
          quantity: 1,
          price: {
            id: PRICE_ID,
            object: "price",
            currency: "eur",
            unit_amount: 1490,
          },
        },
      ],
      has_more: false,
      url: "/v1/checkout/sessions/test/line_items",
    },
    ...overrides,
  });
}

function stripeEvent(session = eventSession()) {
  return {
    id: EVENT_ID,
    object: "event",
    type: "checkout.session.completed",
    data: { object: session },
  } as unknown as Stripe.Event;
}

function dependencies(overrides: Partial<AiCreditPurchaseDependencies> = {}) {
  return {
    async retrieveSession() {
      return retrievedSession();
    },
    async processPurchase() {
      return {
        processed: true,
        duplicate: false,
        credits_added: 30,
        balance: 33,
        result_pack_id: PACK_ID,
      };
    },
    ...overrides,
  } satisfies AiCreditPurchaseDependencies;
}

test("valid purchase grants the pack's server-side credit amount", async () => {
  const atomicInputs: ProcessAiCreditPurchaseInput[] = [];
  const result = await processAiCreditCheckoutCompleted({
    event: stripeEvent(),
    eventSession: eventSession(),
    dependencies: dependencies({
      async processPurchase(input) {
        atomicInputs.push(input);
        return {
          processed: true,
          duplicate: false,
          credits_added: 30,
          balance: 33,
          result_pack_id: PACK_ID,
        };
      },
    }),
  });

  assert.deepEqual(result, {
    success: true,
    duplicate: false,
    credits: 30,
    balance: 33,
    packId: PACK_ID,
  });
  assert.equal(atomicInputs[0]?.packId, PACK_ID);
  assert.equal(atomicInputs[0]?.stripePriceId, PRICE_ID);
});

test("five deliveries of the same purchase grant credits exactly once", async () => {
  let processed = false;
  let balance = 3;
  let increments = 0;
  const deps = dependencies({
    async processPurchase() {
      if (!processed) {
        processed = true;
        increments += 1;
        balance += 30;
        return {
          processed: true,
          duplicate: false,
          credits_added: 30,
          balance,
          result_pack_id: PACK_ID,
        };
      }

      return {
        processed: false,
        duplicate: true,
        credits_added: 30,
        balance,
        result_pack_id: PACK_ID,
      };
    },
  });

  const results = await Promise.all(
    Array.from({ length: 5 }, () =>
      processAiCreditCheckoutCompleted({
        event: stripeEvent(),
        eventSession: eventSession(),
        dependencies: deps,
      }),
    ),
  );

  assert.equal(increments, 1);
  assert.equal(balance, 33);
  assert.equal(results.filter((result) => "duplicate" in result && result.duplicate).length, 4);
});

test("missing pack fails in the atomic database operation", async () => {
  await assert.rejects(
    processAiCreditCheckoutCompleted({
      event: stripeEvent(),
      eventSession: eventSession(),
      dependencies: dependencies({
        async processPurchase() {
          throw new AiCreditPurchaseError("AI_CREDIT_DATABASE_FAILED");
        },
      }),
    }),
    (error) =>
      error instanceof AiCreditPurchaseError &&
      error.code === "AI_CREDIT_DATABASE_FAILED",
  );
});

test("mismatched authenticated owner is rejected", async () => {
  await assert.rejects(
    processAiCreditCheckoutCompleted({
      event: stripeEvent(),
      eventSession: eventSession(),
      dependencies: dependencies({
        async retrieveSession() {
          return retrievedSession({ client_reference_id: crypto.randomUUID() });
        },
      }),
    }),
    (error) =>
      error instanceof AiCreditPurchaseError &&
      error.code === "AI_CREDIT_OWNERSHIP_INVALID",
  );
});

test("wrong Stripe Price is rejected by the atomic pack lookup", async () => {
  await assert.rejects(
    processAiCreditCheckoutCompleted({
      event: stripeEvent(),
      eventSession: eventSession(),
      dependencies: dependencies({
        async retrieveSession() {
          return retrievedSession({
            line_items: {
              object: "list",
              data: [
                {
                  quantity: 1,
                  price: {
                    id: "price_attacker",
                    currency: "eur",
                    unit_amount: 1490,
                  },
                },
              ],
              has_more: false,
              url: "",
            },
          });
        },
        async processPurchase() {
          throw new AiCreditPurchaseError("AI_CREDIT_DATABASE_FAILED");
        },
      }),
    }),
    (error) =>
      error instanceof AiCreditPurchaseError &&
      error.code === "AI_CREDIT_DATABASE_FAILED",
  );
});

test("database failure is propagated so Stripe can retry", async () => {
  await assert.rejects(
    processAiCreditCheckoutCompleted({
      event: stripeEvent(),
      eventSession: eventSession(),
      dependencies: dependencies({
        async processPurchase() {
          throw new AiCreditPurchaseError("AI_CREDIT_DATABASE_FAILED");
        },
      }),
    }),
    (error) =>
      error instanceof AiCreditPurchaseError &&
      error.code === "AI_CREDIT_DATABASE_FAILED",
  );
});
