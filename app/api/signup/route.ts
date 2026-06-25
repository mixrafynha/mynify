import { NextResponse } from "next/server";
import disposable from "disposable-email-domains";
import { createClient } from "@supabase/supabase-js";

const requestLimit = new Map<string, number[]>();
const dailyLimit = new Map<string, number>();

const RATE_WINDOW = 60 * 1000;
const RATE_MAX = 5;
const DAILY_MAX = 3;

function getIP(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  return (forwardedFor?.split(",")[0] || "unknown").slice(0, 45);
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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return fail();

    let email = String((body as { email?: unknown }).email ?? "")
      .trim()
      .toLowerCase();

    const password = String((body as { password?: unknown }).password ?? "");
    const token = String((body as { token?: unknown }).token ?? "");

    const ip = getIP(req);

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { message: "Too many requests. Try again later." },
        { status: 429 }
      );
    }

    if (!token) return fail();
    if (!isValidEmail(email)) return fail();
    if (!isStrongPassword(password)) return fail();

    const domain = email.split("@")[1];

    if (!domain || disposable.includes(domain)) {
      return fail();
    }

    const day = new Date().toISOString().slice(0, 10);
    const key = `${ip}-${day}`;
    const used = dailyLimit.get(key) || 0;

    if (used >= DAILY_MAX) {
      return NextResponse.json(
        { message: "Too many accounts today. Try again tomorrow." },
        { status: 429 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { message: "Signup is temporarily unavailable." },
        { status: 503 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        captchaToken: token,
      },
    });

    if (error) {
      return NextResponse.json(
        { message: "Unable to create account." },
        { status: 400 }
      );
    }

    dailyLimit.set(key, used + 1);

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { message: "Signup is temporarily unavailable." },
      { status: 500 }
    );
  }
}

function fail() {
  return NextResponse.json({ message: "Invalid request" }, { status: 400 });
}