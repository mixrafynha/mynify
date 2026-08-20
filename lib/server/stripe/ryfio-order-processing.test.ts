import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ensureGelatoDraftConverted,
  runRyfioOrderWorkflow,
  validateRyfioOrderRelations,
} from "./ryfio-order-processing";

type FailureStep = "before_gelato" | "order" | "draft" | "cart" | null;

function createWorkflowHarness() {
  const state = {
    claimed: false,
    completed: false,
    gelatoOrdered: false,
    orderPaid: false,
    draftOrdered: false,
    cartCleared: false,
    failure: null as FailureStep,
    productionCalls: 0,
    orderUpdates: 0,
  };

  const dependencies = {
    claim: async () => {
      if (state.completed) return "completed" as const;
      if (state.claimed) return "busy" as const;
      state.claimed = true;
      return "acquired" as const;
    },
    convertGelatoDraft: async () => {
      if (state.failure === "before_gelato") {
        state.failure = null;
        throw new Error("before Gelato");
      }
      if (!state.gelatoOrdered) {
        state.productionCalls += 1;
        state.gelatoOrdered = true;
      }
      return {
        alreadyOrdered: state.productionCalls > 0 && state.orderPaid,
        body: { orderType: "order", fulfillmentStatus: "passed" },
        status: 200,
      };
    },
    updateOrder: async () => {
      if (state.failure === "order") {
        state.failure = null;
        throw new Error("order update");
      }
      state.orderUpdates += 1;
      state.orderPaid = true;
    },
    updateDraft: async () => {
      if (state.failure === "draft") {
        state.failure = null;
        throw new Error("draft update");
      }
      state.draftOrdered = true;
    },
    clearPurchasedCartItems: async () => {
      if (state.failure === "cart") {
        state.failure = null;
        throw new Error("cart cleanup");
      }
      state.cartCleared = true;
    },
    completeClaim: async () => {
      state.completed = true;
      state.claimed = false;
      return true;
    },
    releaseClaim: async () => {
      state.claimed = false;
    },
  };

  return { state, dependencies };
}

test("happy path completes production, order, draft, and cart exactly once", async () => {
  const harness = createWorkflowHarness();
  await runRyfioOrderWorkflow(harness.dependencies);

  assert.equal(harness.state.productionCalls, 1);
  assert.equal(harness.state.orderPaid, true);
  assert.equal(harness.state.draftOrdered, true);
  assert.equal(harness.state.cartCleared, true);
  assert.equal(harness.state.completed, true);
});

test("same completed workflow delivered twice does not repeat production", async () => {
  const harness = createWorkflowHarness();
  await runRyfioOrderWorkflow(harness.dependencies);
  const retry = await runRyfioOrderWorkflow(harness.dependencies);

  assert.equal(retry.alreadyCompleted, true);
  assert.equal(harness.state.productionCalls, 1);
});

test("five retries for one Stripe Session still produce once", async () => {
  const harness = createWorkflowHarness();

  for (let delivery = 0; delivery < 5; delivery += 1) {
    await runRyfioOrderWorkflow(harness.dependencies);
  }

  assert.equal(harness.state.productionCalls, 1);
  assert.equal(harness.state.orderUpdates, 1);
});

test("different Stripe events sharing a Session use the same completed claim", async () => {
  const harness = createWorkflowHarness();
  await runRyfioOrderWorkflow(harness.dependencies);
  await runRyfioOrderWorkflow(harness.dependencies);

  assert.equal(harness.state.productionCalls, 1);
});

test("failure before Gelato releases the claim and retry can produce", async () => {
  const harness = createWorkflowHarness();
  harness.state.failure = "before_gelato";

  await assert.rejects(runRyfioOrderWorkflow(harness.dependencies));
  await runRyfioOrderWorkflow(harness.dependencies);

  assert.equal(harness.state.productionCalls, 1);
  assert.equal(harness.state.completed, true);
});

