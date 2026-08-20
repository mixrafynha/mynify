import assert from "node:assert/strict";
import test, { mock } from "node:test";
import {
  buildGelatoCheckoutQuotePayload,
  resolveCheckoutQuote,
} from "@/lib/gelato/checkout-quote";
import { TrustedPrintFileError } from "@/lib/server/trusted-print-files";
import {
  authorizeAvailabilityRequest,
  buildSafeAvailabilityQuoteLog,
  resolveAvailabilityTrustedPrintFiles,
} from "./security";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";
const USER_PRODUCT_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_PRODUCT_ID = "44444444-4444-4444-8444-444444444444";
const R2_BASE = "https://assets.ryfio.test";
const FRONT_KEY = `user-products/${USER_PRODUCT_ID}/print/front-1720000000000.png`;
const BACK_KEY = `user-products/${USER_PRODUCT_ID}/print/back-1720000000001.png`;

function withR2Environment<T>(run: () => T): T {
  const previous = process.env.R2_PUBLIC_URL;
  process.env.R2_PUBLIC_URL = R2_BASE;
  try {
    return run();
  } finally {
    if (previous === undefined) delete process.env.R2_PUBLIC_URL;
    else process.env.R2_PUBLIC_URL = previous;
  }
}

function storedPrintFiles(sides: Array<"front" | "back">) {
  const keys: Record<string, string> = {};
  const record: Record<string, unknown> = { keys };
  if (sides.includes("front")) {
    keys.front = FRONT_KEY;
    record.front = `${R2_BASE}/${FRONT_KEY}`;
  }
  if (sides.includes("back")) {
    keys.back = BACK_KEY;
    record.back = `${R2_BASE}/${BACK_KEY}`;
  }
  return record;
}

function resolveSides(sides: Array<"front" | "back">) {
  return withR2Environment(() =>
    resolveAvailabilityTrustedPrintFiles({
      storedPrintFiles: storedPrintFiles(sides),
      userId: USER_ID,
      userProductId: USER_PRODUCT_ID,
    }),
  );
}

test("authenticated checkout availability access remains allowed", async () => {
  let rateLimitKey = "";
  const result = await authorizeAvailabilityRequest({
    loadUserId: async () => USER_ID,
    consumeRateLimit: async (key) => {
      rateLimitKey = key;
      return { success: true };
    },
    requestIp: "203.0.113.10",
  });

  assert.deepEqual(result, { ok: true, userId: USER_ID });
  assert.equal(rateLimitKey, `${USER_ID}:203.0.113.10`);
});

test("unauthenticated availability is rejected before provider work", async () => {
  let rateLimitCalled = false;
  const result = await authorizeAvailabilityRequest({
    loadUserId: async () => null,
    consumeRateLimit: async () => {
      rateLimitCalled = true;
      return { success: true };
    },
    requestIp: "203.0.113.10",
  });

  assert.equal(result.ok, false);
  assert.equal(result.ok ? null : result.status, 401);
  assert.equal(rateLimitCalled, false);
});

test("rate limiter rejection and infrastructure failure both fail closed", async () => {
  const limited = await authorizeAvailabilityRequest({
    loadUserId: async () => USER_ID,
    consumeRateLimit: async () => ({ success: false }),
    requestIp: "203.0.113.10",
  });
  assert.equal(limited.ok ? null : limited.status, 429);

  const unavailable = await authorizeAvailabilityRequest({
    loadUserId: async () => USER_ID,
    consumeRateLimit: async () => {
      throw new Error("rate store unavailable");
    },
    requestIp: "203.0.113.10",
  });
  assert.equal(unavailable.ok ? null : unavailable.status, 503);
  assert.equal(unavailable.ok ? null : unavailable.code, "RATE_LIMIT_UNAVAILABLE");
});

test("front-only trusted file resolves from its server-owned key", () => {
  assert.deepEqual(resolveSides(["front"]), [
    { type: "default", url: `${R2_BASE}/${FRONT_KEY}` },
  ]);
});

test("back-only trusted file remains supported", () => {
  assert.deepEqual(resolveSides(["back"]), [
    { type: "back", url: `${R2_BASE}/${BACK_KEY}` },
  ]);
});

test("front and back trusted files remain supported together", () => {
  assert.deepEqual(resolveSides(["front", "back"]), [
    { type: "default", url: `${R2_BASE}/${FRONT_KEY}` },
    { type: "back", url: `${R2_BASE}/${BACK_KEY}` },
  ]);
});

test("external HTTPS URL cannot replace a trusted stored print file", () => {
  assert.throws(
    () => withR2Environment(() => resolveAvailabilityTrustedPrintFiles({
      storedPrintFiles: {
        keys: { front: FRONT_KEY },
        front: "https://example.com/file.pdf",
      },
      userId: USER_ID,
      userProductId: USER_PRODUCT_ID,
    })),
    (error) => error instanceof TrustedPrintFileError && error.code === "PRINT_FILE_URL_MISMATCH",
  );
});

test("R2 key belonging to another user_product is rejected", () => {
  const otherKey = `user-products/${OTHER_PRODUCT_ID}/print/front-1720000000000.png`;
  assert.throws(
    () => withR2Environment(() => resolveAvailabilityTrustedPrintFiles({
      storedPrintFiles: {
        keys: { front: otherKey },
        front: `${R2_BASE}/${otherKey}`,
      },
      userId: USER_ID,
      userProductId: USER_PRODUCT_ID,
    })),
    (error) => error instanceof TrustedPrintFileError && error.code === "PRINT_FILE_OWNERSHIP_INVALID",
  );
});

