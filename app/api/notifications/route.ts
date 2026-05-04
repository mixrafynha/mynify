import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { data: [], error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error(error);

    return NextResponse.json(
      { data: [], error: "DB error" },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}