import { NextResponse } from "next/server";
import disposable from "disposable-email-domains";
import { createClient } from "@supabase/supabase-js";

const requestLimit = new Map<string, number[]>();
const dailyLimit = new Map<string, number>();

const RATE_WINDOW = 60 * 1000;
const RATE_MAX = 5;
const DAILY_MAX = 3;

function getIP(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  return (xf?.split(",")[0] || "unknown").slice(0, 45);
}

function checkRateLimit(ip: string) {
  const now = Date.now();
  const logs = requestLimit.get(ip) || [];
  const recent = logs.filter((t) => now - t < RATE_WINDOW);

  if (recent.length >= RATE_MAX) return false;

  recent.push(now);
  requestLimit.set(ip, recent);

  return true;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length < 254;
}

function isStrongPassword(pw: string) {
  return (
    typeof pw === "string" &&
    pw.length >= 8 &&
    pw.length <= 128 &&
    /[A-Za-z]/.test(pw) &&
    /[0-9]/.test(pw)
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail();

    let { email, password, token } = body;

    const ip = getIP(req);

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { message: "Too many requests" },
        { status: 429 }
      );
    }

    if (!token || typeof token !== "string") return fail();

    if (!isValidEmail(email)) return fail();

    email = email.toLowerCase().trim();

    const domain = email.split("@")[1];
    if (!domain || disposable.includes(domain)) return fail();

    if (!isStrongPassword(password)) return fail();

    const day = new Date().toISOString().slice(0, 10);
    const key = `${ip}-${day}`;

    const used = dailyLimit.get(key) || 0;

    if (used >= DAILY_MAX) {
      return NextResponse.json(
        { message: "Too many accounts today" },
        { status: 429 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        captchaToken: token,
      },
    });

    if (error) {
      console.error("Supabase signup error:", error.message);

      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }

    dailyLimit.set(key, used + 1);

    return success(201);
  } catch (err) {
    console.error("Signup API error:", err);

    return NextResponse.json(
      { message: "Internal error" },
      { status: 500 }
    );
  }
}

function success(status = 200) {
  return NextResponse.json(
    { message: "Account created successfully" },
    { status }
  );
}

function fail() {
  return NextResponse.json(
    { message: "Invalid request" },
    { status: 400 }
  );
}
