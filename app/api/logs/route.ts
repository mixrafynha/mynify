import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getFirestoreAdmin } from "@/lib/firebase-admin";
import { getDurableRateLimiter, getTrustedRequestIp } from "@/lib/server/rate-limit";
import { FieldValue } from "firebase-admin/firestore";
import {
  LOG_RATE_LIMIT,
  logDedupeKey,
  logRateLimitKey,
  parseLogPayload,
  prepareLogWrite,
  shouldSkipDuplicateLog,
} from "./security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024;
const AUTH_ERROR = { success: false, error: "Unauthorized" };
const logRateLimiter = getDurableRateLimiter(LOG_RATE_LIMIT);

async function getAuthSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {}
        },
      },
    },
  );
}

export async function POST(req: Request) {
  try {
    const authSupabase = await getAuthSupabase();
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(AUTH_ERROR, { status: 401 });
    }

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

    const parsed = parseLogPayload(body);

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

    const requestIp = getTrustedRequestIp(req);
    const userAgent = req.headers.get("user-agent") ?? null;

    try {
      const rateLimit = await logRateLimiter.limit(logRateLimitKey(user.id, requestIp));
      if (!rateLimit.success) {
        return NextResponse.json(
          { success: false, error: "Too many log events" },
          { status: 429 }
        );
      }
    } catch {
      return NextResponse.json({
        success: true,
        skipped: true,
      });
    }

    const write = prepareLogWrite({
      parsed: parsed.data,
      userId: user.id,
      userAgent,
      ip: requestIp,
    });

    if (shouldSkipDuplicateLog(logDedupeKey(write), Date.now())) {
      return NextResponse.json({
        success: true,
        skipped: true,
      });
    }

    await firestore.collection("events").add({
      event: write.event,
      level: write.level,
      data: write.data,
      userId: write.userId,
      createdAt: FieldValue.serverTimestamp(),
      userAgent: write.userAgent,
      ip: write.ip,
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
