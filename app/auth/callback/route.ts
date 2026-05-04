import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

  /* =========================
     1. OAuth exchange
  ========================= */
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  /* =========================
     2. Get user
  ========================= */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  /* =========================
     3. CREATE PROFILE (NO ROLE OVERRIDE)
  ========================= */
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

  /* =========================
     4. REDIRECT
  ========================= */
  if (role === "admin") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.redirect(new URL("/dashboard", req.url));
}