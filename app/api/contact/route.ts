import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getDurableRateLimiter } from "@/lib/server/rate-limit";

/* ================= SUPABASE ================= */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* ================= HELPERS ================= */

/* basic email validation (strong enough for SaaS) */
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/* strip dangerous content */
const sanitize = (value: string) => {
  return value
    .replace(/<script.*?>.*?<\/script>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .trim();
};

/* limit size */
const MAX_LEN = {
  name: 80,
  email: 120,
  message: 2000,
};

const REQUEST_BODY_LIMIT_BYTES = 8 * 1024;
function getRequestIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  ).slice(0, 64);
}

async function readBodyWithinLimit(req: Request) {
  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const parsed = Number(contentLength);
    if (Number.isFinite(parsed) && parsed > REQUEST_BODY_LIMIT_BYTES) {
      return { tooLarge: true as const };
    }
  }

  const raw = await req.text();
  if (Buffer.byteLength(raw, "utf8") > REQUEST_BODY_LIMIT_BYTES) {
    return { tooLarge: true as const };
  }

  return { tooLarge: false as const, raw };
}

/* ================= POST ================= */

export async function POST(req: Request) {
  try {
    const bodyResult = await readBodyWithinLimit(req);
    if (bodyResult.tooLarge) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      );
    }

    let body: unknown;

    try {
      body = JSON.parse(bodyResult.raw);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const allowedKeys = new Set(["name", "email", "message"]);
    const keys = Object.keys(body as Record<string, unknown>);
    if (keys.some((key) => !allowedKeys.has(key))) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const bodyRecord = body as Record<string, unknown>;
    const rawName = bodyRecord.name;
    const rawEmail = bodyRecord.email;
    const rawMessage = bodyRecord.message;

    /* ================= TYPE CHECK ================= */

    if (
      typeof rawName !== "string" ||
      typeof rawEmail !== "string" ||
      typeof rawMessage !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid input types" },
        { status: 400 }
      );
    }

    let name = rawName;
    let email = rawEmail;
    let message = rawMessage;

    /* ================= SANITIZE ================= */

    name = sanitize(name);
    email = sanitize(email);
    message = sanitize(message);

    /* ================= VALIDATION ================= */

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (
      name.length > MAX_LEN.name ||
      email.length > MAX_LEN.email ||
      message.length > MAX_LEN.message
    ) {
      return NextResponse.json(
        { error: "Input too long" },
        { status: 400 }
      );
    }

    const rateLimit = await getDurableRateLimiter({
      namespace: "contact",
      limit: 3,
      window: "1 m",
    }).limit(getRequestIp(req));
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    /* ================= INSERT ================= */

    const { error } = await supabase.from("contacts").insert([
      {
        name,
        email,
        message,
      },
    ]);

    if (error) {
      console.error("Supabase error:", error);

      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    /* ================= SUCCESS ================= */

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
    });

  } catch (err) {
    console.error("API error:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
