import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/requireAdmin";
import { refreshProductVariantSellingPrices } from "@/lib/gelato/catalog-sync";

export const dynamic = "force-dynamic";

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

type NormalizedVariant = {
  size: string;
  sku: string | null;
  stock: number;
  price: number;
  name: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function dedupeVariants(variants: NormalizedVariant[]) {
  const seen = new Set<string>();

  return variants.filter((variant) => {
    const signature = [
      variant.size.trim().toLowerCase(),
      String(variant.sku || "").trim().toLowerCase(),
      variant.name.trim().toLowerCase(),
    ].join("|");

    if (seen.has(signature)) {
      return false;
    }

    seen.add(signature);
    return true;
  });
}

/* ================= GET PRODUCT ================= */
export async function GET(
  req: Request,
  { params }: { params: { id?: string } }
) {
  const check = await requireAdmin();

  if ("error" in check) {
    return NextResponse.json(
      { error: check.error },
      { status: check.status }
    );
  }

  const id = params?.id;

  if (!id) {
    return NextResponse.json(
      { error: "Invalid id" },
      { status: 400 }
    );
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
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Product not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data });
}

/* ================= PATCH PRODUCT ================= */
export async function PATCH(
  req: Request,
  { params }: { params: { id?: string } }
) {
  const check = await requireAdmin();

  if ("error" in check) {
    return NextResponse.json(
      { error: check.error },
      { status: check.status }
    );
  }

  const id = params?.id;
  if (!id) {
    return NextResponse.json(
      { error: "Invalid id" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const supabase = createSupabaseAdmin();

  const updatePayload: Record<string, any> = {};

  if (body.title !== undefined) updatePayload.title = clean(body.title);
  if (body.slug !== undefined) updatePayload.slug = clean(body.slug);
  if (body.description !== undefined) updatePayload.description = clean(body.description);
  if (body.category !== undefined) updatePayload.category = clean(body.category) || null;
  if (body.price !== undefined) updatePayload.price = Number(body.price);
  if (body.discount_price !== undefined) {
    updatePayload.discount_price =
      body.discount_price === null || body.discount_price === ""
        ? null
        : Number(body.discount_price);
  }
  if (body.profit_markup_percentage !== undefined) {
    const markup = Number(body.profit_markup_percentage);
    if (!Number.isFinite(markup) || markup < 0 || markup > 500) {
      return NextResponse.json(
        { error: "Profit markup percentage must be between 0 and 500." },
        { status: 400 },
      );
    }
    updatePayload.profit_markup_percentage = markup;
  }
  if (body.image !== undefined) updatePayload.image = clean(body.image) || null;
  if (body.images !== undefined) updatePayload.images = cleanArray(body.images);
  if (body.tags !== undefined) updatePayload.tags = cleanArray(body.tags);
  if (body.is_active !== undefined) updatePayload.is_active = body.is_active;
  if (body.is_active !== undefined) {
    updatePayload.status = body.is_active ? "active" : "draft";
  }

  if (updatePayload.price !== undefined && (!Number.isFinite(updatePayload.price) || updatePayload.price <= 0)) {
    return NextResponse.json(
      { error: "Invalid price" },
      { status: 400 }
    );
  }

  if (
    updatePayload.discount_price !== undefined &&
    updatePayload.discount_price !== null &&
    (!Number.isFinite(updatePayload.discount_price) || updatePayload.discount_price < 0)
  ) {
    return NextResponse.json(
      { error: "Invalid discount price" },
      { status: 400 }
    );
  }

  if (
    body.image !== undefined &&
    body.images !== undefined &&
    (!updatePayload.image || updatePayload.images.length === 0)
  ) {
    return NextResponse.json(
      { error: "At least one image is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("products")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const colors: ColorInput[] = Array.isArray(body.colors) ? body.colors : [];
  const variants: VariantInput[] = Array.isArray(body.variants) ? body.variants : [];

  const hasStructurePayload =
    body.colors !== undefined || body.variants !== undefined;

  let shouldRebuildProductOptions = hasStructurePayload;

  if (hasStructurePayload) {
    const { data: existingProduct, error: existingProductError } = await supabase
      .from("products")
      .select(`
        product_colors (
          color,
          color_hex,
          product_variants (
            size,
            sku,
            stock,
            price,
            name
          )
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (existingProductError) {
      return NextResponse.json(
        { error: existingProductError.message },
        { status: 500 }
      );
    }

    const existingColors = Array.isArray(existingProduct?.product_colors)
      ? existingProduct.product_colors
      : [];

    const normalizeVariantRows = (rows: any[]) =>
      rows.map((variant) => ({
        size: clean(variant.size),
        sku: clean(variant.sku),
        stock: Number(variant.stock) || 0,
        price: Number(variant.price) || 0,
        name: clean(variant.name) || clean(variant.size),
      }));

    const normalizeRequestedVariants = (rows: VariantInput[]) =>
      dedupeVariants(
        rows
          .map((variant) => ({
            size: clean(variant.size),
            sku: clean(variant.sku) || null,
            stock: Number.isFinite(Number(variant.stock)) ? Number(variant.stock) : 0,
            price: Number.isFinite(Number(variant.price)) ? Number(variant.price) : 0,
            name: clean(variant.name) || clean(variant.size),
          }))
          .filter((variant) => variant.size),
      );

    const existingColorSignature = JSON.stringify(
      existingColors.map((color: any) => ({
        color: clean(color.color),
        color_hex: clean(color.color_hex),
      }))
    );

    const requestedColorSignature = JSON.stringify(
      colors.map((color) => ({
        color: clean(color.color) || clean(color.name),
        color_hex: clean(color.color_hex) || clean(color.hex),
      }))
    );

    const existingVariantSignature = JSON.stringify(
      existingColors.flatMap((color: any) =>
        normalizeVariantRows(
          Array.isArray(color.product_variants) ? color.product_variants : []
        )
      )
    );

    const requestedVariantSignature = JSON.stringify(
      normalizeRequestedVariants(variants)
    );

    shouldRebuildProductOptions =
      existingColorSignature !== requestedColorSignature ||
      existingVariantSignature !== requestedVariantSignature;
  }

  if (shouldRebuildProductOptions) {
    const { data: existingColors, error: existingColorsError } = await supabase
      .from("product_colors")
      .select("id")
      .eq("product_id", id);

    if (existingColorsError) {
      return NextResponse.json(
        { error: existingColorsError.message },
        { status: 500 }
      );
    }

    const existingColorIds = (existingColors ?? []).map((color) => color.id);

    if (existingColorIds.length > 0) {
      const { error: deleteVariantsError } = await supabase
        .from("product_variants")
        .delete()
        .in("product_color_id", existingColorIds);

      if (deleteVariantsError) {
        return NextResponse.json(
          { error: deleteVariantsError.message },
          { status: 500 }
        );
      }
    }

    const { error: deleteColorsError } = await supabase
      .from("product_colors")
      .delete()
      .eq("product_id", id);

    if (deleteColorsError) {
      return NextResponse.json(
        { error: deleteColorsError.message },
        { status: 500 }
      );
    }

    const image =
      updatePayload.image ??
      clean(body.image) ??
      data?.image ??
      null;
    const images =
      updatePayload.images ??
      (body.images !== undefined
        ? cleanArray(body.images)
        : Array.isArray(data?.images)
          ? data.images
          : []);
    const fallbackBackImage = images[1] || null;

    const colorRows = colors
      .map((color, index) => {
        const colorName = clean(color.color) || clean(color.name);

        return {
          product_id: id,
          color: colorName,
          color_hex: clean(color.color_hex) || clean(color.hex) || "#ffffff",
          mockup_front: clean(color.mockup_front) || image,
          mockup_back: clean(color.mockup_back) || fallbackBackImage,
          thumbnail: clean(color.thumbnail) || image,
          position: index,
        };
      })
      .filter((color) => color.color);

    const finalColorRows =
      colorRows.length > 0 && image
        ? colorRows
        : image
          ? [
              {
                product_id: id,
                color: "Default",
                color_hex: "#ffffff",
                mockup_front: image,
                mockup_back: fallbackBackImage,
                thumbnail: image,
                position: 0,
              },
            ]
          : [];

    if (finalColorRows.length > 0) {
      const { data: createdColors, error: colorsError } = await supabase
        .from("product_colors")
        .insert(finalColorRows)
        .select("id");

      if (colorsError || !createdColors) {
        return NextResponse.json(
          { error: colorsError?.message || "Failed to update product colors" },
          { status: 500 }
        );
      }

      const basePrice =
        updatePayload.price ??
        Number(data?.price ?? 0);

      const cleanVariants = dedupeVariants(
        variants
          .map((variant) => ({
            size: clean(variant.size),
            sku: clean(variant.sku) || null,
            stock: Number.isFinite(Number(variant.stock)) ? Number(variant.stock) : 0,
            price: Number.isFinite(Number(variant.price)) ? Number(variant.price) : basePrice,
            name: clean(variant.name) || clean(variant.size),
          }))
          .filter((variant) => variant.size),
      );

      const finalVariants =
        cleanVariants.length > 0
          ? cleanVariants
          : [
              {
                size: "Default",
                sku: null,
                stock: 0,
                price: basePrice,
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
        return NextResponse.json(
          { error: variantsError.message },
          { status: 500 }
        );
      }
    }
  }

  if (body.profit_markup_percentage !== undefined) {
    const refreshResult = await refreshProductVariantSellingPrices(id);
    const { data: fullProduct } = await supabase
      .from("products")
      .select(`
        *,
        product_colors (
          *,
          product_variants (*)
        )
      `)
      .eq("id", id)
      .maybeSingle();
    return NextResponse.json({ data: fullProduct ?? data, pricing: refreshResult });
  }

  const { data: fullProduct } = await supabase
    .from("products")
    .select(`
      *,
      product_colors (
        *,
        product_variants (*)
      )
    `)
    .eq("id", id)
    .maybeSingle();

  return NextResponse.json({ data: fullProduct ?? data });
}

/* ================= DELETE PRODUCT ================= */
export async function DELETE(
  req: Request,
  { params }: { params: { id?: string } }
) {
  const check = await requireAdmin();

  if ("error" in check) {
    return NextResponse.json(
      { error: check.error },
      { status: check.status }
    );
  }

  const id = params?.id;

  if (!id) {
    return NextResponse.json(
      { error: "Invalid id" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
