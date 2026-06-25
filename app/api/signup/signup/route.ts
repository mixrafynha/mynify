import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SignupCode =
  | "created"
  | "account_exists"
  | "invalid_request"
  | "captcha_failed"
  | "rate_limited"
  | "server_config"
  | "signup_failed"
  | "server_error";

type TurnstileVerifyResponse = {
  success?: boolean;
  "error-codes"?: string[];
};

function json(code: SignupCode, message: string, status: number) {
  return NextResponse.json({ ok: false, code, error: code, message }, { status });
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

function getClientIp(req: Request) {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    undefined
  );
}

async function verifyTurnstile(token: string, ip?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      return true;
    }

    console.error("Missing TURNSTILE_SECRET_KEY");
    return false;
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);

  if (ip) {
    formData.append("remoteip", ip);
  }

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      console.error("Turnstile verify HTTP error:", res.status);
      return false;
    }

    const data = (await res.json()) as TurnstileVerifyResponse;

    if (!data.success) {
      console.error("Turnstile failed:", data["error-codes"] ?? []);
    }

    return data.success === true;
  } catch (error) {
    console.error("Turnstile verify request failed:", error);
    return false;
  }
}

function isExistingAccountMessage(value: string) {
  return value.includes("already") || value.includes("registered") || value.includes("exists");
}

function isRateLimitMessage(value: string) {
  return value.includes("rate") || value.includes("too many") || value.includes("limit");
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase public env variables");
      return json("server_config", "Signup is not configured correctly.", 500);
    }

    const body = (await req.json().catch(() => null)) as {
      email?: string;
      password?: string;
      token?: string;
    } | null;

    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const token = String(body?.token || "");

    if (!isValidEmail(email)) {
      return json("invalid_request", "Enter a valid email.", 400);
    }

    if (!isStrongPassword(password)) {
      return json(
        "invalid_request",
        "Password must have 10+ characters, uppercase, lowercase, number and symbol.",
        400
      );
    }

    if (!token) {
      return json("captcha_failed", "Complete the captcha.", 400);
    }

    const captchaOk = await verifyTurnstile(token, getClientIp(req));

    if (!captchaOk) {
      return json("captcha_failed", "Captcha failed. Please verify again.", 400);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        captchaToken: token,
        emailRedirectTo: `${siteUrl.replace(/\/$/, "")}/auth/callback`,
      },
    });

    if (error) {
      const message = error.message.toLowerCase();

      console.error("Supabase signup error:", {
        name: error.name,
        message: error.message,
        status: error.status,
      });

      if (isExistingAccountMessage(message)) {
        return json("account_exists", "This email is already registered. Try logging in.", 409);
      }

      if (isRateLimitMessage(message)) {
        return json("rate_limited", "Too many signup attempts. Try again later.", 429);
      }

      if (message.includes("captcha") || message.includes("challenge")) {
        return json("captcha_failed", "Captcha failed. Please verify again.", 400);
      }

      return json("signup_failed", error.message || "Signup failed. Try again.", 400);
    }

    const identities = data.user?.identities;

    if (Array.isArray(identities) && identities.length === 0) {
      return json("account_exists", "This email is already registered. Try logging in.", 409);
    }

    return NextResponse.json(
      {
        ok: true,
        code: "created" satisfies SignupCode,
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
