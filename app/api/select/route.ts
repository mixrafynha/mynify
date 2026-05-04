import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    // buscar produto base
    const { data: product, error } = await supabase
      .from("products")
      .select("id, title, description, price, image, is_active")
      .eq("id", productId)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // resposta pronta para editor
    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.title,
        basePrice: product.price,
        image: product.image
      }
    });

  } catch (err) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}