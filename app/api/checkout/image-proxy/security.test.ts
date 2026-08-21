import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import {
  canonicalizeImageProxyUrl,
  handleImageProxyRequest,
  imageProxyCacheControl,
  imageProxyCacheKey,
  imageProxyRateLimitConfig,
  type ImageProxyDependencies,
} from "./security";

const R2_URL = "https://pub-32be62cb2f1f47048c590acdfa322022.r2.dev/user-products/demo/mockups/front.webp";
const SUPABASE_URL =
  "https://evrizmiyecvhgfmhtuyr.supabase.co/storage/v1/object/public/design-assets/user/demo/front.png";

function request(ip = "203.0.113.10") {
  return new Request("https://www.ryfio.com/api/checkout/image-proxy", {
    headers: { "x-forwarded-for": ip },
  });
}

function image(body = "image", contentType = "image/webp") {
  return { buffer: Buffer.from(body), contentType };
}

function deps(overrides: Partial<ImageProxyDependencies> = {}): ImageProxyDependencies {
  return {
    fetchImage: async () => image(),
    rateLimit: async () => ({ success: true }),
    requestIp: (req) => req.headers.get("x-forwarded-for") ?? "unknown",
    now: () => 1_000,
    ...overrides,
  };
}

test("valid R2 URL remains served as the same MIME and bytes", async () => {
  const result = await handleImageProxyRequest(request(), R2_URL, deps({
    fetchImage: async (url) => {
      assert.equal(url, R2_URL);
      return image("r2-bytes", "image/webp");
    },
  }));

  assert.equal(result.ok, true);
  assert.equal(result.ok ? result.image.contentType : null, "image/webp");
  assert.deepEqual(result.ok ? result.image.buffer : null, Buffer.from("r2-bytes"));
  assert.equal(imageProxyCacheControl(), "public, max-age=300, s-maxage=300");
});

test("valid Supabase public URL remains served", async () => {
  const result = await handleImageProxyRequest(request(), SUPABASE_URL, deps({
    fetchImage: async (url) => {
      assert.equal(url, SUPABASE_URL);
      return image("supabase-bytes", "image/png");
    },
  }));

  assert.equal(result.ok, true);
  assert.equal(result.ok ? result.image.contentType : null, "image/png");
});

test("equivalent URL casing produces the same canonical key", () => {
  const first = canonicalizeImageProxyUrl("HTTPS://PUB-32BE62CB2F1F47048C590ACDFA322022.R2.DEV/a/b.webp");
  const second = canonicalizeImageProxyUrl("https://pub-32be62cb2f1f47048c590acdfa322022.r2.dev/a/b.webp");
  assert.equal(first, second);
  assert.equal(imageProxyCacheKey(first), imageProxyCacheKey(second));
});

test("irrelevant query strings and fragments are rejected before fetch", async () => {
  let fetches = 0;
  const dependencies = deps({
    fetchImage: async () => {
      fetches += 1;
      return image();
    },
  });

  const query = await handleImageProxyRequest(request(), `${R2_URL}?x=1`, dependencies);
  const fragment = await handleImageProxyRequest(request(), `${R2_URL}#preview`, dependencies);

  assert.equal(query.ok, false);
  assert.equal(query.ok ? null : query.status, 400);
  assert.equal(fragment.ok, false);
  assert.equal(fragment.ok ? null : fragment.status, 400);
  assert.equal(fetches, 0);
});

test("credentials and alternative ports remain rejected through safe fetch validation", async () => {
  const seen: string[] = [];
  const dependencies = deps({
    fetchImage: async (url) => {
      seen.push(url);
      throw new Error("safe fetch rejected");
    },
  });

  const credentials = await handleImageProxyRequest(
    request(),
    "https://user:pass@pub-32be62cb2f1f47048c590acdfa322022.r2.dev/a.webp",
    dependencies,
  );
  const port = await handleImageProxyRequest(
    request(),
    "https://pub-32be62cb2f1f47048c590acdfa322022.r2.dev:8443/a.webp",
    dependencies,
  );

  assert.equal(credentials.ok, false);
  assert.equal(credentials.ok ? null : credentials.status, 400);
  assert.equal(port.ok, false);
  assert.equal(port.ok ? null : port.status, 400);
  assert.equal(seen.length, 2);
});

test("normal rate limit usage proceeds and excess returns 429 before fetch", async () => {
  let fetches = 0;
  const allowed = await handleImageProxyRequest(request(), `${R2_URL}/allowed.webp`, deps({
    fetchImage: async () => {
      fetches += 1;
      return image("allowed");
    },
  }));
  const limited = await handleImageProxyRequest(request(), `${R2_URL}/limited.webp`, deps({
    rateLimit: async () => ({ success: false }),
    fetchImage: async () => {
      fetches += 1;
      return image("limited");
    },
  }));

  assert.equal(allowed.ok, true);
  assert.equal(limited.ok, false);
  assert.equal(limited.ok ? null : limited.status, 429);
  assert.equal(fetches, 1);
});

