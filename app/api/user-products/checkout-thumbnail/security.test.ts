import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import {
  CheckoutThumbnailError,
  MAX_CHECKOUT_THUMBNAIL_IMAGE_BYTES,
  assertCheckoutThumbnailMetadata,
  checkoutThumbnailKey,
  createCheckoutThumbnailPipeline,
  decodeCheckoutThumbnailDataUrl,
  processCheckoutThumbnailDataUrl,
  readCheckoutThumbnailBody,
  type CheckoutThumbnailPipelineDependencies,
  type ProcessedThumbnail,
} from "./security";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const PRODUCT_ID = "22222222-2222-4222-8222-222222222222";

const fakeProcessed: ProcessedThumbnail = {
  buffer: Buffer.from("webp"),
  decodedBytes: 4,
  declaredMimeType: "image/png",
  format: "png",
  width: 900,
  height: 900,
};

function requestBody(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    dataUrl: "data:image/png;base64,AAAA",
    userProductId: PRODUCT_ID,
    side: "front",
    ...overrides,
  });
}

function request(rawBody = requestBody(), headers?: HeadersInit) {
  return new Request("https://www.ryfio.com/api/user-products/checkout-thumbnail", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: rawBody,
  });
}

function expectError(error: unknown, status: number, code: string) {
  assert.ok(error instanceof CheckoutThumbnailError);
  assert.equal(error.status, status);
  assert.equal(error.code, code);
  return true;
}

type Auth = { userId: string };
type Product = { id: string };

function dependencies(args: {
  events?: string[];
  owned?: Product | null;
  limited?: boolean;
  limiterError?: Error;
  processError?: Error;
  uploadError?: Error;
  persistError?: Error;
  uploadedKeys?: string[];
} = {}): CheckoutThumbnailPipelineDependencies<Auth, Product> {
  const events = args.events ?? [];
  return {
    authenticate: async () => {
      events.push("auth");
      return { userId: USER_ID };
    },
    authenticatedUserId: (auth) => auth.userId,
    requestIp: () => "203.0.113.1",
    rateLimit: async () => {
      events.push("rate");
      if (args.limiterError) throw args.limiterError;
      return { success: !args.limited };
    },
    loadOwnedProduct: async () => {
      events.push("ownership");
      return args.owned === undefined ? { id: PRODUCT_ID } : args.owned;
    },
    processImage: async () => {
      events.push("sharp");
      if (args.processError) throw args.processError;
      return fakeProcessed;
    },
    upload: async ({ key }) => {
      events.push("r2");
      args.uploadedKeys?.push(key);
      if (args.uploadError) throw args.uploadError;
      return { url: `https://assets.ryfio.test/${key}` };
    },
    persist: async () => {
      events.push("db");
      if (args.persistError) throw args.persistError;
    },
  };
}

test("legitimate owned thumbnail follows ownership -> Sharp -> R2 -> DB", async () => {
  const events: string[] = [];
  const pipeline = createCheckoutThumbnailPipeline(dependencies({ events }));
  const result = await pipeline(request());
  assert.equal(result.status, 200);
  assert.equal(result.body.savedPath, "mockups.checkout_thumbnail_url");
  assert.deepEqual(events, ["auth", "rate", "ownership", "sharp", "r2", "db"]);
});

test("missing user product is rejected before Sharp and R2", async () => {
  const events: string[] = [];
  const pipeline = createCheckoutThumbnailPipeline(dependencies({ events, owned: null }));
  await assert.rejects(() => pipeline(request()), (error) => expectError(error, 404, "USER_PRODUCT_NOT_FOUND"));
  assert.deepEqual(events, ["auth", "rate", "ownership"]);
});

test("cross-user product is rejected before Sharp and R2", async () => {
  const events: string[] = [];
  const pipeline = createCheckoutThumbnailPipeline(dependencies({ events, owned: null }));
  await assert.rejects(() => pipeline(request()), (error) => expectError(error, 404, "USER_PRODUCT_NOT_FOUND"));
  assert.equal(events.includes("sharp"), false);
  assert.equal(events.includes("r2"), false);
});

test("declared oversized body returns 413 before authentication", async () => {
  const events: string[] = [];
  const pipeline = createCheckoutThumbnailPipeline(dependencies({ events }));
  await assert.rejects(
    () => pipeline(request("{}", { "content-length": String(12 * 1024 * 1024 + 1) })),
    (error) => expectError(error, 413, "BODY_TOO_LARGE"),
  );
  assert.deepEqual(events, []);
});

test("missing Content-Length cannot bypass the actual byte limit", async () => {
  const req = request("12345678901");
  req.headers.delete("content-length");
  await assert.rejects(() => readCheckoutThumbnailBody(req, 10), (error) => expectError(error, 413, "BODY_TOO_LARGE"));
});

test("false Content-Length cannot bypass the actual byte limit", async () => {
  const req = request("12345678901", { "content-length": "1" });
  await assert.rejects(() => readCheckoutThumbnailBody(req, 10), (error) => expectError(error, 413, "BODY_TOO_LARGE"));
});

test("invalid base64 is rejected", () => {
  assert.throws(
    () => decodeCheckoutThumbnailDataUrl("data:image/png;base64,!!!!"),
    (error) => expectError(error, 400, "INVALID_BASE64"),
  );
});

