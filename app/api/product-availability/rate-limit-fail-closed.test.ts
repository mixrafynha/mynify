import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.join(process.cwd(), "app/api/product-availability/route.ts"), "utf8");

test("product availability keeps the existing rate limit and 429 response", () => {
  assert.match(source, /namespace: "product-availability"/);
  assert.match(source, /limit: 120/);
  assert.match(source, /window: "1 m"/);
  assert.match(source, /getTrustedRequestIp\(req\)/);
  assert.match(source, /if \(!rateLimit\.success\) return rejectRateLimited\(\)/);
  assert.match(source, /status: 429/);
  assert.match(source, /Retry-After": "10"/);
});

test("product availability rate limiter infrastructure failure returns 503", () => {
  assert.match(source, /function rejectRateLimitUnavailable\(\)/);
  assert.match(source, /reason: "RATE_LIMIT_UNAVAILABLE"/);
  assert.match(source, /status: 503/);
  assert.match(source, /return rejectRateLimitUnavailable\(\)/);
});

test("product availability does not reach Gelato when the limiter throws", () => {
  const catchIndex = source.indexOf("[product-availability:rate-limit-error]");
  const failClosedIndex = source.indexOf("return rejectRateLimitUnavailable()", catchIndex);
  const providerCallIndex = source.indexOf("checkGelatoRegionalAvailability", catchIndex);

  assert.ok(catchIndex > 0);
  assert.ok(failClosedIndex > catchIndex);
  assert.ok(providerCallIndex > failClosedIndex);
});

test("product availability normal response, country, and variant handling remain wired", () => {
  assert.match(source, /const countryCode = resolveCountryCode\(body\?\.countryCode\)/);
  assert.match(source, /\.select\("id, product_color_id, size, gelato_product_uid"\)/);
  assert.match(source, /status: availability\.status/);
  assert.match(source, /variantId,/);
  assert.match(source, /countryCode,/);
  assert.match(source, /reason: availability\.reason/);
  assert.match(source, /headers: \{ "Cache-Control": "no-store" \}/);
});
