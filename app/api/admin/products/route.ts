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

  try {
    const body = await req.json();

    const title = body?.title?.trim();
    const description = body?.description?.trim() || "";
    const category = body?.category?.trim() || null;
    const image = body?.image?.trim() || null;
    const price = Number(body?.price);
    const is_active =
      typeof body?.is_active === "boolean" ? body.is_active : true;

    const tags = Array.isArray(body?.tags)
      ? body.tags
          .map((tag: unknown) => String(tag).trim())
          .filter(Boolean)
      : [];

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (Number.isNaN(price) || price < 0) {
      return NextResponse.json(
        { error: "Invalid price" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServer();

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          title,
          description,
          price,
          image,
          category,
          is_active,
          tags,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Invalid request body",
      },
      { status: 400 }
    );
  }
}
