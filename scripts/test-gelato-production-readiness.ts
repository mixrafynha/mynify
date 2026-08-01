import assert from "node:assert/strict";
import type { GelatoCatalogSearchProduct } from "../lib/gelato/catalog-sync";
import {
  buildGelatoFamilyKey,
  buildGelatoVariantMarketRows,
  extractGelatoColorImages,
  filterGelatoProductsByFamilyKey,
  pickVariantReferenceMarket,
} from "../lib/gelato/catalog-sync";
import { resolveCountryCode } from "../lib/gelato/country-code-map";

const syncedAt = "2026-08-01T12:00:00.000Z";
const productVariantIds = new Map<string, string>();

const baseAttributes = {
  GarmentCategory: "t-shirt",
  GarmentSubcategory: "crewneck",
  GarmentCut: "unisex",
  GarmentQuality: "heavy-weight",
  GarmentPrint: "4-0",
  ApparelManufacturer: "gildan",
  ApparelManufacturerSKU: "5000",
};

const gelatoFamilyProducts = [
  {
    productUid: "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_heavy-weight_gsi_s_gco_white_gpr_4-0_gildan_5000",
    attributes: { ...baseAttributes, GarmentColor: "white", GarmentSize: "S" },
    mockups: { front: "https://cdn.example.test/white-front.png" },
    thumbnail: "https://cdn.example.test/white-thumb.png",
  },
  {
    productUid: "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_heavy-weight_gsi_m_gco_white_gpr_4-0_gildan_5000",
    attributes: { ...baseAttributes, GarmentColor: "white", GarmentSize: "M" },
    mockups: { front: "https://cdn.example.test/white-front.png" },
  },
  {
    productUid: "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_heavy-weight_gsi_s_gco_black_gpr_4-0_gildan_5000",
    attributes: { ...baseAttributes, GarmentColor: "black", GarmentSize: "S" },
    mockups: { front: "https://cdn.example.test/black-front.png" },
    thumbnail: "https://cdn.example.test/black-thumb.png",
  },
  {
    productUid: "apparel_product_gca_hoodie_gsc_pullover_gcu_unisex_gqa_heavy-weight_gsi_s_gco_black_gpr_4-0_gildan_5000",
    attributes: { ...baseAttributes, GarmentCategory: "hoodie", GarmentColor: "black", GarmentSize: "S" },
  },
] as unknown as GelatoCatalogSearchProduct[];

const familyKey = buildGelatoFamilyKey(gelatoFamilyProducts[0].attributes);
const familyProducts = filterGelatoProductsByFamilyKey(gelatoFamilyProducts, familyKey);

assert.equal(familyProducts.length, 3);
assert.deepEqual(
  Array.from(new Set(familyProducts.map((product) => product.attributes.GarmentColor))).sort(),
  ["black", "white"],
);
assert.deepEqual(
  Array.from(new Set(familyProducts.map((product) => product.attributes.GarmentSize))).sort(),
  ["M", "S"],
);

const whiteImages = extractGelatoColorImages(
  familyProducts.filter((product) => product.attributes.GarmentColor === "white"),
);
const blackImages = extractGelatoColorImages(
  familyProducts.filter((product) => product.attributes.GarmentColor === "black"),
);

assert.equal(whiteImages.mockup_front, "https://cdn.example.test/white-front.png");
assert.equal(whiteImages.thumbnail, "https://cdn.example.test/white-thumb.png");
assert.equal(blackImages.mockup_front, "https://cdn.example.test/black-front.png");
assert.equal(blackImages.thumbnail, "https://cdn.example.test/black-thumb.png");

function marketsFor(productUid: string, productVariantId: string, price: number) {
  return buildGelatoVariantMarketRows({
    productUid,
    productVariantId,
    prices: [
      { country: "France", currency: "USD", quantity: 1, price },
      { countryCode: "US", currency: "USD", quantity: 1, price: price + 2 },
      { country_code: "pt", currency: "EUR", quantity: 1, price: price + 1 },
    ],
    notSupportedCountries: [],
    explicitSupportedCountries: ["France", "US", "PT"],
    hasExplicitSupportedCountries: true,
    productIsAvailable: true,
    syncedAt,
  });
}

const variantMarketFingerprints = new Set<string>();
const variantPrices = familyProducts.map((product, index) => {
  const variantId = productVariantIds.get(product.productUid) ?? `variant-${index + 1}`;
  productVariantIds.set(product.productUid, variantId);

  const markets = marketsFor(product.productUid, variantId, 8.61 + index);
  for (const market of markets) {
    assert.match(market.country_code, /^[A-Z]{2}$/);
    assert.equal(resolveCountryCode(market.country_code), market.country_code);
    variantMarketFingerprints.add(
      `${market.product_variant_id}:${market.country_code}:${market.currency}:${market.quantity}`,
    );
  }

  return pickVariantReferenceMarket(markets)?.product_price ?? null;
});

assert.deepEqual(variantPrices, [8.61, 9.61, 10.61]);
assert.equal(variantMarketFingerprints.size, familyProducts.length * 3);

const secondRunFingerprints = new Set<string>();
for (const [index, product] of familyProducts.entries()) {
  const variantId = productVariantIds.get(product.productUid);
  assert.ok(variantId);
  for (const market of marketsFor(product.productUid, variantId, 8.61 + index)) {
    secondRunFingerprints.add(
      `${market.product_variant_id}:${market.country_code}:${market.currency}:${market.quantity}`,
    );
  }
}

assert.deepEqual(secondRunFingerprints, variantMarketFingerprints);

console.log("gelato production readiness helper tests passed");
