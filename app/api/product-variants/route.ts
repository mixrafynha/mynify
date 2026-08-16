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
  product_id: string;
  color: string | null;
  color_hex: string | null;
  gelato_color_key?: string | null;
  gelato_attributes?: Record<string, unknown> | null;
  gelato_color_data?: Record<string, unknown> | null;
  mockup_front: string | null;
  mockup_back: string | null;
  thumbnail: string | null;
  position: number | null;
};

type VariantRow = {
  id: string;
  product_color_id: string;
  size: string | null;
  name: string | null;
  sku: string | null;
  stock: number | null;
  price: number | string | null;
  gelato_product_uid: string | null;
  gelato_attributes: Record<string, unknown> | null;
};

type VariantMarketRow = {
  product_variant_id: string;
  country_code: string;
  is_available: boolean;
  availability_source: string | null;
  unavailable_reason: string | null;
};

export async function GET(req: Request) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const productId = searchParams.get("productId")?.trim();
    const countryCode = searchParams.get("countryCode")?.trim().toUpperCase() || null;

    if (!productId || !isSafeId(productId)) {
      return NextResponse.json(
        { variants: [], error: "Invalid productId" },
        { status: 400, headers: { "Cache-Control": NO_STORE } },
      );
    }

    const supabase = await createSupabaseServer();
    const { data: colorRows, error: colorsError } = await supabase
      .from("product_colors")
      .select("id, product_id, color, color_hex, gelato_color_key, gelato_attributes, gelato_color_data, mockup_front, mockup_back, thumbnail, position")
      .eq("product_id", productId)
      .order("position", { ascending: true });

    if (colorsError) {
      console.error("PRODUCT_VARIANTS_COLORS_ERROR", { code: colorsError.code });
      return NextResponse.json(
        { variants: [], error: "Failed to load product colors" },
        { status: 500, headers: { "Cache-Control": NO_STORE } },
      );
    }

    const colors = ((colorRows ?? []) as ColorRow[]).map((color) => {
      const image = color.thumbnail ?? color.mockup_front ?? null;
      return {
        id: color.id,
        product_id: color.product_id,
        name: color.color,
        color: color.color,
        color_hex: resolveProductColorVisual({
          color: color.color,
          colorHex: color.color_hex,
          gelatoColorKey: color.gelato_color_key,
          gelatoAttributes: color.gelato_attributes,
          gelatoColorData: color.gelato_color_data,
        }).hex ?? color.color_hex ?? null,
        color_visual: resolveProductColorVisual({
          color: color.color,
          colorHex: color.color_hex,
          gelatoColorKey: color.gelato_color_key,
          gelatoAttributes: color.gelato_attributes,
          gelatoColorData: color.gelato_color_data,
        }),
        image,
        position: color.position ?? 0,
        raw: color,
      };
    });

    const colorIds = colors.map((color) => color.id);
    if (colorIds.length === 0) {
      return NextResponse.json(
        { variants: [], availableVariants: { colors: [], sizes: [], variants: [] }, colors: [] },
        { status: 200, headers: { "Cache-Control": PUBLIC_CACHE } },
      );
    }

    const { data: variantRows, error: variantsError } = await supabase
      .from("product_variants")
      .select("id, product_color_id, size, name, sku, stock, price, gelato_product_uid, gelato_attributes")
      .in("product_color_id", colorIds)
      .order("size", { ascending: true });

    if (variantsError) {
      console.error("PRODUCT_VARIANTS_ERROR", { code: variantsError.code });
      return NextResponse.json(
        { variants: [], error: "Failed to load product variants" },
        { status: 500, headers: { "Cache-Control": NO_STORE } },
      );
    }

    let marketMap = new Map<string, VariantMarketRow>();
    const variantIds = ((variantRows ?? []) as VariantRow[]).map((variant) => variant.id).filter(Boolean);
    if (countryCode && /^[A-Z]{2}$/.test(countryCode) && variantIds.length > 0) {
      const { data: marketRows, error: marketsError } = await supabase
        .from("gelato_variant_markets")
        .select("product_variant_id, country_code, is_available, availability_source, unavailable_reason")
        .eq("country_code", countryCode)
        .in("product_variant_id", variantIds);

      if (marketsError) {
        console.warn("PRODUCT_VARIANTS_MARKETS_ERROR", { code: marketsError.code });
      } else {
        marketMap = new Map(
          ((marketRows ?? []) as VariantMarketRow[]).map((market) => [market.product_variant_id, market]),
        );
      }
    }

    const colorMap = new Map(colors.map((color) => [color.id, color]));
    const variants = ((variantRows ?? []) as VariantRow[]).map((variant) => {
      const color = colorMap.get(variant.product_color_id) ?? null;
      const image = color?.image ?? null;
      const marketAvailability = marketMap.get(variant.id) ?? null;
      return {
        id: variant.id,
        variant_id: variant.id,
        product_color_id: variant.product_color_id,
        size: variant.size,
        name: variant.name,
        sku: variant.sku,
        stock: Number(variant.stock ?? 0),
        price: variant.price,
        gelato_product_uid: variant.gelato_product_uid,
        gelato_attributes: variant.gelato_attributes,
        market_availability: marketAvailability
          ? {
              country_code: marketAvailability.country_code,
              is_available: marketAvailability.is_available,
              availability_source: marketAvailability.availability_source,
              unavailable_reason: marketAvailability.unavailable_reason,
            }
          : null,
        country_available: marketAvailability ? marketAvailability.is_available : null,
        color: color?.color ?? null,
        color_name: color?.color ?? null,
        color_hex: color?.color_hex ?? null,
        color_visual: color?.color_visual ?? null,
        image,
        image_url: image,
        product_color: color,
        raw: variant,
      };
    });

    const availableVariants = {
      colors,
      sizes: [...new Set(variants.map((variant) => variant.size).filter(Boolean))],
      variants,
    };

    return NextResponse.json(
      { variants, availableVariants, colors },
      { status: 200, headers: { "Cache-Control": PUBLIC_CACHE } },
    );
  } catch (error) {
    console.error("PRODUCT_VARIANTS_ROUTE_ERROR", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { variants: [], error: "Internal server error" },
      { status: 500, headers: { "Cache-Control": NO_STORE } },
    );
  }
}
