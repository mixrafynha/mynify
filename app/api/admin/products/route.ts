import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

/* ================= GET ALL PRODUCTS ================= */
export async function GET() {
  const check = await requireAdmin();

  if ("error" in check) {
    return NextResponse.json(
      { error: check.error },
      { status: check.status }
    );
  }

  const supabase = createSupabaseServer();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}

/* ================= CREATE PRODUCT ================= */
export async function POST(req: Request) {
  const check = await requireAdmin();

  if ("error" in check) {
    return NextResponse.json(
      { error: check.error },
      { status: check.status }
    );
  }

  const body = await req.json();

  const title = body?.title?.trim();
  const price = Number(body?.price);

  if (!title || Number.isNaN(price)) {
    return NextResponse.json(
      { error: "Invalid title or price" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServer();

  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        title,
        description: body.description?.trim() || "",
        price,
        image: body.image || null,
        is_active: true,
      },
    ])
    .select()
    .maybeSingle(); // 🔥 mais seguro que single()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}