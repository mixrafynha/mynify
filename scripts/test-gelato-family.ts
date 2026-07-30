import assert from "node:assert/strict";
import {
  buildGelatoFamilyKey,
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

console.log("gelato family helpers tests passed");
