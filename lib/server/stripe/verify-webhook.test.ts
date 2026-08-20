import assert from "node:assert/strict";
import { test } from "node:test";
import Stripe from "stripe";
import {
  MAX_STRIPE_WEBHOOK_BYTES,
  StripeWebhookError,
  verifyStripeWebhookRequest,
} from "./verify-webhook";

const WEBHOOK_SECRET = "whsec_test_ai_credits";
const stripe = new Stripe("sk_test_webhook_verification", {
  apiVersion: "2026-04-22.dahlia",
});

function payload() {
  return JSON.stringify({
    id: "evt_signature_test",
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_signature",
        object: "checkout.session",
      },
    },
  });
}

function signedRequest(secret = WEBHOOK_SECRET) {
  const raw = payload();
  const signature = Stripe.webhooks.generateTestHeaderString({
    payload: raw,
    secret,
  });
  return new Request("https://www.ryfio.com/api/stripe/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": signature,
    },
    body: raw,
  });
}

test("valid raw Stripe body and signature are accepted", async () => {
  const event = await verifyStripeWebhookRequest({
    request: signedRequest(),
    webhookSecret: WEBHOOK_SECRET,
    stripe,
  });
  assert.equal(event.id, "evt_signature_test");
});

test("invalid signature is rejected", async () => {
  await assert.rejects(
    verifyStripeWebhookRequest({
      request: new Request("https://www.ryfio.com/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": "invalid" },
        body: payload(),
      }),
      webhookSecret: WEBHOOK_SECRET,
      stripe,
    }),
    (error) =>
      error instanceof StripeWebhookError &&
      error.code === "WEBHOOK_SIGNATURE_INVALID",
  );
});

test("signature generated with the wrong endpoint secret is rejected", async () => {
  await assert.rejects(
    verifyStripeWebhookRequest({
      request: signedRequest("whsec_wrong_endpoint"),
      webhookSecret: WEBHOOK_SECRET,
      stripe,
    }),
    (error) =>
      error instanceof StripeWebhookError &&
      error.code === "WEBHOOK_SIGNATURE_INVALID",
  );
});

test("missing endpoint secret fails closed", async () => {
  await assert.rejects(
    verifyStripeWebhookRequest({
      request: signedRequest(),
      webhookSecret: "",
      stripe,
    }),
    (error) =>
      error instanceof StripeWebhookError &&
      error.code === "WEBHOOK_SECRET_MISSING" &&
      error.status === 500,
  );
});

test("oversized body is rejected before signature verification", async () => {
  const request = new Request("https://www.ryfio.com/api/stripe/webhook", {
    method: "POST",
    headers: {
      "content-length": String(MAX_STRIPE_WEBHOOK_BYTES + 1),
      "stripe-signature": "not-evaluated",
    },
    body: "{}",
  });

  await assert.rejects(
    verifyStripeWebhookRequest({
      request,
      webhookSecret: WEBHOOK_SECRET,
      stripe,
    }),
    (error) =>
      error instanceof StripeWebhookError &&
      error.code === "WEBHOOK_BODY_TOO_LARGE" &&
      error.status === 413,
  );
});