test("Gelato success followed by order failure retries with zero new production", async () => {
  const harness = createWorkflowHarness();
  harness.state.failure = "order";

  await assert.rejects(runRyfioOrderWorkflow(harness.dependencies));
  assert.equal(harness.state.productionCalls, 1);
  await runRyfioOrderWorkflow(harness.dependencies);

  assert.equal(harness.state.productionCalls, 1);
  assert.equal(harness.state.orderPaid, true);
});

test("paid order followed by draft failure is repaired without new production", async () => {
  const harness = createWorkflowHarness();
  harness.state.failure = "draft";

  await assert.rejects(runRyfioOrderWorkflow(harness.dependencies));
  assert.equal(harness.state.orderPaid, true);
  await runRyfioOrderWorkflow(harness.dependencies);

  assert.equal(harness.state.productionCalls, 1);
  assert.equal(harness.state.draftOrdered, true);
});

test("ordered draft followed by cart failure is repaired idempotently", async () => {
  const harness = createWorkflowHarness();
  harness.state.failure = "cart";

  await assert.rejects(runRyfioOrderWorkflow(harness.dependencies));
  assert.equal(harness.state.draftOrdered, true);
  await runRyfioOrderWorkflow(harness.dependencies);

  assert.equal(harness.state.productionCalls, 1);
  assert.equal(harness.state.cartCleared, true);
});

test("already cleaned cart and finalized draft remain successful", async () => {
  const harness = createWorkflowHarness();
  harness.state.gelatoOrdered = true;
  harness.state.orderPaid = true;
  harness.state.draftOrdered = true;
  harness.state.cartCleared = true;

  await runRyfioOrderWorkflow(harness.dependencies);

  assert.equal(harness.state.productionCalls, 0);
  assert.equal(harness.state.completed, true);
});

test("two simultaneous handlers acquire one production claim", async () => {
  const harness = createWorkflowHarness();
  const results = await Promise.allSettled([
    runRyfioOrderWorkflow(harness.dependencies),
    runRyfioOrderWorkflow(harness.dependencies),
  ]);

  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    1,
  );
  assert.equal(
    results.filter((result) => result.status === "rejected").length,
    1,
  );
  assert.equal(harness.state.productionCalls, 1);
  assert.equal(harness.state.orderUpdates, 1);
});

test("retry GET sees an existing Gelato order and sends zero PATCH requests", async () => {
  const methods: string[] = [];
  const result = await ensureGelatoDraftConverted({
    gelatoDraftOrderId: "gelato-draft-1",
    expectedOrderReferenceId: "ryfio-order-1",
    apiKey: "test-key",
    fetchImpl: async (_input, init) => {
      methods.push(init?.method ?? "GET");
      return new Response(
        JSON.stringify({
          orderType: "order",
          orderReferenceId: "ryfio-order-1",
        }),
        { status: 200 },
      );
    },
  });

  assert.deepEqual(methods, ["GET"]);
  assert.equal(result.alreadyOrdered, true);
});

test("legitimate Gelato transition preserves the existing PATCH payload", async () => {
  const calls: Array<{ method: string; body: unknown }> = [];
  const result = await ensureGelatoDraftConverted({
    gelatoDraftOrderId: "gelato-draft-1",
    expectedOrderReferenceId: "ryfio-order-1",
    apiKey: "test-key",
    fetchImpl: async (_input, init) => {
      calls.push({ method: init?.method ?? "GET", body: init?.body ?? null });
      if (init?.method === "GET") {
        return new Response(
          JSON.stringify({
            orderType: "draft",
            orderReferenceId: "ryfio-order-1",
          }),
          { status: 200 },
        );
      }
      return new Response(
        JSON.stringify({
          orderType: "order",
          orderReferenceId: "ryfio-order-1",
        }),
        { status: 200 },
      );
    },
  });

  assert.deepEqual(calls, [
    { method: "GET", body: null },
    { method: "PATCH", body: JSON.stringify({ orderType: "order" }) },
  ]);
  assert.equal(result.alreadyOrdered, false);
});