test("rate limiter failure fails closed before upstream fetch", async () => {
  let fetches = 0;
  const result = await handleImageProxyRequest(request(), `${R2_URL}/503.webp`, deps({
    rateLimit: async () => {
      throw new Error("limiter unavailable");
    },
    fetchImage: async () => {
      fetches += 1;
      return image();
    },
  }));

  assert.equal(result.ok, false);
  assert.equal(result.ok ? null : result.status, 503);
  assert.equal(fetches, 0);
});

test("rate limit key is IP-only so multiple URLs cannot bypass it", async () => {
  const keys: string[] = [];
  const dependencies = deps({
    rateLimit: async (key) => {
      keys.push(key);
      return { success: true };
    },
  });

  await handleImageProxyRequest(request("198.51.100.2"), `${R2_URL}/one.webp`, dependencies);
  await handleImageProxyRequest(request("198.51.100.2"), `${R2_URL}/two.webp`, dependencies);

  assert.deepEqual(keys, ["198.51.100.2", "198.51.100.2"]);
  assert.equal(imageProxyRateLimitConfig().limit, 120);
  assert.equal(imageProxyRateLimitConfig().window, "1 m");
});

test("identical requests reuse cache and simultaneous requests dedupe upstream fetches", async () => {
  let currentTime = 20_000;
  let fetches = 0;
  const dependencies = deps({
    now: () => currentTime,
    fetchImage: async () => {
      fetches += 1;
      await Promise.resolve();
      return image(`deduped-${fetches}`);
    },
  });

  const first = handleImageProxyRequest(request(), `${R2_URL}/dedupe.webp`, dependencies);
  const second = handleImageProxyRequest(request(), `${R2_URL}/dedupe.webp`, dependencies);

  const [firstResult, secondResult] = await Promise.all([first, second]);
  const cachedResult = await handleImageProxyRequest(request(), `${R2_URL}/dedupe.webp`, dependencies);

  assert.equal(firstResult.ok, true);
  assert.equal(secondResult.ok, true);
  assert.equal(cachedResult.ok, true);
  assert.equal(fetches, 1);
  assert.equal(firstResult.ok ? firstResult.image.buffer.toString() : null, "deduped-1");
  assert.equal(secondResult.ok ? secondResult.image.buffer.toString() : null, "deduped-1");
  assert.equal(cachedResult.ok ? cachedResult.cacheStatus : null, "hit");

  currentTime += 5 * 60 * 1000 + 1;
  const expired = await handleImageProxyRequest(request(), `${R2_URL}/dedupe.webp`, dependencies);
  assert.equal(expired.ok, true);
  assert.equal(fetches, 2);
});

test("different canonical URLs never receive crossed content", async () => {
  const resultA = await handleImageProxyRequest(request(), `${R2_URL}/a.webp`, deps({
    fetchImage: async (url) => image(url.endsWith("/a.webp") ? "a" : "wrong"),
  }));
  const resultB = await handleImageProxyRequest(request(), `${R2_URL}/b.webp`, deps({
    fetchImage: async (url) => image(url.endsWith("/b.webp") ? "b" : "wrong"),
  }));

  assert.equal(resultA.ok ? resultA.image.buffer.toString() : null, "a");
  assert.equal(resultB.ok ? resultB.image.buffer.toString() : null, "b");
});

test("SSRF protections remain delegated to fetchSafeRemoteImageBuffer", () => {
  const route = fs.readFileSync(path.join(process.cwd(), "app/api/checkout/image-proxy/route.ts"), "utf8");
  const security = fs.readFileSync(path.join(process.cwd(), "app/api/checkout/image-proxy/security.ts"), "utf8");
  const safeRemote = fs.readFileSync(path.join(process.cwd(), "lib/server/safe-remote-image.ts"), "utf8");

  assert.match(route, /defaultImageProxyFetch/);
  assert.match(security, /fetchSafeRemoteImageBuffer/);
  assert.match(safeRemote, /parsed\.protocol !== "https:"/);
  assert.match(safeRemote, /parsed\.username \|\| parsed\.password/);
  assert.match(safeRemote, /parsed\.port && parsed\.port !== "443"/);
  assert.match(safeRemote, /isTrustedRemoteImageHost/);
  assert.match(safeRemote, /assertSafeHostname/);
  assert.match(safeRemote, /redirect: "manual"/);
  assert.match(safeRemote, /MAX_IMAGE_BYTES = 12 \* 1024 \* 1024/);
});
