import assert from "node:assert/strict";
import { buildGelatoVariantMarketRows } from "../lib/gelato/catalog-sync";

const productUid =
  "apparel_product_gca_t-shirt_gsc_crewneck_gcu_mens_gqa_prm_gsi_s_gco_white_gpr_4-0_comfort-colours_c1717";
const productVariantId = "variant-1";
const syncedAt = "2026-07-30T12:00:00.000Z";

function buildRows(overrides: {
  prices: Array<{
    country?: string;
    currency?: string;
    quantity?: number;
    price?: number;
  }>;
  explicitSupportedCountries?: string[];
  hasExplicitSupportedCountries?: boolean;
  notSupportedCountries?: string[];
  productIsAvailable?: boolean;
}) {
  return buildGelatoVariantMarketRows({
    productUid,
    productVariantId,
    prices: overrides.prices,
    explicitSupportedCountries: overrides.explicitSupportedCountries ?? [],
    hasExplicitSupportedCountries: overrides.hasExplicitSupportedCountries ?? true,
    notSupportedCountries: overrides.notSupportedCountries ?? [],
    productIsAvailable: overrides.productIsAvailable ?? true,
    syncedAt,
  });
}

const supportedOnly = buildRows({
  prices: [{ country: "FR", currency: "USD", quantity: 1, price: 17.7174 }],
  explicitSupportedCountries: ["FR"],
})[0];
assert.equal(supportedOnly.is_available, true);
assert.equal(supportedOnly.availability_source, "gelato_product_details");
assert.equal(supportedOnly.unavailable_reason, null);

const unsupportedOnly = buildRows({
  prices: [{ country: "FR", currency: "USD", quantity: 1, price: 17.7174 }],
  explicitSupportedCountries: [],
  notSupportedCountries: ["FR"],
})[0];
assert.equal(unsupportedOnly.is_available, false);
assert.equal(unsupportedOnly.availability_source, "gelato_product_details");
assert.equal(unsupportedOnly.unavailable_reason, "country_not_supported");

const conflict = buildRows({
  prices: [{ country: "FR", currency: "USD", quantity: 1, price: 17.7174 }],
  explicitSupportedCountries: ["FR"],
  notSupportedCountries: ["FR"],
})[0];
assert.equal(conflict.is_available, false);
assert.equal(conflict.availability_source, "gelato_product_details");
assert.equal(conflict.unavailable_reason, "availability_conflict");

const supportedListAbsent = buildRows({
  prices: [{ country: "PT", currency: "EUR", quantity: 1, price: 15.39 }],
  explicitSupportedCountries: [],
  hasExplicitSupportedCountries: false,
  notSupportedCountries: [],
})[0];
assert.equal(supportedListAbsent.is_available, false);
assert.equal(supportedListAbsent.availability_source, "price_only");
assert.equal(supportedListAbsent.unavailable_reason, "availability_not_confirmed");

const supportedListEmptyBlocked = buildRows({
  prices: [{ country: "US", currency: "USD", quantity: 1, price: 15.39 }],
  explicitSupportedCountries: [],
  hasExplicitSupportedCountries: true,
  notSupportedCountries: ["US"],
})[0];
assert.equal(supportedListEmptyBlocked.is_available, false);
assert.equal(supportedListEmptyBlocked.unavailable_reason, "country_not_supported");

const inactiveProduct = buildRows({
  prices: [{ country: "DE", currency: "EUR", quantity: 1, price: 15.39 }],
  explicitSupportedCountries: ["DE"],
  productIsAvailable: false,
})[0];
assert.equal(inactiveProduct.is_available, false);
assert.equal(inactiveProduct.unavailable_reason, "product_not_active");

const supportedWithoutPrice = buildRows({
  prices: [{ country: "PT", currency: "EUR", quantity: 1 }],
  explicitSupportedCountries: ["PT"],
})[0];
assert.equal(supportedWithoutPrice.is_available, false);
assert.equal(supportedWithoutPrice.product_price, null);
assert.equal(supportedWithoutPrice.unavailable_reason, "price_unavailable");

const secondSync = buildRows({
  prices: [
    { country: "US", currency: "USD", quantity: 1, price: 15.39 },
    { country: "us", currency: "USD", quantity: 1, price: 15.39 },
  ],
  explicitSupportedCountries: ["US"],
});
assert.equal(secondSync.length, 1);
assert.equal(secondSync[0].country_code, "US");

console.log("gelato_variant_markets availability tests passed");
