import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { validateCartItemIntegrity } from "./cart-item-integrity";

const PRODUCT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const PRODUCT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const VARIANT_A = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const VARIANT_B = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const DESIGN_A = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

function validate(overrides: Partial<Parameters<typeof validateCartItemIntegrity>[0]> = {}) {
  return validateCartItemIntegrity({
    cartProductId: PRODUCT_A,
    variantId: VARIANT_A,
    variantProductId: PRODUCT_A,
    userProductId: DESIGN_A,
    resolvedUserProductId: DESIGN_A,
    userProductBaseProductId: PRODUCT_A,
    ...overrides,
  });
}

test("legitimate product, variant, and design relationship passes unchanged", () => {
  assert.equal(validate(), null);
});

test("product without user_product_id remains supported", () => {
  assert.equal(
    validate({
      userProductId: null,
      resolvedUserProductId: null,
      userProductBaseProductId: null,
    }),
    null,
  );
});

test("front-only, back-only, and front+back do not change relationship validation", () => {
  for (const sides of ["front", "back", "front+back"]) {
    assert.equal(validate(), null, sides);
  }
});

test("legitimate size/color variant update for the same product passes", () => {
  assert.equal(validate({ variantId: VARIANT_B, variantProductId: PRODUCT_A }), null);
});

test("variant belonging to another product is rejected", () => {
  assert.equal(
    validate({ variantId: VARIANT_B, variantProductId: PRODUCT_B }),
    "INVALID_PRODUCT_VARIANT",
  );
});

test("design belonging to another product is rejected", () => {
  assert.equal(
    validate({ userProductBaseProductId: PRODUCT_B }),
    "INVALID_USER_PRODUCT",
  );
});

test("missing or cross-user referenced design is rejected", () => {
  assert.equal(
    validate({ resolvedUserProductId: null, userProductBaseProductId: null }),
    "INVALID_USER_PRODUCT",
  );
});

test("variant mismatch wins when both relationships are invalid", () => {
  assert.equal(
    validate({ variantProductId: PRODUCT_B, userProductBaseProductId: PRODUCT_B }),
    "INVALID_PRODUCT_VARIANT",
  );
});

test("draft relation gate appears before availability and Gelato draft creation", () => {
  const source = readFileSync("app/api/checkout/draft-order/route.ts", "utf8");
  const loop = source.indexOf("for (const cartRow of cartRows ?? [])");
  const gate = source.indexOf("validateCartItemIntegrity", loop);
  const availability = source.indexOf("checkGelatoRegionalAvailability", loop);
  const gelatoFetch = source.indexOf("gelatoResponse = await fetch", loop);
  assert.ok(loop >= 0 && gate > loop);
  assert.ok(gate < availability);
  assert.ok(gate < gelatoFetch);
});

test("final relation gate appears before availability and Stripe session creation", () => {
  const source = readFileSync("app/api/checkout/route.ts", "utf8");
  const cartLoad = source.indexOf('from("cart_items")');
  const gate = source.indexOf("validateCartItemIntegrity", cartLoad);
  const availability = source.indexOf("checkGelatoRegionalAvailability", cartLoad);
  const stripe = source.indexOf("stripe.checkout.sessions.create", cartLoad);
  assert.ok(cartLoad >= 0 && gate > cartLoad);
  assert.ok(gate < availability);
  assert.ok(gate < stripe);
});
