import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

const getProvider = (provider: unknown) => {
  if (provider === "google" || provider === "apple") return provider;
  return "unknown";
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const provider = getProvider(user.app_metadata?.provider);

  try {
    const h = headers();

    await supabase.from("logs").insert({
      event: "login",
      level: "info",
      user_id: user.id,
      email: user.email,
      provider,
      data: {
        provider,
        method: "oauth",
        ip:
          h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          h.get("x-real-ip") ??
          null,
        userAgent: h.get("user-agent"),
      },
    });
  } catch {
    // Não bloqueia login se o log falhar
  }

  const { data: profile } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        name: user.email?.split("@")[0],
        avatar_url: user.user_metadata?.avatar_url ?? null,
      },
      { onConflict: "id" }
    )
    .select("role")
    .single();

  const role = profile?.role ?? "user";

  if (role === "admin") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.redirect(new URL("/dashboard", req.url));
}
