import assert from "node:assert/strict";
import { resolveGelatoColorHex } from "../lib/gelato/gelato-color-map";
import {
  buildGelatoVariantMarketRows,
  pickVariantReferenceMarket,
} from "../lib/gelato/catalog-sync";

const syncedAt = "2026-07-31T12:00:00.000Z";

assert.equal(
  resolveGelatoColorHex({ colorKey: "ash", colorName: "Ash", gelatoHex: "#cccccc" }),
  "#B7B7B7",
);
assert.equal(
  resolveGelatoColorHex({ colorKey: "black", colorName: "Black", gelatoHex: "#111111" }),
  "#111111",
);
assert.equal(
  resolveGelatoColorHex({ colorKey: "red", colorName: "Red", gelatoHex: "#DC2626" }),
  "#DC2626",
);
assert.equal(
  resolveGelatoColorHex({ colorKey: "unknown-color", colorName: "Unknown Color", gelatoHex: "#ccc" }),
  "#9CA3AF",
);

function marketsFor(productVariantId: string, price: number) {
  return buildGelatoVariantMarketRows({
    productUid: productVariantId,
    productVariantId,
    prices: [
      { country: "FR", currency: "USD", quantity: 1, price },
      { country: "US", currency: "USD", quantity: 1, price: price + 1 },
    ],
    notSupportedCountries: [],
    explicitSupportedCountries: ["FR", "US"],
    hasExplicitSupportedCountries: true,
    productIsAvailable: true,
    syncedAt,
  });
}

const smallMarket = pickVariantReferenceMarket(marketsFor("variant-s", 8.61));
const twoXlMarket = pickVariantReferenceMarket(marketsFor("variant-2xl", 11.35));
const fourXlMarket = pickVariantReferenceMarket(marketsFor("variant-4xl", 23.69));

assert.equal(smallMarket?.country_code, "FR");
assert.equal(smallMarket?.product_price, 8.61);
assert.equal(twoXlMarket?.product_price, 11.35);
assert.equal(fourXlMarket?.product_price, 23.69);
assert.notEqual(smallMarket?.product_price, twoXlMarket?.product_price);
assert.notEqual(twoXlMarket?.product_price, fourXlMarket?.product_price);

const noFrMarket = pickVariantReferenceMarket(
  buildGelatoVariantMarketRows({
    productUid: "variant-no-fr",
    productVariantId: "variant-no-fr",
    prices: [{ country: "US", currency: "USD", quantity: 1, price: 10 }],
    notSupportedCountries: [],
    explicitSupportedCountries: ["US"],
    hasExplicitSupportedCountries: true,
    productIsAvailable: true,
    syncedAt,
  }),
);

assert.equal(noFrMarket?.country_code, "US");
assert.equal(noFrMarket?.product_price, 10);

console.log("gelato color and variant price tests passed");
