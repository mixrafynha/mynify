import { NextResponse } from "next/server";
import { z } from "zod";
import { firestore } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const LogSchema = z.object({
  event: z.string().min(1).max(80),
  level: z.enum(["info", "warn", "error"]).default("info"),
  data: z.any().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = LogSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid log payload" },
        { status: 400 }
      );
    }

    await firestore.collection("events").add({
      event: parsed.data.event,
      level: parsed.data.level,
      data: parsed.data.data ?? {},
      createdAt: FieldValue.serverTimestamp(),
      userAgent: req.headers.get("user-agent"),
      ip:
        req.headers.get("x-forwarded-for")?.split(",")[0] ??
        req.headers.get("x-real-ip") ??
        null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("LOG ERROR:", error);

    return NextResponse.json(
      { error: "Failed to save log" },
      { status: 500 }
    );
  }
}