import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

/* ================= POST ================= */

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let { name, email, message } = body;

    /* ================= TYPE CHECK ================= */

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof message !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid input types" },
        { status: 400 }
      );
    }

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