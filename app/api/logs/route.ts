import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await req.json();

  const { event, data } = body;

  if (!event) {
    return NextResponse.json(
      { error: "Missing event" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("app_logs").insert({
    user_id: user?.id ?? null,
    event,
    data: data ?? {},
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}