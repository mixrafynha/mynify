import assert from "node:assert/strict";
import { resolveCountryCode } from "../lib/gelato/country-code-map";
import { buildGelatoVariantMarketRows } from "../lib/gelato/catalog-sync";

const expectedCountryCodes = new Map([
  ["France", "FR"],
  ["Portugal", "PT"],
  ["Spain", "ES"],
  ["Germany", "DE"],
  ["Italy", "IT"],
  ["Belgium", "BE"],
  ["Netherlands", "NL"],
  ["United Kingdom", "GB"],
  ["United States", "US"],
  ["Canada", "CA"],
  ["Australia", "AU"],
  ["Brazil", "BR"],
  ["Japan", "JP"],
]);

for (const [countryName, isoCode] of expectedCountryCodes) {
  assert.equal(resolveCountryCode({ country: countryName }), isoCode);
}

assert.equal(resolveCountryCode({ countryCode: "fr", country: "Germany" }), "FR");
assert.equal(resolveCountryCode({ country_code: "pt" }), "PT");
assert.equal(resolveCountryCode({ isoCode: "de" }), "DE");
assert.equal(resolveCountryCode("Spain"), "ES");

const warn = console.warn;
let warningCount = 0;
console.warn = () => {
  warningCount += 1;
};
assert.equal(resolveCountryCode({ country: "Atlantis" }), null);
assert.equal(warningCount, 1);
console.warn = warn;

const markets = buildGelatoVariantMarketRows({
  productUid:
    "apparel_product_gca_t-shirt_gsc_crewneck_gcu_mens_gqa_prm_gsi_s_gco_white_gpr_4-0_comfort-colours_c1717",
  productVariantId: "variant-1",
  prices: Array.from(expectedCountryCodes.keys()).map((country) => ({
    country,
    currency: "USD",
    quantity: 1,
    price: 15.39,
  })),
  explicitSupportedCountries: Array.from(expectedCountryCodes.keys()),
  hasExplicitSupportedCountries: true,
  notSupportedCountries: [],
  productIsAvailable: true,
  syncedAt: "2026-08-01T12:00:00.000Z",
});

assert.deepEqual(
  markets.map((market) => market.country_code).sort(),
  Array.from(expectedCountryCodes.values()).sort(),
);
assert.equal(markets.every((market) => /^[A-Z]{2}$/.test(market.country_code)), true);

console.log("gelato country code normalization tests passed");
