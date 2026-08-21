import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.join(process.cwd(), "app/api/gelato/availability/route.ts"), "utf8");

test("gelato availability keeps the existing rate limit and 429 response", () => {
  assert.match(source, /namespace: "gelato-availability"/);
  assert.match(source, /limit: 60/);
  assert.match(source, /window: "1 m"/);
  assert.match(source, /getTrustedRequestIp\(req\)/);
  assert.match(source, /if \(!rateLimit\.success\) return rejectRateLimited\(\)/);
  assert.match(source, /return NextResponse\.json\(\{ error: "Too many availability checks" \}, \{ status: 429 \}\)/);
});

test("gelato availability rate limiter infrastructure failure returns 503", () => {
  assert.match(source, /function rejectRateLimitUnavailable\(\)/);
  assert.match(source, /\{ error: "RATE_LIMIT_UNAVAILABLE" \}/);
  assert.match(source, /\{ status: 503 \}/);
  assert.match(source, /return rejectRateLimitUnavailable\(\)/);
});

test("gelato availability does not fetch Gelato when the limiter throws", () => {
  const catchIndex = source.indexOf("[gelato-availability:rate-limit-error]");
  const failClosedIndex = source.indexOf("return rejectRateLimitUnavailable()", catchIndex);
  const firstFetchIndex = source.indexOf("const res = await fetch", catchIndex);

  assert.ok(catchIndex > 0);
  assert.ok(failClosedIndex > catchIndex);
  assert.ok(firstFetchIndex > failClosedIndex);
});

test("gelato availability normal response, fallback, country, and variant handling remain wired", () => {
  assert.match(source, /const countryIso = resolveCountryCode\(raw\.countryIso\) \?\? resolveCountryCode\(country\)/);
  assert.match(source, /resolveVariantProductUid\(variantId\)/);
  assert.match(source, /normalizeAvailabilityResponse\(data, body\)/);
  assert.match(source, /DEFAULT_SHIPPING_METHODS/);
  assert.match(source, /configured: false/);
  assert.match(source, /headers: \{ "Cache-Control": "no-store" \}/);
});
