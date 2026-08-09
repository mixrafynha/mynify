import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirestoreAdmin } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024;
const MAX_STRING_LENGTH = 500;
const MAX_ARRAY_ITEMS = 20;
const MAX_OBJECT_KEYS = 30;
const MAX_DEPTH = 4;

const SENSITIVE_KEY_PATTERN =
  /(authorization|cookie|token|access[_-]?token|refresh[_-]?token|client[_-]?secret|secret|stripe.*secret|supabase.*jwt|jwt|api[_-]?key|password)/i;

const SENSITIVE_VALUE_PATTERN =
  /(sk_(live|test)_[A-Za-z0-9_]+|cs_(live|test)_[A-Za-z0-9_]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/;

const LogSchema = z
  .object({
    event: z.string().min(1).max(80).optional(),
    type: z.string().min(1).max(80).optional(),
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

function cleanValue(value: unknown, depth = 0): unknown {
  if (value === undefined) return null;

  if (value === null) return null;

  if (typeof value === "string") {
    if (SENSITIVE_VALUE_PATTERN.test(value)) return "[redacted]";
    return value.slice(0, MAX_STRING_LENGTH);
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (depth >= MAX_DEPTH) return "[truncated]";

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => cleanValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const output: Record<string, unknown> = {};

    Object.entries(value as Record<string, unknown>)
      .slice(0, MAX_OBJECT_KEYS)
      .forEach(([key, item]) => {
        if (SENSITIVE_KEY_PATTERN.test(key)) return;
        output[key.slice(0, 80)] = cleanValue(item, depth + 1);
      });

    return output;
  }

  return String(value).slice(0, MAX_STRING_LENGTH);
}

function getClientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null
  );
}

export async function POST(req: Request) {
  try {
    const contentLength = Number(req.headers.get("content-length") ?? 0);

    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { success: false, error: "Log payload too large" },
        { status: 413 }
      );
    }

    const rawBody = await req.text();

    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return NextResponse.json(
        { success: false, error: "Log payload too large" },
        { status: 413 }
      );
    }

    let body: unknown = null;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid log payload" },
        { status: 400 }
      );
    }

    const parsed = LogSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid log payload" },
        { status: 400 }
      );
    }

    const firestore = getFirestoreAdmin();

    if (!firestore) {
      return NextResponse.json({
        success: true,
        skipped: true,
      });
    }

    const event = parsed.data.event ?? parsed.data.type ?? "unknown";

    const mergedData = {
      ...(parsed.data.data ?? {}),
      provider:
        parsed.data.provider ??
        parsed.data.data?.provider ??
        null,
    };

    await firestore.collection("events").add({
      event,
      level: parsed.data.level,
      data: cleanValue(mergedData),
      createdAt: FieldValue.serverTimestamp(),
      userAgent: req.headers.get("user-agent") ?? null,
      ip: getClientIp(req),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);

    return NextResponse.json({
      success: true,
      skipped: true,
    });
  }
}
