import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

const PUBLIC_CACHE =
  "public, max-age=30, s-maxage=60, stale-while-revalidate=300";
const NO_STORE = "no-store";
const MAX_TYPE_LENGTH = 80;
const MAX_LIMIT = 60;

function validType(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= MAX_TYPE_LENGTH &&
    !/[<>%_,()]/.test(value)
  );
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400, headers: { "Cache-Control": NO_STORE } },
      );
    }

    const input = body as Record<string, unknown>;
    if (!validType(input.type)) {
      return NextResponse.json(
        { error: "Invalid category type" },
        { status: 400, headers: { "Cache-Control": NO_STORE } },
      );
    }

    const rawLimit = Number(input.limit ?? 24);
    const limit = Number.isInteger(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), MAX_LIMIT)
      : 24;

    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from("products")
      .select("id, slug, title, price, image, images, category, is_active")
      .eq("category", input.type.trim())
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("position", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("PRODUCTS_BY_TYPE_ERROR", { code: error.code });
      return NextResponse.json(
        { error: "Failed to load products" },
        { status: 500, headers: { "Cache-Control": NO_STORE } },
      );
    }

    return NextResponse.json(data ?? [], {
      headers: { "Cache-Control": PUBLIC_CACHE },
    });
  } catch (error) {
    console.error("PRODUCTS_BY_TYPE_ROUTE_ERROR", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Server error" },
      { status: 500, headers: { "Cache-Control": NO_STORE } },
    );
  }
}
