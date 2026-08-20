import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import {
  resolveTrustedPrintFiles,
  TrustedPrintFileError,
  type TrustedPrintFileErrorCode,
} from "./trusted-print-files";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const USER_PRODUCT_ID = "22222222-2222-4222-8222-222222222222";
const OTHER_USER_PRODUCT_ID = "33333333-3333-4333-8333-333333333333";
const R2_BASE = "https://assets.ryfio.test";
const SUPABASE_BASE = "https://project.supabase.co";

const previousEnv = {
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_DESIGN_BUCKET: process.env.SUPABASE_DESIGN_BUCKET,
};

before(() => {
  process.env.R2_PUBLIC_URL = R2_BASE;
  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_BASE;
  process.env.SUPABASE_DESIGN_BUCKET = "design-assets";
});

after(() => {
  for (const [key, value] of Object.entries(previousEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function r2File(side: "front" | "back", userProductId = USER_PRODUCT_ID) {
  const key = `user-products/${userProductId}/print/${side}-1724176800000.png`;
  return { key, url: `${R2_BASE}/${key}` };
}

function expectCode(fn: () => unknown, code: TrustedPrintFileErrorCode) {
  assert.throws(fn, (error) => {
    assert.ok(error instanceof TrustedPrintFileError);
    assert.equal(error.code, code);
    return true;
  });
}

test("accepts a legitimate front-only R2 print file", () => {
  const front = r2File("front");
  assert.deepEqual(
    resolveTrustedPrintFiles({
      userId: USER_ID,
      userProductId: USER_PRODUCT_ID,
      printFiles: { front: front.url, keys: { front: front.key } },
    }),
    [{ type: "default", url: front.url }],
  );
});

test("accepts a legitimate back-only R2 print file", () => {
  const back = r2File("back");
  assert.deepEqual(
    resolveTrustedPrintFiles({
      userId: USER_ID,
      userProductId: USER_PRODUCT_ID,
      printFiles: { back: back.url, keys: { back: back.key } },
    }),
    [{ type: "back", url: back.url }],
  );
});

test("accepts legitimate front and back files in the Gelato order", () => {
  const front = r2File("front");
  const back = r2File("back");
  assert.deepEqual(
    resolveTrustedPrintFiles({
      userId: USER_ID,
      userProductId: USER_PRODUCT_ID,
      printFiles: {
        front: front.url,
        back: back.url,
        keys: { front: front.key, back: back.key },
      },
    }),
    [
      { type: "default", url: front.url },
      { type: "back", url: back.url },
    ],
  );
});

test("rejects an arbitrary external URL", () => {
  expectCode(
    () =>
      resolveTrustedPrintFiles({
        userId: USER_ID,
        userProductId: USER_PRODUCT_ID,
        printFiles: { front: "https://example.com/test.png" },
      }),
    "PRINT_FILE_KEY_MISSING",
  );
});

test("rejects a URL that does not match its valid server-owned key", () => {
  const front = r2File("front");
  expectCode(
    () =>
      resolveTrustedPrintFiles({
        userId: USER_ID,
        userProductId: USER_PRODUCT_ID,
        printFiles: {
          front: "https://example.com/test.png",
          keys: { front: front.key },
        },
      }),
    "PRINT_FILE_URL_MISMATCH",
  );
});

test("rejects a valid R2 file owned by another user_product", () => {
  const other = r2File("front", OTHER_USER_PRODUCT_ID);
  expectCode(
    () =>
      resolveTrustedPrintFiles({
        userId: USER_ID,
        userProductId: USER_PRODUCT_ID,
        printFiles: { front: other.url, keys: { front: other.key } },
      }),
    "PRINT_FILE_OWNERSHIP_INVALID",
  );
});

test("reconstructs a valid legacy Supabase Storage URL from its owned path", () => {
  const path = `${USER_ID}/${USER_PRODUCT_ID}/print/front.png`;
  const expected = `${SUPABASE_BASE}/storage/v1/object/public/design-assets/${path}`;
  assert.deepEqual(
    resolveTrustedPrintFiles({
      userId: USER_ID,
      userProductId: USER_PRODUCT_ID,
      printFiles: { front: expected, paths: { front: path } },
    }),
    [{ type: "default", url: expected }],
  );
});

test("rejects more than two print files", () => {
  expectCode(
    () =>
      resolveTrustedPrintFiles({
        userId: USER_ID,
        userProductId: USER_PRODUCT_ID,
        printFiles: { files: [{}, {}, {}] },
      }),
    "PRINT_FILE_COUNT_INVALID",
  );
});

test("rejects a non-HTTPS trusted storage configuration", () => {
  const front = r2File("front");
  const previous = process.env.R2_PUBLIC_URL;
  process.env.R2_PUBLIC_URL = "http://assets.ryfio.test";
  try {
    expectCode(
      () =>
        resolveTrustedPrintFiles({
          userId: USER_ID,
          userProductId: USER_PRODUCT_ID,
          printFiles: { front: front.url, keys: { front: front.key } },
        }),
      "PRINT_FILE_CONFIG_INVALID",
    );
  } finally {
    process.env.R2_PUBLIC_URL = previous;
  }
});

test("rejects a private IPv6 trusted storage configuration", () => {
  const front = r2File("front");
  const previous = process.env.R2_PUBLIC_URL;
  process.env.R2_PUBLIC_URL = "https://[::1]";
  try {
    expectCode(
      () =>
        resolveTrustedPrintFiles({
          userId: USER_ID,
          userProductId: USER_PRODUCT_ID,
          printFiles: { front: front.url, keys: { front: front.key } },
        }),
      "PRINT_FILE_CONFIG_INVALID",
    );
  } finally {
    process.env.R2_PUBLIC_URL = previous;
  }
});
