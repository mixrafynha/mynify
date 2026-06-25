import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

const ALLOWED_PROVIDERS = ["google", "apple"] as const;

type Provider = "google" | "apple" | "unknown";

function getProvider(provider: unknown): Provider {
  if (ALLOWED_PROVIDERS.includes(provider as any)) {
    return provider as Provider;
  }

  return "unknown";
}

function safeRedirectPath(value: string | null) {
  if (!value) return "/dashboard";

  try {
    const decoded = decodeURIComponent(value);

    if (!decoded.startsWith("/")) return "/dashboard";
    if (decoded.startsWith("//")) return "/dashboard";
    if (decoded.includes("://")) return "/dashboard";
    if (decoded.includes("\\")) return "/dashboard";

    return decoded.slice(0, 300);
  } catch {
    return "/dashboard";
  }
}

function safeName(email?: string | null) {
  if (!email || !email.includes("@")) return "User";

  return email
    .split("@")[0]
    .replace(/[^\w.-]/g, "")
    .slice(0, 60) || "User";
}

async function sendOAuthLoginLog(
  req: Request,
  data: {
    userId: string;
    email?: string | null;
    provider: Provider;
  }
) {
  try {
    const h = await headers();

    await fetch(new URL("/api/logs", req.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: h.get("cookie") ?? "",
      },
      body: JSON.stringify({
        event: "login",
        level: "info",
        data: {
          userId: data.userId,
          email: data.email ?? null,
          provider: data.provider,
          method: "oauth",
          ip:
            h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            h.get("x-real-ip") ??
            null,
          userAgent: h.get("user-agent") ?? null,
        },
      }),
    });
  } catch {
    // Não bloqueia login se log falhar
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");
  const next = safeRedirectPath(nextParam);

  if (!code) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("OAuth exchange error:", exchangeError.message);
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("OAuth get user error:", userError?.message);
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const provider = getProvider(user.app_metadata?.provider);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        name: safeName(user.email),
        avatar_url:
          typeof user.user_metadata?.avatar_url === "string"
            ? user.user_metadata.avatar_url.slice(0, 500)
            : null,
      },
      {
        onConflict: "id",
      }
    )
    .select("role")
    .single();

  if (profileError) {
    console.error("Profile upsert error:", profileError.message);
  }

  await sendOAuthLoginLog(req, {
    userId: user.id,
    email: user.email,
    provider,
  });

  const role = profile?.role === "admin" ? "admin" : "user";

  if (role === "admin" && (!nextParam || next === "/dashboard")) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.redirect(new URL(next, req.url));
}
