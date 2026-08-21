import crypto from "node:crypto";
import { z } from "zod";

const MAX_STRING_LENGTH = 500;
const MAX_ARRAY_ITEMS = 20;
const MAX_OBJECT_KEYS = 30;
const MAX_DEPTH = 4;
const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_.:-]{0,79}$/i;
const DEDUPE_WINDOW_MS = 10_000;

const SENSITIVE_KEY_PATTERN =
  /(authorization|cookie|token|access[_-]?token|refresh[_-]?token|client[_-]?secret|secret|stripe.*secret|supabase.*jwt|jwt|api[_-]?key|password|signature)/i;

const SENSITIVE_VALUE_PATTERN =
  /(sk_(live|test)_[A-Za-z0-9_]+|cs_(live|test)_[A-Za-z0-9_]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|^data:[^,]+;base64,)/i;

const RESERVED_IDENTITY_KEY_PATTERN = /^(user[_-]?id|owner|actor)$/i;

const LogSchema = z
  .object({
    event: z.string().trim().min(1).max(80).regex(EVENT_NAME_PATTERN).optional(),
    type: z.string().trim().min(1).max(80).regex(EVENT_NAME_PATTERN).optional(),
    level: z.enum(["info", "warn", "error"]).default("info"),
    provider: z.string().max(40).optional(),
    source: z.string().max(80).optional(),
    product: z.string().max(80).optional(),
    timestamp: z.string().max(80).optional(),
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .refine((value) => value.event || value.type, {
    message: "Missing log event",
  });

export type ParsedLogPayload = z.infer<typeof LogSchema>;

export type PreparedLogWrite = {
  event: string;
  level: "info" | "warn" | "error";
  data: unknown;
  userId: string;
  userAgent: string | null;
  ip: string | null;
};

export const LOG_RATE_LIMIT = {
  namespace: "logs",
  limit: 240,
  window: "1 m" as const,
};

const globalForLogs = globalThis as typeof globalThis & {
  __ryfioLogDedupe?: Map<string, number>;
};

function logDedupeStore() {
  globalForLogs.__ryfioLogDedupe ??= new Map();
  return globalForLogs.__ryfioLogDedupe;
}

export function parseLogPayload(body: unknown) {
  return LogSchema.safeParse(body);
}

function redactSignedUrl(value: string) {
  try {
    const url = new URL(value);
    if (
      Array.from(url.searchParams.keys()).some((key) => SENSITIVE_KEY_PATTERN.test(key))
    ) {
      return "[redacted]";
    }
  } catch {
    return null;
  }

  return null;
}

export function cleanLogValue(value: unknown, depth = 0): unknown {
  if (value === undefined) return null;

  if (value === null) return null;

  if (typeof value === "string") {
    if (SENSITIVE_VALUE_PATTERN.test(value)) return "[redacted]";
    const signedUrlRedaction = redactSignedUrl(value);
    if (signedUrlRedaction) return signedUrlRedaction;
    return value.slice(0, MAX_STRING_LENGTH);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (depth >= MAX_DEPTH) return "[truncated]";

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => cleanLogValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const output: Record<string, unknown> = {};

    Object.entries(value as Record<string, unknown>)
      .slice(0, MAX_OBJECT_KEYS)
      .forEach(([key, item]) => {
        if (SENSITIVE_KEY_PATTERN.test(key) || RESERVED_IDENTITY_KEY_PATTERN.test(key)) return;
        output[key.slice(0, 80)] = cleanLogValue(item, depth + 1);
      });

    return output;
  }

  return String(value).slice(0, MAX_STRING_LENGTH);
}

export function prepareLogWrite(args: {
  parsed: ParsedLogPayload;
  userId: string;
  userAgent: string | null;
  ip: string | null;
}): PreparedLogWrite {
  const event = args.parsed.event ?? args.parsed.type ?? "unknown";
  const mergedData = {
    ...(args.parsed.data ?? {}),
    provider: args.parsed.provider ?? args.parsed.data?.provider ?? null,
  };

  return {
    event,
    level: args.parsed.level,
    data: cleanLogValue(mergedData),
    userId: args.userId,
    userAgent: args.userAgent,
    ip: args.ip,
  };
}

export function logRateLimitKey(userId: string, ip: string | null) {
  return `${userId}:${(ip || "unknown").slice(0, 64)}`;
}

export function logDedupeKey(write: PreparedLogWrite) {
  return crypto
    .createHash("sha256")
    .update(write.userId)
    .update("\0")
    .update(write.event)
    .update("\0")
    .update(JSON.stringify(write.data))
    .digest("hex");
}

export function shouldSkipDuplicateLog(key: string, now: number) {
  const store = logDedupeStore();
  const previous = store.get(key);

  for (const [storedKey, expiresAt] of store) {
    if (expiresAt <= now) store.delete(storedKey);
  }

  if (previous && previous > now) return true;

  store.set(key, now + DEDUPE_WINDOW_MS);
  return false;
}
