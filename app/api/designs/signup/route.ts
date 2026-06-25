import { createHash } from "crypto";
import { NextResponse } from "next/server";
import disposable from "disposable-email-domains";
import { createClient } from "@supabase/supabase-js";

const requestLimit = new Map<string, number[]>();
const dailyLimit = new Map<string, number>();

const RATE_WINDOW = 60 * 1000;
const RATE_MAX = 5;
const DAILY_MAX = 3;

type SignupLogLevel = "info" | "warn" | "error";
type SignupCode =
  | "created"
  | "account_exists"
  | "invalid_request"
  | "rate_limited"
  | "unavailable"
  | "failed";

function getIP(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  return (forwardedFor?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").slice(0, 45);
}

function checkRateLimit(ip: string) {
  const now = Date.now();
  const logs = requestLimit.get(ip) || [];
  const recent = logs.filter((time) => now - time < RATE_WINDOW);

  if (recent.length >= RATE_MAX) return false;

  recent.push(now);
  requestLimit.set(ip, recent);

  return true;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length < 254;
}

function isStrongPassword(password: string) {
  return (
    password.length >= 10 &&
    password.length <= 128 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function getSafeOrigin(req: Request) {
  const fallback =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://www.ryfio.com";

  const origin = req.headers.get("origin") || fallback;

  try {
    const url = new URL(origin);

    if (url.protocol !== "https:" && url.hostname !== "localhost") {
      return fallback;
    }

    return url.origin;
  } catch {
    return fallback;
  }
}

function emailDomain(email: string) {
  const atIndex = email.lastIndexOf("@");
  if (atIndex < 1) return null;
  return email.slice(atIndex + 1, 120);
}

function emailHash(email: string) {
  return createHash("sha256").update(email.toLowerCase()).digest("hex");
}

function hasNoNewIdentity(data: unknown) {
  const user = (data as { user?: { identities?: unknown[] } | null } | null)?.user;
  if (!user) return false;
  if (!Array.isArray(user.identities)) return false;
  return user.identities.length === 0;
}

async function writeSignupLog(
  req: Request,
  input: {
    event: string;
    level?: SignupLogLevel;
    code?: SignupCode;
    email?: string;
    status?: number;
    durationMs?: number;
    reason?: string;
    message?: string;
  }
) {
  try {
    const email = input.email?.trim().toLowerCase();

    await fetch(new URL("/api/logs", req.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.get("cookie") ?? "",
      },
      body: JSON.stringify({
        event: input.event,
        type: input.event,
        level: input.level ?? "info",
        source: "server.auth.signup",
        product: "Ryfio",
        timestamp: new Date().toISOString(),
        data: {
          code: input.code ?? null,
          emailHash: email ? emailHash(email) : null,
          emailDomain: email ? emailDomain(email) : null,
          ip: getIP(req),
          userAgent: req.headers.get("user-agent") ?? null,
          status: input.status ?? null,
          durationMs: input.durationMs ?? null,
          reason: input.reason ?? null,
          message: input.message?.slice(0, 220) ?? null,
        },
      }),
    });
  } catch {
    // Signup logs must never block account creation.
  }
}

function json(code: SignupCode, message: string, status: number) {
  return NextResponse.json({ code, message }, { status });
}

export async function POST(req: Request) {
  const startedAt = Date.now();

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      await writeSignupLog(req, {
        event: "signup_rejected",
        level: "warn",
        code: "invalid_request",
        status: 400,
        reason: "invalid_json",
        durationMs: Date.now() - startedAt,
      });
      return json("invalid_request", "Invalid request.", 400);
    }

    const email = String((body as { email?: unknown }).email ?? "")
      .trim()
      .toLowerCase();

    const password = String((body as { password?: unknown }).password ?? "");
    const token = String((body as { token?: unknown }).token ?? "");
    const ip = getIP(req);

    if (!checkRateLimit(ip)) {
      await writeSignupLog(req, {
        event: "signup_rate_limited",
        level: "warn",
        code: "rate_limited",
        email,
        status: 429,
        reason: "minute_limit",
        durationMs: Date.now() - startedAt,
      });
      return json("rate_limited", "Too many requests. Try again later.", 429);
    }

    if (!token || !isValidEmail(email) || !isStrongPassword(password)) {
      await writeSignupLog(req, {
        event: "signup_rejected",
        level: "warn",
        code: "invalid_request",
        email,
        status: 400,
        reason: !token ? "missing_turnstile" : !isValidEmail(email) ? "invalid_email" : "weak_password",
        durationMs: Date.now() - startedAt,
      });
      return json("invalid_request", "Invalid request.", 400);
    }

    const domain = email.split("@")[1];

    if (!domain || disposable.includes(domain)) {
      await writeSignupLog(req, {
        event: "signup_rejected",
        level: "warn",
        code: "invalid_request",
        email,
        status: 400,
        reason: "disposable_email",
        durationMs: Date.now() - startedAt,
      });
      return json("invalid_request", "Invalid request.", 400);
    }

    const day = new Date().toISOString().slice(0, 10);
    const key = `${ip}-${day}`;
    const used = dailyLimit.get(key) || 0;

    if (used >= DAILY_MAX) {
      await writeSignupLog(req, {
        event: "signup_rate_limited",
        level: "warn",
        code: "rate_limited",
        email,
        status: 429,
        reason: "daily_limit",
        durationMs: Date.now() - startedAt,
      });
      return json("rate_limited", "Too many accounts today. Try again tomorrow.", 429);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      await writeSignupLog(req, {
        event: "signup_unavailable",
        level: "error",
        code: "unavailable",
        email,
        status: 503,
        reason: "missing_supabase_env",
        durationMs: Date.now() - startedAt,
      });
      return json("unavailable", "Signup is temporarily unavailable.", 503);
    }

    const origin = getSafeOrigin(req);
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    await writeSignupLog(req, {
      event: "signup_attempted",
      code: "created",
      email,
      status: 102,
      durationMs: Date.now() - startedAt,
    });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        captchaToken: token,
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      const message = error.message.toLowerCase();
      const isExisting =
        message.includes("already") ||
        message.includes("registered") ||
        message.includes("exists") ||
        message.includes("user");

      if (isExisting) {
        await writeSignupLog(req, {
          event: "signup_existing_account_detected",
          level: "warn",
          code: "account_exists",
          email,
          status: 409,
          reason: "supabase_existing_user_error",
          message: error.message,
          durationMs: Date.now() - startedAt,
        });
        return json("account_exists", "This email is already registered. Log in instead.", 409);
      }

      await writeSignupLog(req, {
        event: "signup_failed",
        level: "error",
        code: "failed",
        email,
        status: 400,
        reason: "supabase_signup_error",
        message: error.message,
        durationMs: Date.now() - startedAt,
      });
      return json("failed", "Unable to create account.", 400);
    }

    if (hasNoNewIdentity(data)) {
      await writeSignupLog(req, {
        event: "signup_existing_account_detected",
        level: "warn",
        code: "account_exists",
        email,
        status: 409,
        reason: "supabase_returned_no_new_identity",
        durationMs: Date.now() - startedAt,
      });
      return json("account_exists", "This email is already registered. Log in instead.", 409);
    }

    dailyLimit.set(key, used + 1);

    await writeSignupLog(req, {
      event: "signup_created",
      code: "created",
      email,
      status: 201,
      durationMs: Date.now() - startedAt,
    });

    return json("created", "Account created. Check your email to confirm your account.", 201);
  } catch (error) {
    await writeSignupLog(req, {
      event: "signup_unavailable",
      level: "error",
      code: "unavailable",
      status: 500,
      reason: error instanceof Error ? error.name : "unknown_error",
      message: error instanceof Error ? error.message : undefined,
      durationMs: Date.now() - startedAt,
    });
    return json("unavailable", "Signup is temporarily unavailable.", 500);
  }
}
