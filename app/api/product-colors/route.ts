import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const productId = searchParams.get("productId")?.trim();

    if (!productId) {
      return NextResponse.json(
        {
          colors: [],
          error: "Missing productId",
        },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const supabase = await createSupabaseServer();

    const { data, error } = await supabase
      .from("product_colors")
      .select("id, color, color_hex, position")
      .eq("product_id", productId)
      .order("position", { ascending: true });

    if (error) {
      console.error("PRODUCT_COLORS_ERROR:", error);

      return NextResponse.json(
        {
          colors: [],
          error: "Failed to load product colors",
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const colors = Array.from(
      new Map(
        (data ?? []).map((item: any) => [
          String(item.color).toLowerCase(),
          {
            id: item.id,
            name: item.color,
            hex: item.color_hex ?? "#cccccc",
          },
        ])
      ).values()
    );

    return NextResponse.json(
      { colors },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("PRODUCT_COLORS_ROUTE_ERROR:", err);

    return NextResponse.json(
      {
        colors: [],
        error: "Internal server error",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}