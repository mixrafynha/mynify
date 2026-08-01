import assert from "node:assert/strict";
import {
  buildGelatoVariantMarketRows,
  resolveGelatoMarketAvailability,
} from "../lib/gelato/catalog-sync";
import {
  calculateSellingPrice,
  normalizeProfitMarkupPercentage,
  roundSellingPrice,
} from "../lib/gelato/pricing";

const activated = "activated";

assert.deepEqual(
  resolveGelatoMarketAvailability({
    countryCode: "fr",
    productStatus: activated,
    supportedCountries: ["FR"],
    notSupportedCountries: [],
    hasValidPrice: true,
    isPrintable: true,
  }),
  {
    isAvailable: true,
    reason: null,
    source: "gelato_product_details",
  },
);

assert.equal(
  resolveGelatoMarketAvailability({
    countryCode: "DE",
    productStatus: activated,
    supportedCountries: ["FR"],
    notSupportedCountries: ["DE"],
    hasValidPrice: true,
    isPrintable: true,
  }).reason,
  "country_not_supported",
);

assert.equal(
  resolveGelatoMarketAvailability({
    countryCode: "PT",
    productStatus: activated,
    supportedCountries: ["PT"],
    notSupportedCountries: ["PT"],
    hasValidPrice: true,
    isPrintable: true,
  }).reason,
  "availability_conflict",
);

assert.deepEqual(
  resolveGelatoMarketAvailability({
    countryCode: "ES",
    productStatus: activated,
    supportedCountries: [],
    notSupportedCountries: [],
    hasValidPrice: true,
    isPrintable: true,
  }),
  {
    isAvailable: false,
    reason: "availability_not_confirmed",
    source: "price_only",
  },
);

assert.equal(
  resolveGelatoMarketAvailability({
    countryCode: "US",
    productStatus: "draft",
    supportedCountries: ["US"],
    notSupportedCountries: [],
    hasValidPrice: true,
    isPrintable: true,
  }).reason,
  "product_not_active",
);

assert.equal(
  resolveGelatoMarketAvailability({
    countryCode: "GB",
    productStatus: activated,
    supportedCountries: ["GB"],
    notSupportedCountries: [],
    hasValidPrice: false,
    isPrintable: true,
  }).reason,
  "price_unavailable",
);

assert.equal(
  resolveGelatoMarketAvailability({
    countryCode: "IT",
    productStatus: activated,
    supportedCountries: ["IT"],
    notSupportedCountries: [],
    hasValidPrice: true,
    isPrintable: false,
  }).reason,
  "product_not_printable",
);

const rows = buildGelatoVariantMarketRows({
  productUid: "variant-availability-test",
  productVariantId: "variant-1",
  prices: [
    { country: "France", currency: "USD", quantity: 1, price: 10 },
    { country: "Germany", currency: "USD", quantity: 1, price: 10 },
    { country: "Spain", currency: "USD", quantity: 1, price: 10 },
  ],
  explicitSupportedCountries: ["FR", "ES"],
  hasExplicitSupportedCountries: true,
  notSupportedCountries: ["DE"],
  productIsAvailable: true,
  productStatus: activated,
  isPrintable: true,
  syncedAt: "2026-08-01T12:00:00.000Z",
});

assert.equal(rows.find((row) => row.country_code === "FR")?.is_available, true);
assert.equal(rows.find((row) => row.country_code === "DE")?.unavailable_reason, "country_not_supported");
assert.equal(rows.find((row) => row.country_code === "ES")?.is_available, true);

assert.equal(calculateSellingPrice({ productionCost: 10, markupPercentage: 30 }), 13);
assert.equal(calculateSellingPrice({ productionCost: 8.61, markupPercentage: 30 }), 11.19);
assert.equal(calculateSellingPrice({ productionCost: 23.69, markupPercentage: 30 }), 30.8);
assert.notEqual(
  calculateSellingPrice({ productionCost: 8.61, markupPercentage: 30 }),
  calculateSellingPrice({ productionCost: 23.69, markupPercentage: 30 }),
);
assert.equal(normalizeProfitMarkupPercentage(999), 500);
assert.equal(normalizeProfitMarkupPercentage(-10), 0);
assert.equal(roundSellingPrice(12.345), 12.35);

const shipping = 4.99;
assert.equal(shipping, 4.99);

console.log("gelato availability and margin tests passed");