test("lost PATCH response is reconciled through the same Gelato order ID", async () => {
  let call = 0;
  const methods: string[] = [];
  const result = await ensureGelatoDraftConverted({
    gelatoDraftOrderId: "gelato-draft-1",
    expectedOrderReferenceId: "ryfio-order-1",
    apiKey: "test-key",
    fetchImpl: async (_input, init) => {
      call += 1;
      methods.push(init?.method ?? "GET");
      if (call === 1) {
        return new Response(
          JSON.stringify({
            orderType: "draft",
            orderReferenceId: "ryfio-order-1",
          }),
          { status: 200 },
        );
      }
      if (call === 2) return new Response("timeout", { status: 504 });
      return new Response(
        JSON.stringify({
          orderType: "order",
          orderReferenceId: "ryfio-order-1",
        }),
        { status: 200 },
      );
    },
  });

  assert.deepEqual(methods, ["GET", "PATCH", "GET"]);
  assert.equal(result.alreadyOrdered, true);
});

test("Gelato order reference mismatch fails closed", async () => {
  await assert.rejects(
    ensureGelatoDraftConverted({
      gelatoDraftOrderId: "gelato-draft-1",
      expectedOrderReferenceId: "ryfio-order-1",
      apiKey: "test-key",
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            orderType: "order",
            orderReferenceId: "other-order",
          }),
          { status: 200 },
        ),
    }),
    /GELATO_ORDER_REFERENCE_MISMATCH/,
  );
});

function validRelations() {
  return {
    expectedOrderId: "order-1",
    expectedUserId: "user-1",
    expectedCheckoutDraftId: "draft-1",
    expectedStripeSessionId: "cs_1",
    metadataGelatoDraftOrderId: "gelato-1",
    order: {
      id: "order-1",
      user_id: "user-1",
      checkout_draft_id: "draft-1",
      stripe_session_id: "cs_1",
      gelato_draft_order_id: "gelato-1",
    },
    draft: {
      id: "draft-1",
      user_id: "user-1",
      gelato_draft_order_id: "gelato-1",
    },
  };
}

test("wrong order checkout_draft_id is rejected", () => {
  const input = validRelations();
  input.order.checkout_draft_id = "draft-other";

  assert.throws(
    () => validateRyfioOrderRelations(input),
    /ORDER_CHECKOUT_DRAFT_MISMATCH/,
  );
});

test("wrong order stripe_session_id is rejected", () => {
  const input = validRelations();
  input.order.stripe_session_id = "cs_other";

  assert.throws(
    () => validateRyfioOrderRelations(input),
    /ORDER_STRIPE_SESSION_MISMATCH/,
  );
});

test("stale Gelato metadata is rejected instead of overriding the draft", () => {
  const input = validRelations();
  input.metadataGelatoDraftOrderId = "gelato-other";

  assert.throws(
    () => validateRyfioOrderRelations(input),
    /GELATO_DRAFT_ORDER_MISMATCH/,
  );
});

test("route validates order, draft, Session, and Gelato IDs before workflow claim", () => {
  const source = readFileSync("app/api/stripe/webhook/route.ts", "utf8");
  const claim = source.indexOf('supabase.rpc("claim_ryfio_order_webhook"');

  assert.ok(
    source.indexOf(
      "const { gelatoDraftOrderId } = validateRyfioOrderRelations",
    ) < claim,
  );
  assert.equal(source.includes('order.payment_status === "paid" &&'), false);
});

test("migration serializes Ryfio orders by Session and keeps RPCs server-only", () => {
  const migration = readFileSync(
    "supabase/migrations/20260820230531_secure_ryfio_order_webhook_recovery.sql",
    "utf8",
  );

  assert.match(
    migration,
    /unique index[\s\S]+\(session_id\)[\s\S]+purchase_type = 'ryfio_order'/i,
  );
  assert.match(migration, /for update/i);
  assert.match(migration, /interval '10 minutes'/i);
  assert.match(migration, /revoke all[\s\S]+from public, anon, authenticated/i);
  assert.match(migration, /grant execute[\s\S]+to service_role/i);
});
