import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createSupabaseServer } from "@/lib/supabase-server";

async function createCookieSupabaseServer() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Ignore cookie writes in contexts where Next exposes read-only cookies.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        } catch {
          // Ignore cookie writes in contexts where Next exposes read-only cookies.
        }
      },
    },
  });
}

export async function getAuthenticatedSupabase(req: Request) {
  const projectSupabase = createSupabaseServer();
  const projectAuth = await projectSupabase.auth.getUser();

  if (!projectAuth.error && projectAuth.data.user) {
    return { supabase: projectSupabase, user: projectAuth.data.user };
  }

  const cookieSupabase = await createCookieSupabaseServer();
  const cookieAuth = await cookieSupabase.auth.getUser();

  if (!cookieAuth.error && cookieAuth.data.user) {
    return { supabase: cookieSupabase, user: cookieAuth.data.user };
  }

  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (bearerToken) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }

    const bearerSupabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      },
      cookies: {
        get() {
          return undefined;
        },
        set() {},
        remove() {},
      },
    });
    const bearerAuth = await bearerSupabase.auth.getUser();

    if (!bearerAuth.error && bearerAuth.data.user) {
      return { supabase: bearerSupabase, user: bearerAuth.data.user };
    }
  }

  console.error("SAVE_DESIGN_AUTH_ERROR", {
    projectAuthError: projectAuth.error?.message ?? null,
    cookieAuthError: cookieAuth.error?.message ?? null,
    hasCookieHeader: Boolean(req.headers.get("cookie")),
    hasAuthorizationHeader: Boolean(authHeader),
  });

  return { supabase: cookieSupabase, user: null };
}
