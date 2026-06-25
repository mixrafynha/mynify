import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { addSavedDesignToCart } from "./cart";
import {
  buildUserProductSavePayload,
  getBaseProduct,
  isUuid,
} from "./save-design-payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
        { status: 401 },
      );
    }

    const body = await req.json();

    const baseProductId =
      body.baseProductId ||
      body.base_product_id ||
      body.productId ||
      body.product_id;

    if (!baseProductId) {
      return NextResponse.json(
        { error: "Base product ID missing" },
        { status: 400 },
      );
    }

    const { baseProduct, productError } = await getBaseProduct({
      supabase,
      baseProductId: String(baseProductId),
    });

    if (productError || !baseProduct) {
      console.error("PRODUCT ERROR:", productError);

      return NextResponse.json(
        { error: "Base product not found" },
        { status: 404 },
      );
    }

    const designId = isUuid(body.designId || body.id)
      ? String(body.designId || body.id)
      : crypto.randomUUID();

    const savePayload = await buildUserProductSavePayload({
      body,
      userId: user.id,
      designId,
      baseProduct,
    });

    const { data: userProduct, error: saveError } = await supabase
      .from("user_products")
      .upsert(savePayload, {
        onConflict: "id",
      })
      .select()
      .single();

    if (saveError) {
      console.error("USER PRODUCT SAVE ERROR:", saveError);

      return NextResponse.json(
        { error: saveError.message },
        { status: 500 },
      );
    }

    const shouldAddToCart = body.addToCart !== false;
    let cartItem = null;
    let cartMode: "extended" | "basic" | null = null;

    if (shouldAddToCart) {
      const cartResult = await addSavedDesignToCart({
        supabase,
        userId: user.id,
        userProduct,
        body,
      });

      if (cartResult.error) {
        console.error("CART INSERT ERROR:", cartResult.error);

        return NextResponse.json(
          {
            error: cartResult.error.message || "Design saved but cart insert failed",
            designId: userProduct.id,
            product: userProduct,
          },
          { status: 500 },
        );
      }

      cartItem = cartResult.data;
      cartMode = cartResult.mode;
    }

    return NextResponse.json({
      success: true,
      designId: userProduct.id,
      product: userProduct,
      cartItem,
      cartMode,
      redirectTo: "/cart",
    });
  } catch (error) {
    console.error("Erro ao guardar produto com design:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao guardar produto com design",
      },
      { status: 500 },
    );
  }
}
