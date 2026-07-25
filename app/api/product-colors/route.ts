import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export const revalidate = 60;

const PUBLIC_CACHE =
  "public, max-age=30, s-maxage=60, stale-while-revalidate=300";
const NO_STORE = "no-store";

function isSafeId(value: string): boolean {
  return value.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(value);
}

type ColorRow = {
  id: string;
  color: string | null;
  color_hex: string | null;
  position: number | null;
};

export async function GET(req: Request) {
  try {
    const productId = new URL(req.url).searchParams.get("productId")?.trim();

    if (!productId || !isSafeId(productId)) {
      return NextResponse.json(
        { colors: [], error: "Invalid productId" },
        { status: 400, headers: { "Cache-Control": NO_STORE } },
      );
    }

    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from("product_colors")
      .select("id, color, color_hex, position")
      .eq("product_id", productId)
      .order("position", { ascending: true });

    if (error) {
      console.error("PRODUCT_COLORS_ERROR", { code: error.code });
      return NextResponse.json(
        { colors: [], error: "Failed to load product colors" },
        { status: 500, headers: { "Cache-Control": NO_STORE } },
      );
    }

    const uniqueColors = new Map<string, { id: string; name: string; hex: string }>();

    for (const item of (data ?? []) as ColorRow[]) {
      const name = item.color?.trim();
      if (!name) continue;
      const key = name.toLocaleLowerCase();
      if (!uniqueColors.has(key)) {
        uniqueColors.set(key, {
          id: item.id,
          name,
          hex: item.color_hex ?? "#cccccc",
        });
      }
    }

    return NextResponse.json(
      { colors: [...uniqueColors.values()] },
      { status: 200, headers: { "Cache-Control": PUBLIC_CACHE } },
    );
  } catch (error) {
    console.error("PRODUCT_COLORS_ROUTE_ERROR", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { colors: [], error: "Internal server error" },
      { status: 500, headers: { "Cache-Control": NO_STORE } },
    );
  }
}
