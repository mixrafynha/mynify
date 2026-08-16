import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { resolveProductColorVisual } from "@/lib/gelato/product-color-visual";

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
  gelato_color_key?: string | null;
  gelato_attributes?: Record<string, unknown> | null;
  gelato_color_data?: Record<string, unknown> | null;
  position: number | null;
};

type ColorResponseRow = {
  id: string;
  name: string;
  hex: string;
  visual: ReturnType<typeof resolveProductColorVisual>;
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
      .select("id, color, color_hex, gelato_color_key, gelato_attributes, gelato_color_data, position")
      .eq("product_id", productId)
      .order("position", { ascending: true });

    if (error) {
      console.error("PRODUCT_COLORS_ERROR", { code: error.code });
      return NextResponse.json(
        { colors: [], error: "Failed to load product colors" },
        { status: 500, headers: { "Cache-Control": NO_STORE } },
      );
    }

    const uniqueColors = new Map<string, ColorResponseRow>();

    for (const item of (data ?? []) as ColorRow[]) {
      const name = item.color?.trim();
      if (!name) continue;
      const key = name.toLocaleLowerCase();
      if (!uniqueColors.has(key)) {
        uniqueColors.set(key, {
          id: item.id,
          name,
          hex: (resolveProductColorVisual({
            color: item.color,
            colorHex: item.color_hex,
            gelatoColorKey: item.gelato_color_key,
            gelatoAttributes: item.gelato_attributes,
            gelatoColorData: item.gelato_color_data,
          }).hex ?? item.color_hex ?? "") as string,
          visual: resolveProductColorVisual({
            color: item.color,
            colorHex: item.color_hex,
            gelatoColorKey: item.gelato_color_key,
            gelatoAttributes: item.gelato_attributes,
            gelatoColorData: item.gelato_color_data,
          }),
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
