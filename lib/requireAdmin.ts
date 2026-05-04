import { createSupabaseServer } from "@/lib/supabase-server";

export async function requireAdmin() {
  const supabase = createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Forbidden", status: 403 };
  }

  return { user };
}