import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function POST() {
  const supabase = createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("notifications")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .select(); // 🔥 importante para debug

  if (error) {
    console.error("[CLEAR_NOTIFICATIONS_ERROR]", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    updated: data?.length ?? 0,
  });
}