import assert from "node:assert/strict";
import type { GelatoCatalogSearchProduct } from "../lib/gelato/catalog-sync";
import {
  buildGelatoFamilyKey,
  extractGelatoColorImages,
  filterGelatoProductsByFamilyKey,
} from "../lib/gelato/catalog-sync";

const referenceAttributes = {
  GarmentCategory: "t-shirt",
  GarmentStyle: "crewneck",
  GarmentCut: "mens",
  GarmentQuality: "prm",
  GarmentPrint: "4-0",
  ApparelManufacturer: "comfort-colours",
  ApparelManufacturerSKU: "c1717",
  GarmentColor: "white",
  GarmentSize: "S",
};

const sameFamily = buildGelatoFamilyKey({
  ...referenceAttributes,
  GarmentColor: "red",
  GarmentSize: "L",
});

const referenceFamily = buildGelatoFamilyKey(referenceAttributes);
const otherFamily = buildGelatoFamilyKey({
  ...referenceAttributes,
  GarmentCategory: "hoodie",
});

assert.equal(referenceFamily, sameFamily);
assert.notEqual(referenceFamily, otherFamily);

const filtered = filterGelatoProductsByFamilyKey(
  [
    {
      productUid: "white-s",
      attributes: referenceAttributes,
    },
    {
      productUid: "red-l",
      attributes: {
        ...referenceAttributes,
        GarmentColor: "red",
        GarmentSize: "L",
      },
    },
    {
      productUid: "hoodie-s",
      attributes: {
        ...referenceAttributes,
        GarmentCategory: "hoodie",
      },
    },
  ],
  referenceFamily,
);

assert.equal(filtered.length, 2);
assert.deepEqual(
  filtered.map((product) => product.productUid).sort(),
  ["red-l", "white-s"],
);

const colorImages = extractGelatoColorImages([
  {
    productUid: "black-s",
    attributes: {
      ...referenceAttributes,
      GarmentColor: "black",
    },
    mockups: {
      front: "https://cdn.example.test/black-front.png",
      back: "https://cdn.example.test/black-back.png",
    },
    thumbnailUrl: "https://cdn.example.test/black-thumb.png",
  } as unknown as GelatoCatalogSearchProduct,
]);

assert.equal(colorImages.mockup_front, "https://cdn.example.test/black-front.png");
assert.equal(colorImages.mockup_back, "https://cdn.example.test/black-back.png");
assert.equal(colorImages.thumbnail, "https://cdn.example.test/black-thumb.png");

console.log("gelato family helpers tests passed");
