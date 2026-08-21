import crypto from "node:crypto";
import { fetchSafeRemoteImageBuffer } from "@/lib/server/safe-remote-image";

export type ImageProxyFetchResult = {
  buffer: Buffer;
  contentType: string;
};

export type ImageProxyResponse =
  | {
      ok: true;
      image: ImageProxyFetchResult;
      canonicalUrl: string;
      cacheStatus: "hit" | "miss";
    }
  | {
      ok: false;
      status: 400 | 429 | 503;
      body: { error: string };
    };

export type ImageProxyDependencies = {
  fetchImage: (url: string) => Promise<ImageProxyFetchResult>;
  rateLimit: (identifier: string) => Promise<{ success: boolean }>;
  requestIp: (request: Request) => string;
  now: () => number;
};

const IMAGE_PROXY_RATE_LIMIT = {
  namespace: "checkout-image-proxy",
  limit: 120,
  window: "1 m" as const,
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 128;
const CACHE_CONTROL = "public, max-age=300, s-maxage=300";

const globalForImageProxy = globalThis as typeof globalThis & {
  __ryfioImageProxyCache?: Map<string, { expiresAt: number; image: ImageProxyFetchResult }>;
  __ryfioImageProxyInFlight?: Map<string, Promise<ImageProxyFetchResult>>;
};

function cacheStore() {
  globalForImageProxy.__ryfioImageProxyCache ??= new Map();
  return globalForImageProxy.__ryfioImageProxyCache;
}

function inFlightStore() {
  globalForImageProxy.__ryfioImageProxyInFlight ??= new Map();
  return globalForImageProxy.__ryfioImageProxyInFlight;
}

export function imageProxyRateLimitConfig() {
  return IMAGE_PROXY_RATE_LIMIT;
}

export function imageProxyCacheControl() {
  return CACHE_CONTROL;
}

export function canonicalizeImageProxyUrl(rawUrl: string) {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error("Invalid image URL.");
  }

  if (parsed.search) {
    throw new Error("Image URL query strings are not supported.");
  }

  if (parsed.hash) {
    throw new Error("Image URL fragments are not supported.");
  }

  parsed.protocol = parsed.protocol.toLowerCase();
  parsed.hostname = parsed.hostname.toLowerCase();
  if (parsed.port === "443") parsed.port = "";

  return parsed.toString();
}

export function imageProxyCacheKey(canonicalUrl: string) {
  return crypto.createHash("sha256").update(canonicalUrl).digest("hex");
}

function readCachedImage(cacheKey: string, now: number) {
  const cache = cacheStore();
  const cached = cache.get(cacheKey);
  if (!cached) return null;
  if (cached.expiresAt <= now) {
    cache.delete(cacheKey);
    return null;
  }
  cache.delete(cacheKey);
  cache.set(cacheKey, cached);
  return cached.image;
}

function writeCachedImage(cacheKey: string, image: ImageProxyFetchResult, now: number) {
  const cache = cacheStore();
  cache.set(cacheKey, { image, expiresAt: now + CACHE_TTL_MS });

  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (!oldestKey) break;
    cache.delete(oldestKey);
  }
}

async function fetchDedupedImage(
  canonicalUrl: string,
  cacheKey: string,
  deps: Pick<ImageProxyDependencies, "fetchImage" | "now">,
) {
  const inFlight = inFlightStore();
  const existing = inFlight.get(cacheKey);
  if (existing) return existing;

  const promise = deps.fetchImage(canonicalUrl).then((image) => {
    writeCachedImage(cacheKey, image, deps.now());
    return image;
  });

  inFlight.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(cacheKey);
  }
}

export async function handleImageProxyRequest(
  request: Request,
  rawUrl: string,
  deps: ImageProxyDependencies,
): Promise<ImageProxyResponse> {
  let canonicalUrl: string;

  try {
    canonicalUrl = canonicalizeImageProxyUrl(rawUrl);
  } catch {
    return { ok: false, status: 400, body: { error: "Invalid image URL" } };
  }

  try {
    const rateLimit = await deps.rateLimit(deps.requestIp(request));
    if (!rateLimit.success) {
      return { ok: false, status: 429, body: { error: "Too many image proxy requests" } };
    }
  } catch {
    return { ok: false, status: 503, body: { error: "Image proxy temporarily unavailable" } };
  }

  const cacheKey = imageProxyCacheKey(canonicalUrl);
  const cached = readCachedImage(cacheKey, deps.now());
  if (cached) {
    return { ok: true, image: cached, canonicalUrl, cacheStatus: "hit" };
  }

  try {
    const image = await fetchDedupedImage(canonicalUrl, cacheKey, deps);
    return { ok: true, image, canonicalUrl, cacheStatus: "miss" };
  } catch {
    return { ok: false, status: 400, body: { error: "Invalid image URL" } };
  }
}

export const defaultImageProxyFetch = fetchSafeRemoteImageBuffer;
