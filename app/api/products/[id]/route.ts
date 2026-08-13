import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export const revalidate = 60;

const PUBLIC_CACHE =
  "public, max-age=30, s-maxage=60, stale-while-revalidate=300";
const NO_STORE = "no-store";

function isSafeId(value: string): boolean {
  return value.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(value);
}

function normalize(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

type ProductRow = {
  id: string;
  title: string;
  description: string | null;
  price: number | string | null;
  currency: string | null;
  image: string | null;
  images: unknown;
  category: string | null;
  slug: string | null;
  position: number | null;
  collection: string | null;
  is_new: boolean | null;
  is_hot: boolean | null;
  is_featured: boolean | null;
  discount_price: number | string | null;
  status: string | null;
  rating: number | null;
  sales_count: number | null;
  audience: string | null;
  created_at: string | null;
};

type ColorRow = {
  id: string;
  product_id: string;
  color: string | null;
  color_hex: string | null;
  mockup_front: string | null;
  mockup_back: string | null;
  thumbnail: string | null;
  position: number | null;
};

type VariantRow = {
  id: string;
  product_color_id: string;
  name: string | null;
  size: string | null;
  stock: number | null;
  price: number | string | null;
  sku: string | null;
};

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const id = params?.id?.trim();
    if (!id || !isSafeId(id)) {
      return NextResponse.json(
        { error: "Invalid id" },
        { status: 400, headers: { "Cache-Control": NO_STORE } },
      );
    }

    const supabase = await createSupabaseServer();

    const [productResult, colorsResult] = await Promise.all([
      supabase
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
        .eq("id", id)
        .eq("is_active", true)
        .eq("status", "active")
        .is("deleted_at", null)
        .maybeSingle(),
      supabase
        .from("product_colors")
        .select(
          "id, product_id, color, color_hex, mockup_front, mockup_back, thumbnail, position",
        )
        .eq("product_id", id)
        .order("position", { ascending: true }),
    ]);

    if (productResult.error || !productResult.data) {
      if (productResult.error) {
        console.error("PRODUCT_BY_ID_ERROR", { code: productResult.error.code });
      }
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404, headers: { "Cache-Control": NO_STORE } },
      );
    }

    if (colorsResult.error) {
      console.error("PRODUCT_BY_ID_COLORS_ERROR", { code: colorsResult.error.code });
      return NextResponse.json(
        { error: "Failed to load product colors" },
        { status: 500, headers: { "Cache-Control": NO_STORE } },
      );
    }

    const product = productResult.data as ProductRow;
    const colors = ((colorsResult.data ?? []) as ColorRow[]).map((color) => ({
      id: color.id,
      product_id: color.product_id,
      color: color.color,
      color_hex: color.color_hex || "#ccc",
      mockup_front: color.mockup_front,
      mockup_back: color.mockup_back,
      thumbnail: color.thumbnail,
      position: color.position,
    }));

    const colorIds = colors.map((color) => color.id);
    let variantRows: VariantRow[] = [];

    if (colorIds.length > 0) {
      const { data, error } = await supabase
        .from("product_variants")
        .select("id, product_color_id, name, size, stock, price, sku")
        .in("product_color_id", colorIds)
        .order("size", { ascending: true });

      if (error) {
        console.error("PRODUCT_BY_ID_VARIANTS_ERROR", { code: error.code });
        return NextResponse.json(
          { error: "Failed to load product variants" },
          { status: 500, headers: { "Cache-Control": NO_STORE } },
        );
      }

      variantRows = (data ?? []) as VariantRow[];
    }

    const colorMap = new Map(colors.map((color) => [color.id, color]));
    const variants = variantRows.map((variant) => {
      const color = colorMap.get(variant.product_color_id);
      return {
        id: variant.id,
        product_id: product.id,
        product_color_id: variant.product_color_id,
        name: variant.name ?? null,
        size: normalize(variant.size),
        stock: Number(variant.stock ?? 0),
        price: variant.price != null ? Number(variant.price) : null,
        sku: variant.sku ?? null,
        color: color?.color || null,
        color_hex: color?.color_hex || "#ccc",
      };
    });

    const images = Array.isArray(product.images)
      ? product.images.filter((image): image is string => typeof image === "string" && image.length > 0)
      : product.image
        ? [product.image]
        : [];

    const variantPrices = variants
      .map((variant) => Number(variant.price))
      .filter((price) => Number.isFinite(price) && price >= 0);
    const basePrice = Number(product.price ?? 0);
    const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : basePrice;
    const defaultVariant = variants.find((variant) => variant.stock > 0) ?? variants[0] ?? null;

    const responseProduct = {
      ...product,
      // Legacy field used by existing catalog consumers as a "From" price.
      price: minPrice,
      basePrice,
      minPrice,
      fromPrice: minPrice,
      images,
      colors,
      variants,
      // Mantido para compatibilidade com consumidores que usam uma sugestão inicial.
      // A seleção efetiva continua vazia: o utilizador não é obrigado a escolher variante.
      defaultVariant,
      selectedVariant: null,
      variantSelectionRequired: false,
      hasVariants: variants.length > 0,
    };

    return NextResponse.json(
      { product: responseProduct, ...responseProduct },
      { headers: { "Cache-Control": PUBLIC_CACHE } },
    );
  } catch (error) {
    console.error("GET_PRODUCT_ROUTE_ERROR", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Server error" },
      { status: 500, headers: { "Cache-Control": NO_STORE } },
    );
  }
}
