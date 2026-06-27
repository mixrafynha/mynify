import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const rawLimit = Number(searchParams.get("limit") ?? 60);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), 100)
      : 60;

    const category = searchParams.get("category")?.replace(/[<>]/g, "").trim();
    const collection = searchParams
      .get("collection")
      ?.replace(/[<>]/g, "")
      .trim();

    const supabase = createSupabaseAdmin();

    let query = supabase
      .from("products")
      .select(`
        id,
        title,
        description,
        price,
        currency,
        image,
        images,
        category,
        slug,
        position,
        collection,
        is_new,
        is_hot,
        is_featured,
        discount_price,
        status,
        rating,
        sales_count,
        audience,
        created_at
      `)
      .eq("is_active", true)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("position", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (category && category.toLowerCase() !== "all") {
      query = query.ilike("category", `%${category}%`);
    }

    if (collection && collection.toLowerCase() !== "all") {
      query = query.eq("collection", collection);
    }

    const { data, error } = await query;

    if (error) {
      console.error("GET_PRODUCTS_SUPABASE_ERROR:", error);

      return NextResponse.json(
        { data: [], error: "Failed to load products" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { data: data ?? [] },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("GET_PRODUCTS_ROUTE_ERROR:", err);

    return NextResponse.json(
      { data: [], error: "Internal server error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}