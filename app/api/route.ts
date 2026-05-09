import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { baseProductId, designFront, designBack, markup } =
      await req.json();

    if (!baseProductId) {
      return NextResponse.json(
        { error: "Base product ID missing" },
        { status: 400 }
      );
    }

    const { data: baseProduct, error: productError } = await supabase
      .from("products")
      .select("id,title,description,price,currency,image,images,category,slug")
      .eq("id", baseProductId)
      .single();

    if (productError || !baseProduct) {
      return NextResponse.json(
        { error: "Base product not found" },
        { status: 404 }
      );
    }

    const productMarkup = Number(markup || 0);
    const basePrice = Number(baseProduct.price || 0);
    const finalPrice = basePrice + productMarkup;

    const { data, error } = await supabase
      .from("user_products")
      .insert({
        user_id: user.id,
        base_product_id: baseProduct.id,
        title: baseProduct.title,
        description: baseProduct.description || null,
        price: basePrice,
        currency: baseProduct.currency || "USD",
        image: baseProduct.image || null,
        images: baseProduct.images || null,
        category: baseProduct.category || null,
        slug: `${baseProduct.slug || baseProduct.title}-${Date.now()}`,
        design_front: designFront || [],
        design_back: designBack || [],
        markup: productMarkup,
        final_price: finalPrice,
        status: "draft",
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: data,
    });
  } catch (error) {
    console.error("Erro ao guardar produto com design:", error);

    return NextResponse.json(
      { error: "Erro ao guardar produto com design" },
      { status: 500 }
    );
  }
}