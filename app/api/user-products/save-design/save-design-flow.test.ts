import assert from "node:assert/strict";
import { test } from "node:test";
import { addSavedDesignToCart } from "./cart";
import { buildUserProductSavePayload } from "./save-design-payload";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const DESIGN_ID = "22222222-2222-4222-8222-222222222222";
const PRODUCT_ID = "33333333-3333-4333-8333-333333333333";

const baseProduct = {
  id: PRODUCT_ID,
  title: "Trusted product",
  description: "Trusted description",
  price: 20,
  currency: "EUR",
  image: "https://assets.ryfio.test/product.webp",
  images: ["https://assets.ryfio.test/product.webp"],
  category: "shirt",
  slug: "trusted-product",
};

function textElement(id: string) {
  return { id, type: "text", text: "RYFIO", meta: { hidden: false } };
}

async function buildPayload(front: unknown[], back: unknown[]) {
  return buildUserProductSavePayload({
    supabase: {} as any,
    userId: USER_ID,
    designId: DESIGN_ID,
    baseProduct,
    body: {
      schemaVersion: 4,
      title: "Attacker title",
      description: "Attacker description",
      price: 0,
      markup: -999,
      final_price: 0,
      status: "published",
      is_active: false,
      sales_count: 999999,
      base_product_id: "44444444-4444-4444-8444-444444444444",
      designData: {
        sides: {
          front: { elements: front },
          back: { elements: back },
        },
      },
      designFront: front,
      designBack: back,
      printFiles: {
        front: "https://example.com/test.png",
        back: "https://example.com/test-back.png",
      },
      mockups: {},
    },
  });
}

test("builds a front-only server-owned user_product payload", async () => {
  const payload = await buildPayload([textElement("front")], []);
  assert.equal(payload.user_id, USER_ID);
  assert.equal(payload.base_product_id, PRODUCT_ID);
  assert.equal(payload.title, baseProduct.title);
  assert.equal(payload.description, baseProduct.description);
  assert.equal(payload.price, baseProduct.price);
  assert.equal(payload.status, "draft");
  assert.equal(payload.is_active, true);
  assert.equal(payload.print_files.front, null);
  assert.equal(payload.print_files.back, null);
  assert.equal(payload.design_front.length, 1);
  assert.equal(payload.design_back.length, 0);
});

test("preserves a back-only design", async () => {
  const payload = await buildPayload([], [textElement("back")]);
  assert.equal(payload.design_front.length, 0);
  assert.equal(payload.design_back.length, 1);
  assert.equal((payload.design_data as any).sides.back.elements.length, 1);
});

test("preserves front and back together", async () => {
  const payload = await buildPayload(
    [textElement("front")],
    [textElement("back")],
  );
  assert.equal(payload.design_front.length, 1);
  assert.equal(payload.design_back.length, 1);
  assert.deepEqual(payload.print_files.keys, { front: null, back: null });
});

test("cart receives the owned user_product relationship", async () => {
  let inserted: Record<string, unknown> | null = null;
  const fakeSupabase = {
    from(table: string) {
      assert.equal(table, "cart_items");
      return {
        insert(payload: Record<string, unknown>) {
          inserted = payload;
          return {
            select() {
              return {
                async single() {
                  return { data: { id: "cart-item", ...payload }, error: null };
                },
              };
            },
          };
        },
      };
    },
  };

  const result = await addSavedDesignToCart({
    supabase: fakeSupabase as any,
    userId: USER_ID,
    userProduct: {
      id: DESIGN_ID,
      base_product_id: PRODUCT_ID,
      title: baseProduct.title,
      price: baseProduct.price,
      final_price: baseProduct.price,
      design_data: { selectedVariant: null },
      print_files: {},
      mockups: { front: "https://assets.ryfio.test/mockup.webp" },
    },
    body: { quantity: 1 },
  });

  assert.equal(result.error, null);
  const insertedPayload = (inserted ?? {}) as Record<string, unknown>;
  assert.equal(insertedPayload.user_id, USER_ID);
  assert.equal(insertedPayload.user_product_id, DESIGN_ID);
  assert.equal(insertedPayload.design_id, DESIGN_ID);
  assert.equal(insertedPayload.product_id, PRODUCT_ID);
});
