import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 60;

const PUBLIC_CACHE =
  "public, max-age=30, s-maxage=60, stale-while-revalidate=300";
const NO_STORE = "no-store";
const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 60;
const MAX_FILTER_LENGTH = 80;

function cleanFilter(value: string | null): string | null {
  if (!value) return null;
  const cleaned = value.replace(/[<>%_,()]/g, "").trim();
  return cleaned && cleaned.length <= MAX_FILTER_LENGTH ? cleaned : null;
}

function positiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = positiveInt(searchParams.get("page"), 1, 10_000);
    const limit = positiveInt(
      searchParams.get("limit") ?? searchParams.get("pageSize"),
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );
    const category = cleanFilter(searchParams.get("category"));
    const collection = cleanFilter(searchParams.get("collection"));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

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
      .range(from, to);

    if (category && category.toLowerCase() !== "all") {
      query = query.eq("category", category);
    }

    if (collection && collection.toLowerCase() !== "all") {
      query = query.eq("collection", collection);
    }

    const { data, error } = await query;

    if (error) {
      console.error("GET_PRODUCTS_SUPABASE_ERROR", { code: error.code });
      return NextResponse.json(
        { data: [], error: "Failed to load products" },
        { status: 500, headers: { "Cache-Control": NO_STORE } },
      );
    }

    return NextResponse.json(
      { data: data ?? [] },
      { status: 200, headers: { "Cache-Control": PUBLIC_CACHE } },
    );
  } catch (error) {
    console.error("GET_PRODUCTS_ROUTE_ERROR", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { data: [], error: "Internal server error" },
      { status: 500, headers: { "Cache-Control": NO_STORE } },
    );
  }
}
