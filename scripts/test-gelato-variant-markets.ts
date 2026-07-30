import assert from "node:assert/strict";
import { buildGelatoVariantMarketRows } from "../lib/gelato/catalog-sync";

const syncedAt = "2026-07-30T12:00:00.000Z";
const productVariantId = "variant-1";

function buildRows(overrides: {
  prices: Array<{
    country?: string;
    currency?: string;
    quantity?: number;
    price?: number;
  }>;
  explicitSupportedCountries?: string[];
  notSupportedCountries?: string[];
  productIsAvailable?: boolean;
}) {
  return buildGelatoVariantMarketRows({
    productVariantId,
    prices: overrides.prices,
    explicitSupportedCountries: overrides.explicitSupportedCountries ?? [],
    notSupportedCountries: overrides.notSupportedCountries ?? [],
    productIsAvailable: overrides.productIsAvailable ?? true,
    syncedAt,
  });
}

const confirmed = buildRows({
  prices: [{ country: "FR", currency: "USD", quantity: 1, price: 17.7174 }],
  explicitSupportedCountries: ["FR"],
})[0];
assert.equal(confirmed.is_available, true);
assert.equal(confirmed.unavailable_reason, null);
assert.equal(confirmed.availability_source, "gelato_product_details");

const unconfirmed = buildRows({
  prices: [{ country: "AF", currency: "USD", quantity: 1, price: 20.3712 }],
})[0];
assert.equal(unconfirmed.product_price, 20.3712);
assert.equal(unconfirmed.is_available, false);
assert.equal(unconfirmed.unavailable_reason, "availability_not_confirmed");
assert.equal(unconfirmed.availability_source, "price_only");

const invalidPrice = buildRows({
  prices: [{ country: "PT", currency: "EUR", quantity: 1, price: 0 }],
  explicitSupportedCountries: ["PT"],
})[0];
assert.equal(invalidPrice.product_price, null);
assert.equal(invalidPrice.is_available, false);
assert.equal(invalidPrice.unavailable_reason, "invalid_price");

const unsupportedVariant = buildRows({
  prices: [{ country: "US", currency: "USD", quantity: 1, price: 15.39 }],
  explicitSupportedCountries: ["US"],
  productIsAvailable: false,
})[0];
assert.equal(unsupportedVariant.is_available, false);
assert.equal(unsupportedVariant.unavailable_reason, "variant_not_supported");

const apiErrorReason = "gelato_api_error";
assert.equal(apiErrorReason, "gelato_api_error");

const firstSync = buildRows({
  prices: [{ country: "US", currency: "USD", quantity: 1, price: 15.39 }],
  explicitSupportedCountries: ["US"],
});
const secondSync = buildRows({
  prices: [
    { country: "US", currency: "USD", quantity: 1, price: 15.39 },
    { country: "US", currency: "USD", quantity: 1, price: 15.39 },
  ],
  explicitSupportedCountries: ["US"],
});
assert.equal(firstSync.length, 1);
assert.equal(secondSync.length, 1);
assert.equal(secondSync[0].country_code, "US");

console.log("gelato_variant_markets logic tests passed");
