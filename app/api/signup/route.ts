import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getDurableRateLimiter, getTrustedRequestIp } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024;
const signupRateLimiter = getDurableRateLimiter({
  namespace: "signup",
  limit: 3,
  window: "1 m",
});

type SignupBody = {
  email?: string;
  password?: string;
  token?: string;
};

function json(error: string, message: string, status: number) {
  return NextResponse.json({ ok: false, error, message }, { status });
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isStrongPassword(value: string) {
  return (
    value.length >= 10 &&
    value.length <= 128 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return "http://localhost:3000";
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return json(
        "server_config",
        "Signup is not configured correctly.",
        500
      );
    }

    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return json("invalid_request", "Request body too large.", 413);
    }

    try {
      const rateLimit = await signupRateLimiter.limit(getTrustedRequestIp(req));
      if (!rateLimit.success) {
        return json("rate_limited", "Too many signup attempts. Try again later.", 429);
      }
    } catch (error) {
      console.error("[signup:rate-limit-error]", {
        message: error instanceof Error ? error.message : String(error),
      });
      return json("server_error", "Signup service is temporarily unavailable.", 503);
    }

    const rawBody = await req.text().catch(() => "");
    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return json("invalid_request", "Request body too large.", 413);
    }

    let body: SignupBody | null = null;
    try {
      body = JSON.parse(rawBody || "null") as SignupBody | null;
    } catch {
      return json("invalid_request", "Invalid request body.", 400);
    }

    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const token = String(body?.token || "");

    if (!isValidEmail(email)) {
      return json("invalid_email", "Enter a valid email.", 400);
    }

    if (!isStrongPassword(password)) {
      return json(
        "weak_password",
        "Password must have 10+ characters, uppercase, lowercase, number and symbol.",
        400
      );
    }

    if (!token) {
      return json("captcha_required", "Complete the captcha.", 400);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const siteUrl = getSiteUrl();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
        captchaToken: token,
      },
    });

    if (
      !error &&
      data.user &&
      Array.isArray(data.user.identities) &&
      data.user.identities.length === 0
    ) {
      return json("email_exists", "User already exists. Try logging in.", 409);
    }

    if (error) {
      console.error("Supabase signup error:", {
        name: error.name,
        message: error.message,
        status: error.status,
      });

      const message = error.message.toLowerCase();

      if (
        message.includes("already") ||
        message.includes("registered") ||
        message.includes("exists")
      ) {
        return json("email_exists", "User already exists. Try logging in.", 409);
      }

      if (
        message.includes("captcha") ||
        message.includes("timeout-or-duplicate")
      ) {
        return json(
          "captcha_failed",
          "Captcha failed. Please verify again.",
          400
        );
      }

      if (message.includes("password")) {
        return json(
          "weak_password",
          "Password must have 10+ characters, uppercase, lowercase, number and symbol.",
          400
        );
      }

      if (message.includes("redirect")) {
        return json(
          "redirect_not_allowed",
          "Signup redirect URL is not allowed in Supabase.",
          400
        );
      }

      return json("signup_failed", error.message || "Signup failed.", 400);
    }

    return NextResponse.json(
      {
        ok: true,
        userId: data.user?.id ?? null,
        message: "Account created. We sent you a verification email.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup API error:", error);
    return json("server_error", "Server error. Try again.", 500);
  }
}
