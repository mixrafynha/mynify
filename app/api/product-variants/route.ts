import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        {
          variants: [],
        },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();

    /* ================= COLORS ================= */
    const { data: colors, error: colorsError } =
      await supabase
        .from("product_colors")
        .select("*")
        .eq("product_id", productId)
        .order("position", { ascending: true });

    if (colorsError) {
      console.error(colorsError);

      return NextResponse.json(
        {
          variants: [],
        },
        { status: 500 }
      );
    }

    const colorIds =
      colors?.map((c: any) => c.id) || [];

    if (!colorIds.length) {
      return NextResponse.json({
        variants: [],
      });
    }

    /* ================= VARIANTS ================= */
    const { data: variantsData, error: variantsError } =
      await supabase
        .from("product_variants")
        .select("*")
        .in("product_color_id", colorIds);

    if (variantsError) {
      console.error(variantsError);

      return NextResponse.json(
        {
          variants: [],
        },
        { status: 500 }
      );
    }

    const variants = (variantsData || []).map(
      (variant: any) => {
        const color = colors.find(
          (c: any) =>
            c.id === variant.product_color_id
        );

        return {
          ...variant,

          color: color?.color || null,
          color_hex:
            color?.color_hex || "#cccccc",

          product_color: color || null,
        };
      }
    );

    return NextResponse.json({
      variants,
    });
  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      {
        variants: [],
      },
      { status: 500 }
    );
  }
}