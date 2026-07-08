import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_SAVED_IMAGE_LIMIT = 5;

const jsonHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

type ProfileCreditsRow = {
  credits: number | string | null;
  ai_saved_images_limit: number | string | null;
};

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function getAuthSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
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

function getServiceSupabase() {
  return createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

function safeInt(value: unknown, fallback = 0) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(0, Math.floor(next));
}

function buildCreditsResponse({
  credits,
  savedCount,
  savedLimit,
}: {
  credits: number;
  savedCount: number;
  savedLimit: number;
}) {
  const safeCredits = safeInt(credits);
  const safeSavedCount = safeInt(savedCount);
  const safeSavedLimit = safeInt(savedLimit, DEFAULT_SAVED_IMAGE_LIMIT);

  return {
    success: true,
    credits: safeCredits,
    balance: safeCredits,
    aiCredits: safeCredits,
    credit_balance: safeCredits,
    savedCount: safeSavedCount,
    savedLimit: safeSavedLimit,
  };
}

function errorResponse(status: number, message: string) {
  return NextResponse.json(
    {
      success: false,
      credits: 0,
      balance: 0,
      aiCredits: 0,
      credit_balance: 0,
      savedCount: 0,
      savedLimit: DEFAULT_SAVED_IMAGE_LIMIT,
      error: message,
    },
    { status, headers: jsonHeaders },
  );
}

export async function GET() {
  try {
    const authSupabase = await getAuthSupabase();

    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(401, "Authentication required");
    }

    const serviceSupabase = getServiceSupabase();

    const [profileResult, savedImagesResult] = await Promise.all([
      serviceSupabase
        .from("profiles")
        .select("credits, ai_saved_images_limit")
        .eq("id", user.id)
        .maybeSingle<ProfileCreditsRow>(),

      serviceSupabase
        .from("user_generated_images")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_saved", true),
    ]);

    if (profileResult.error || savedImagesResult.error) {
      return errorResponse(500, "Could not load AI credits");
    }

    const profile = profileResult.data;

    return NextResponse.json(
      buildCreditsResponse({
        credits: safeInt(profile?.credits),
        savedCount: Number(savedImagesResult.count || 0),
        savedLimit: safeInt(
          profile?.ai_saved_images_limit,
          DEFAULT_SAVED_IMAGE_LIMIT,
        ),
      }),
      { headers: jsonHeaders },
    );
  } catch {
    return errorResponse(500, "Could not load AI credits");
  }
}
