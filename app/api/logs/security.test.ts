import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import {
  LOG_RATE_LIMIT,
  cleanLogValue,
  logDedupeKey,
  logRateLimitKey,
  parseLogPayload,
  prepareLogWrite,
  shouldSkipDuplicateLog,
  type ParsedLogPayload,
} from "./security";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";

function parsed(body: unknown): ParsedLogPayload {
  const result = parseLogPayload(body);
  assert.equal(result.success, true);
  if (!result.success) throw new Error("Expected valid log payload");
  return result.data;
}

test("legitimate log payload still parses and preserves the success response contract in route", () => {
  const payload = parsed({
    event: "signup_created",
    type: "signup_created",
    level: "info",
    source: "server.auth.signup",
    product: "Ryfio",
    timestamp: new Date().toISOString(),
    data: { code: "created", provider: "email" },
  });

  const write = prepareLogWrite({
    parsed: payload,
    userId: USER_ID,
    userAgent: "node:test",
    ip: "203.0.113.10",
  });

  assert.equal(write.event, "signup_created");
  assert.equal(write.level, "info");
  assert.equal(write.userId, USER_ID);

  const route = fs.readFileSync(path.join(process.cwd(), "app/api/logs/route.ts"), "utf8");
  assert.match(route, /NextResponse\.json\(\{ success: true \}\)/);
});

test("identity is server-owned and spoofed body user ids are removed from data", () => {
  const payload = parsed({
    event: "login",
    level: "info",
    data: {
      userId: OTHER_USER_ID,
      user_id: OTHER_USER_ID,
      owner: OTHER_USER_ID,
      actor: OTHER_USER_ID,
      provider: "google",
    },
  });

  const write = prepareLogWrite({
    parsed: payload,
    userId: USER_ID,
    userAgent: null,
    ip: "198.51.100.4",
  });

  assert.equal(write.userId, USER_ID);
  assert.deepEqual(write.data, { provider: "google" });
});

test("invalid event names and invalid payloads are rejected", () => {
  assert.equal(parseLogPayload({ event: "", data: {} }).success, false);
  assert.equal(parseLogPayload({ event: "a".repeat(81), data: {} }).success, false);
  assert.equal(parseLogPayload({ event: "login/../../x", data: {} }).success, false);
  assert.equal(parseLogPayload({ event: "login", data: [] }).success, false);
  assert.equal(parseLogPayload({ level: "info", data: {} }).success, false);
});

test("secrets remain redacted and base64 or signed URL values are not retained", () => {
  const cleaned = cleanLogValue({
    authorization: "Bearer eyJabc.def.ghi",
    password: "secret",
    nested: {
      token: "sk_live_abc123",
      image: "data:image/png;base64,AAAA",
      signedUrl: "https://assets.example.test/file.png?token=secret",
      harmless: "ok",
    },
  });

  assert.deepEqual(cleaned, {
    nested: {
      image: "[redacted]",
      signedUrl: "[redacted]",
      harmless: "ok",
    },
  });
});

test("rate limit key is user plus IP and users remain independent", () => {
  assert.equal(logRateLimitKey(USER_ID, "203.0.113.10"), `${USER_ID}:203.0.113.10`);
  assert.equal(logRateLimitKey(OTHER_USER_ID, "203.0.113.10"), `${OTHER_USER_ID}:203.0.113.10`);
  assert.equal(LOG_RATE_LIMIT.limit, 240);
  assert.equal(LOG_RATE_LIMIT.window, "1 m");
});

test("rate limit source behavior is wired for success, 429, and limiter failure skipped", () => {
  const route = fs.readFileSync(path.join(process.cwd(), "app/api/logs/route.ts"), "utf8");
  assert.match(route, /logRateLimiter\.limit\(logRateLimitKey\(user\.id, requestIp\)\)/);
  assert.match(route, /status: 429/);
  assert.match(route, /\{[\s\S]*success: true,[\s\S]*skipped: true,[\s\S]*\}/);
});

test("duplicate identical events are skipped briefly but distinct events are not", () => {
  const base = prepareLogWrite({
    parsed: parsed({ event: "signup_attempted", data: { code: "attempted" } }),
    userId: USER_ID,
    userAgent: null,
    ip: "203.0.113.10",
  });
  const sameKey = logDedupeKey(base);
  const differentKey = logDedupeKey({
    ...base,
    data: { code: "created" },
  });

  assert.equal(shouldSkipDuplicateLog(sameKey, 1_000), false);
  assert.equal(shouldSkipDuplicateLog(sameKey, 2_000), true);
  assert.equal(shouldSkipDuplicateLog(differentKey, 2_000), false);
  assert.equal(shouldSkipDuplicateLog(sameKey, 20_000), false);
});

test("Firestore collection and document id stay server-owned", () => {
  const route = fs.readFileSync(path.join(process.cwd(), "app/api/logs/route.ts"), "utf8");
  assert.match(route, /firestore\.collection\("events"\)\.add\(/);
  assert.doesNotMatch(route, /collection\([^"']/);
  assert.doesNotMatch(route, /\.doc\(/);
  assert.match(route, /createdAt: FieldValue\.serverTimestamp\(\)/);
});

test("oversized body guard and no recursive logger call remain in the route", () => {
  const route = fs.readFileSync(path.join(process.cwd(), "app/api/logs/route.ts"), "utf8");
  assert.match(route, /MAX_BODY_BYTES = 16 \* 1024/);
  assert.match(route, /Buffer\.byteLength\(rawBody, "utf8"\) > MAX_BODY_BYTES/);
  assert.doesNotMatch(route, /fetch\(.*\/api\/logs/);
});
