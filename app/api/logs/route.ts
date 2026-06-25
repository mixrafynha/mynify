import { NextResponse } from "next/server";
import { z } from "zod";
import { firestore } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LogSchema = z
  .object({
    event: z.string().min(1).max(80).optional(),
    type: z.string().min(1).max(80).optional(),
    level: z.enum(["info", "warn", "error"]).default("info"),
    provider: z.string().max(40).optional(),
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((value) => value.event || value.type, {
    message: "Missing log event",
  });

function cleanValue(value: unknown): unknown {
  if (value === undefined) return null;

  if (value === null) return null;

  if (typeof value === "string") return value.slice(0, 1000);

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map(cleanValue);
  }

  if (typeof value === "object") {
    const output: Record<string, unknown> = {};

    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      output[key.slice(0, 80)] = cleanValue(item);
    });

    return output;
  }

  return String(value).slice(0, 1000);
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
    const body = await req.json().catch(() => null);
    const parsed = LogSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid log payload" },
        { status: 400 }
      );
    }

    const event = parsed.data.event ?? parsed.data.type ?? "unknown";
    const mergedData = {
      ...(parsed.data.data ?? {}),
      provider: parsed.data.provider ?? parsed.data.data?.provider ?? null,
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
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to save log" },
      { status: 500 }
    );
  }
}
