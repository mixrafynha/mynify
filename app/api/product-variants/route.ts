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
        { variants: [], error: "Missing productId" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const supabase = await createSupabaseServer();

    const { data: colors, error: colorsError } = await supabase
      .from("product_colors")
      .select("id, product_id, color, color_hex, image, position")
      .eq("product_id", productId)
      .order("position", { ascending: true });

    if (colorsError) {
      console.error("PRODUCT_VARIANTS_COLORS_ERROR:", colorsError);
      return NextResponse.json(
        { variants: [], error: "Failed to load product colors" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    const colorIds = (colors ?? []).map((c) => c.id);

    if (!colorIds.length) {
      return NextResponse.json(
        { variants: [] },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    const { data: variantsData, error: variantsError } = await supabase
      .from("product_variants")
      .select("*")
      .in("product_color_id", colorIds);

    if (variantsError) {
      console.error("PRODUCT_VARIANTS_ERROR:", variantsError);
      return NextResponse.json(
        { variants: [], error: "Failed to load product variants" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    const colorMap = new Map((colors ?? []).map((color) => [color.id, color]));

    const variants = (variantsData ?? []).map((variant) => {
      const color = colorMap.get(variant.product_color_id);

      return {
        ...variant,
        color: color?.color ?? null,
        color_hex: color?.color_hex ?? "#cccccc",
        product_color: color ?? null,
      };
    });

    return NextResponse.json(
      { variants },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("PRODUCT_VARIANTS_ROUTE_ERROR:", err);

    return NextResponse.json(
      { variants: [], error: "Internal server error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}