test("direct-upload key belonging to another user is rejected", () => {
  const otherKey = `users/${OTHER_USER_ID}/${USER_PRODUCT_ID}/print/front.png`;
  assert.throws(
    () => withR2Environment(() => resolveAvailabilityTrustedPrintFiles({
      storedPrintFiles: {
        keys: { front: otherKey },
        front: `${R2_BASE}/${otherKey}`,
      },
      userId: USER_ID,
      userProductId: USER_PRODUCT_ID,
    })),
    (error) => error instanceof TrustedPrintFileError && error.code === "PRINT_FILE_KEY_INVALID",
  );
});

test("missing trusted storage data produces no frontend URL fallback", () => {
  const files = withR2Environment(() => resolveAvailabilityTrustedPrintFiles({
    storedPrintFiles: {},
    browserPrintFiles: [{ type: "default", url: "https://example.com/file.pdf" }],
    userId: USER_ID,
    userProductId: USER_PRODUCT_ID,
  }));
  assert.deepEqual(files, []);
  assert.equal(JSON.stringify(files).includes("example.com"), false);
});

test("availability quote log is allowlisted and excludes every sensitive value", () => {
  const files = resolveSides(["front", "back"]);
  const log = buildSafeAvailabilityQuoteLog({
    requestId: "request-123",
    userId: USER_ID,
    countryCode: "PT",
    items: [{
      itemReferenceId: "cart-123",
      productUid: "product-uid-123",
      quantity: 1,
      printFiles: files,
    }],
    recipient: {
      firstName: "SensitiveFirstName",
      lastName: "SensitiveLastName",
      email: "sensitive@example.com",
      phone: "+351999999999",
      addressLine1: "Sensitive Street 10",
      postcode: "1000-001",
    },
    customerReferenceId: "sensitive@example.com",
  } as Parameters<typeof buildSafeAvailabilityQuoteLog>[0] & Record<string, unknown>);
  const serialized = JSON.stringify(log);

  for (const sensitive of [
    "SensitiveFirstName",
    "SensitiveLastName",
    "sensitive@example.com",
    "+351999999999",
    "Sensitive Street 10",
    "1000-001",
    FRONT_KEY,
    BACK_KEY,
    `${R2_BASE}/${FRONT_KEY}`,
  ]) {
    assert.equal(serialized.includes(sensitive), false, sensitive);
  }
  for (const forbiddenField of [
    "recipient",
    "customerReferenceId",
    "firstName",
    "lastName",
    "email",
    "phone",
    "addressLine1",
    "postcode",
    "pdfUrl",
    "url",
  ]) {
    assert.equal(serialized.includes(`"${forbiddenField}"`), false, forbiddenField);
  }
  assert.equal(serialized.includes("assets.ryfio.test"), true);
});

test("mocked Gelato quote receives only the resolved trusted URL", async () => {
  const previousKey = process.env.GELATO_API_KEY;
  process.env.GELATO_API_KEY = "test-gelato-key";
  const arbitraryBrowserUrl = "https://example.com/file.pdf";
  const providerFiles = withR2Environment(() => resolveAvailabilityTrustedPrintFiles({
    storedPrintFiles: storedPrintFiles(["front"]),
    browserPrintFiles: [{ type: "default", url: arbitraryBrowserUrl }],
    userId: USER_ID,
    userProductId: USER_PRODUCT_ID,
  }));
  let providerPayload: Record<string, unknown> | null = null;
  const fetchMock = mock.method(
    globalThis,
    "fetch",
    async (_input: string | URL | Request, init?: RequestInit) => {
      providerPayload = JSON.parse(String(init?.body || "{}")) as Record<string, unknown>;
      return new Response(JSON.stringify({
        production: {
          shipments: [{
            uid: "standard",
            promiseUid: "promise-standard",
            name: "Standard",
            price: 4.5,
            fulfillmentCountry: "PT",
            serviceType: "standard",
          }],
        },
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  );

  try {
    const input = {
      productUid: "product-uid-123",
      quantity: 1,
      shippingAddress: {
        firstName: "Checkout",
        lastName: "Customer",
        addressLine1: "Street 1",
        city: "Lisbon",
        postalCode: "1000-001",
        countryCode: "PT",
      },
      printFiles: providerFiles,
      items: [{ productUid: "product-uid-123", quantity: 1, printFiles: providerFiles }],
      currencyIsoCode: "EUR",
    };
    const quote = await resolveCheckoutQuote(input);
    const directPayload = buildGelatoCheckoutQuotePayload(input);
    const serializedProviderPayload = JSON.stringify(providerPayload);

    assert.equal(quote.available, true);
    assert.equal(directPayload.products[0].pdfUrl, `${R2_BASE}/${FRONT_KEY}`);
    assert.equal(serializedProviderPayload.includes(`${R2_BASE}/${FRONT_KEY}`), true);
    assert.equal(serializedProviderPayload.includes(arbitraryBrowserUrl), false);
  } finally {
    fetchMock.mock.restore();
    if (previousKey === undefined) delete process.env.GELATO_API_KEY;
    else process.env.GELATO_API_KEY = previousKey;
  }
});
