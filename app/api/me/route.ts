import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
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

  // 🔐 AUTH USER
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // 📦 PROFILE COMPLETO
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*") // 🔥 TUDO DA TABELA
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("PROFILE ERROR:", profileError);
  }

  // 🔥 NORMALIZED SAAS USER OBJECT
  const fullUser = {
    id: user.id,
    email: user.email ?? null,

    // auth metadata (caso uses OAuth later)
    user_metadata: user.user_metadata ?? {},

    // DB profile completo
    profile: profile ?? {
      role: "user",
      name: null,
      username: null,
      avatar_url: null,
      bio: null,
      created_at: null,
      updated_at: null,
    },
  };

  return NextResponse.json({
    user: fullUser,
  });
}