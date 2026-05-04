import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

/* ================= GET PRODUCT ================= */
export async function GET(
  req: Request,
  { params }: { params: { id?: string } }
) {
  const check = await requireAdmin();

  if ("error" in check) {
    return NextResponse.json(
      { error: check.error },
      { status: check.status }
    );
  }

  const id = params?.id;

  if (!id) {
    return NextResponse.json(
      { error: "Invalid id" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServer();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Product not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data });
}

/* ================= PATCH PRODUCT ================= */
export async function PATCH(
  req: Request,
  { params }: { params: { id?: string } }
) {
  const check = await requireAdmin();

  if ("error" in check) {
    return NextResponse.json(
      { error: check.error },
      { status: check.status }
    );
  }

  const id = params?.id;
  if (!id) {
    return NextResponse.json(
      { error: "Invalid id" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const supabase = createSupabaseServer();

  const updatePayload: Record<string, any> = {};

  if (body.title !== undefined) updatePayload.title = body.title;
  if (body.description !== undefined) updatePayload.description = body.description;
  if (body.price !== undefined) updatePayload.price = body.price;
  if (body.image !== undefined) updatePayload.image = body.image;
  if (body.is_active !== undefined) updatePayload.is_active = body.is_active;

  const { data, error } = await supabase
    .from("products")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}

/* ================= DELETE PRODUCT ================= */
export async function DELETE(
  req: Request,
  { params }: { params: { id?: string } }
) {
  const check = await requireAdmin();

  if ("error" in check) {
    return NextResponse.json(
      { error: check.error },
      { status: check.status }
    );
  }

  const id = params?.id;

  if (!id) {
    return NextResponse.json(
      { error: "Invalid id" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServer();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}