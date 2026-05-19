import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type VariantInput = {
  size?: string;
  sku?: string;
  stock?: number;
  price?: number;
  name?: string;
};

type ColorInput = {
  name?: string;
  color?: string;
  hex?: string;
  color_hex?: string;
  mockup_front?: string;
  mockup_back?: string;
  thumbnail?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function createUniqueSlug(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  baseSlug: string
) {
  let slug = baseSlug || `product-${Date.now()}`;
  let counter = 1;

  while (true) {
    const { data } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!data) return slug;

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

export async function GET() {
  const check = await requireAdmin();

  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      product_colors (
        *,
        product_variants (*)
      )
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("GET PRODUCTS ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: Request) {
  const check = await requireAdmin();

  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
    const body = await req.json();

    const title = clean(body.title);
    const description = clean(body.description);
    const category = clean(body.category) || null;
    const image = clean(body.image) || null;
    const images = cleanArray(body.images);
    const tags = cleanArray(body.tags);
    const price = Number(body.price);

    const is_active =
      typeof body.is_active === "boolean" ? body.is_active : true;

    const colors: ColorInput[] = Array.isArray(body.colors) ? body.colors : [];
    const variants: VariantInput[] = Array.isArray(body.variants)
      ? body.variants
      : [];

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    if (!image || images.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    const slugBase = slugify(clean(body.slug) || title);
    const slug = await createUniqueSlug(supabase, slugBase);

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        title,
        slug,
        description,
        price,
        image,
        images,
        category,
        is_active,
        tags,
        status: is_active ? "active" : "draft",
        is_new: true,
      })
      .select()
      .single();

    if (productError || !product) {
      console.error("CREATE PRODUCT ERROR:", productError);
      return NextResponse.json(
        { error: productError?.message || "Product creation failed" },
        { status: 500 }
      );
    }

    const productId = product.id;

    const colorRows = colors
      .map((color, index) => {
        const colorName = clean(color.color) || clean(color.name);

        return {
          product_id: productId,
          color: colorName,
          color_hex: clean(color.color_hex) || clean(color.hex) || "#ffffff",
          mockup_front: clean(color.mockup_front) || image,
          mockup_back: clean(color.mockup_back) || null,
          thumbnail: clean(color.thumbnail) || image,
          position: index,
        };
      })
      .filter((color) => color.color);

    const finalColorRows =
      colorRows.length > 0
        ? colorRows
        : [
            {
              product_id: productId,
              color: "Default",
              color_hex: "#ffffff",
              mockup_front: image,
              mockup_back: null,
              thumbnail: image,
              position: 0,
            },
          ];

    const { data: createdColors, error: colorsError } = await supabase
      .from("product_colors")
      .insert(finalColorRows)
      .select();

    if (colorsError || !createdColors) {
      console.error("CREATE COLORS ERROR:", colorsError);
      return NextResponse.json(
        { error: colorsError?.message || "Color creation failed" },
        { status: 500 }
      );
    }

    const cleanVariants = variants
      .map((variant) => ({
        size: clean(variant.size),
        sku: clean(variant.sku) || null,
        stock: Number.isFinite(Number(variant.stock))
          ? Number(variant.stock)
          : 0,
        price: Number.isFinite(Number(variant.price))
          ? Number(variant.price)
          : price,
        name: clean(variant.name) || clean(variant.size),
      }))
      .filter((variant) => variant.size);

    const finalVariants =
      cleanVariants.length > 0
        ? cleanVariants
        : [
            {
              size: "Default",
              sku: null,
              stock: 0,
              price,
              name: "Default",
            },
          ];

    const variantRows = createdColors.flatMap((color) =>
      finalVariants.map((variant) => ({
        product_color_id: color.id,
        size: variant.size,
        sku: variant.sku,
        stock: variant.stock,
        price: variant.price,
        name: variant.name,
      }))
    );

    const { error: variantsError } = await supabase
      .from("product_variants")
      .insert(variantRows);

    if (variantsError) {
      console.error("CREATE VARIANTS ERROR:", variantsError);
      return NextResponse.json(
        { error: variantsError.message },
        { status: 500 }
      );
    }

    const { data: fullProduct, error: fullError } = await supabase
      .from("products")
      .select(`
        *,
        product_colors (
          *,
          product_variants (*)
        )
      `)
      .eq("id", productId)
      .single();

    if (fullError) {
      console.error("GET FULL PRODUCT ERROR:", fullError);
      return NextResponse.json({ data: product }, { status: 201 });
    }

    return NextResponse.json({ data: fullProduct }, { status: 201 });
  } catch (err) {
    console.error("POST PRODUCT ERROR:", err);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request body" },
      { status: 400 }
    );
  }
}