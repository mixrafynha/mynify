import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type DurableRateLimitConfig = {
  namespace: string;
  limit: number;
  window: `${number} ${"ms" | "s" | "m" | "h" | "d"}` | `${number}${"ms" | "s" | "m" | "h" | "d"}`;
};

type DurableRateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

type CachedLimiter = {
  limit: (identifier: string) => Promise<DurableRateLimitResult>;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  __ryfioUpstashRedis?: Redis;
  __ryfioUpstashLimiters?: Map<string, CachedLimiter>;
};

function getUpstashRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("Upstash Redis is not configured.");
  }

  globalForRateLimit.__ryfioUpstashRedis ??= new Redis({
    url,
    token,
  });

  return globalForRateLimit.__ryfioUpstashRedis;
}

function getLimiterCache() {
  globalForRateLimit.__ryfioUpstashLimiters ??= new Map<string, CachedLimiter>();
  return globalForRateLimit.__ryfioUpstashLimiters;
}

export function getDurableRateLimiter(config: DurableRateLimitConfig) {
  const cacheKey = `${config.namespace}:${config.limit}:${config.window}`;
  const cache = getLimiterCache();
  const cached = cache.get(cacheKey);

  if (cached) return cached;

  let limiter: Ratelimit | null = null;

  const getLimiter = () => {
    limiter ??= new Ratelimit({
      redis: getUpstashRedis(),
      limiter: Ratelimit.slidingWindow(config.limit, config.window),
      prefix: `ryfio:${config.namespace}`,
      ephemeralCache: false,
      timeout: 2_500,
    });

    return limiter;
  };

  const wrapped: CachedLimiter = {
    async limit(identifier: string) {
      const result = await getLimiter().limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    },
  };

  cache.set(cacheKey, wrapped);
  return wrapped;
}

export function getTrustedRequestIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  const cfIp = req.headers.get("cf-connecting-ip")?.trim();

  return (cfIp || forwarded || realIp || "unknown").slice(0, 64);
}