test("invalid base64 never reaches R2 through the pipeline", async () => {
  const events: string[] = [];
  const deps = dependencies({ events });
  deps.processImage = processCheckoutThumbnailDataUrl;
  const pipeline = createCheckoutThumbnailPipeline(deps);
  await assert.rejects(
    () => pipeline(request(requestBody({ dataUrl: "data:image/png;base64,!!!!" }))),
    (error) => expectError(error, 400, "INVALID_BASE64"),
  );
  assert.equal(events.includes("r2"), false);
});

test("oversized base64 is rejected before Buffer decoding", () => {
  const oversizedLength = Math.ceil((MAX_CHECKOUT_THUMBNAIL_IMAGE_BYTES + 1) / 3) * 4;
  const base64 = "A".repeat(oversizedLength);
  assert.throws(
    () => decodeCheckoutThumbnailDataUrl(`data:image/png;base64,${base64}`),
    (error) => expectError(error, 413, "IMAGE_TOO_LARGE"),
  );
});

test("SVG and XML data URLs are rejected", () => {
  const svg = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>").toString("base64");
  assert.throws(
    () => decodeCheckoutThumbnailDataUrl(`data:image/svg+xml;base64,${svg}`),
    (error) => expectError(error, 400, "UNSUPPORTED_IMAGE_TYPE"),
  );
});

test("MIME spoofing is rejected using decoded metadata", async () => {
  const jpeg = await sharp({ create: { width: 8, height: 8, channels: 4, background: "red" } }).jpeg().toBuffer();
  await assert.rejects(
    () => processCheckoutThumbnailDataUrl(`data:image/png;base64,${jpeg.toString("base64")}`),
    (error) => expectError(error, 400, "IMAGE_TYPE_MISMATCH"),
  );
});

test("excessive width is rejected", () => {
  assert.throws(
    () => assertCheckoutThumbnailMetadata({ format: "png", width: 4097, height: 1 }, "image/png"),
    (error) => expectError(error, 413, "IMAGE_DIMENSIONS_TOO_LARGE"),
  );
});

test("excessive total pixels are rejected", () => {
  assert.throws(
    () => assertCheckoutThumbnailMetadata({ format: "png", width: 4096, height: 4096 }, "image/png"),
    (error) => expectError(error, 413, "IMAGE_DIMENSIONS_TOO_LARGE"),
  );
});

test("rate limit returns 429 before ownership and image work", async () => {
  const events: string[] = [];
  const pipeline = createCheckoutThumbnailPipeline(dependencies({ events, limited: true }));
  await assert.rejects(() => pipeline(request()), (error) => expectError(error, 429, "RATE_LIMITED"));
  assert.deepEqual(events, ["auth", "rate"]);
});

test("rate limiter failure returns 503 fail-closed", async () => {
  const events: string[] = [];
  const pipeline = createCheckoutThumbnailPipeline(dependencies({ events, limiterError: new Error("offline") }));
  await assert.rejects(() => pipeline(request()), (error) => expectError(error, 503, "RATE_LIMIT_UNAVAILABLE"));
  assert.deepEqual(events, ["auth", "rate"]);
});

test("Sharp failure never calls R2", async () => {
  const events: string[] = [];
  const pipeline = createCheckoutThumbnailPipeline(dependencies({ events, processError: new Error("sharp failed") }));
  await assert.rejects(() => pipeline(request()), /sharp failed/);
  assert.equal(events.includes("r2"), false);
});

test("invalid schema never calls ownership, Sharp, or R2", async () => {
  const events: string[] = [];
  const pipeline = createCheckoutThumbnailPipeline(dependencies({ events }));
  await assert.rejects(
    () => pipeline(request(requestBody({ userProductId: "not-a-uuid" }))),
    (error) => expectError(error, 400, "INVALID_USER_PRODUCT_ID"),
  );
  assert.deepEqual(events, ["auth", "rate"]);
});

test("R2 failure never updates the database", async () => {
  const events: string[] = [];
  const pipeline = createCheckoutThumbnailPipeline(dependencies({ events, uploadError: new Error("r2 failed") }));
  await assert.rejects(() => pipeline(request()), /r2 failed/);
  assert.equal(events.includes("db"), false);
});

test("DB failure reuses one deterministic R2 key instead of creating orphans", async () => {
  const uploadedKeys: string[] = [];
  const pipeline = createCheckoutThumbnailPipeline(
    dependencies({ uploadedKeys, persistError: new Error("db failed") }),
  );
  await assert.rejects(() => pipeline(request()), /db failed/);
  await assert.rejects(() => pipeline(request()), /db failed/);
  assert.deepEqual(uploadedKeys, [
    checkoutThumbnailKey(USER_ID, PRODUCT_ID, "front"),
    checkoutThumbnailKey(USER_ID, PRODUCT_ID, "front"),
  ]);
});

test("legitimate 900x900 PNG is normalized to WebP", async () => {
  const png = await sharp({ create: { width: 900, height: 900, channels: 4, background: "transparent" } })
    .png()
    .toBuffer();
  const result = await processCheckoutThumbnailDataUrl(`data:image/png;base64,${png.toString("base64")}`);
  const outputMetadata = await sharp(result.buffer).metadata();
  assert.equal(result.width, 900);
  assert.equal(result.height, 900);
  assert.equal(outputMetadata.format, "webp");
});
