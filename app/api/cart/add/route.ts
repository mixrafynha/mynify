import { createSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const productId = String(body.productId ?? "");
    const variantId = body.variantId ? String(body.variantId) : null;
    const quantity = Math.max(1, Number(body.quantity ?? 1));

    if (!productId || !quantity) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, title, price, discount_price, currency, image, images, is_active, status")
      .eq("id", productId)
      .eq("is_active", true)
      .eq("status", "active")
      .single();

    if (productError || !product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const finalPrice = Number(product.discount_price ?? product.price);

    if (!finalPrice || finalPrice <= 0) {
      return Response.json({ error: "Invalid product price" }, { status: 400 });
    }

    const image =
      product.image ??
      product.images?.[0] ??
      null;

    const color = body.color ? String(body.color) : null;
    const size = body.size ? String(body.size) : null;
    const sku = body.sku ? String(body.sku) : null;

    const { data: existingItem, error: existingError } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .eq("variant_id", variantId)
      .maybeSingle();

    if (existingError) {
      return Response.json({ error: existingError.message }, { status: 500 });
    }

    if (existingItem) {
      const newQuantity = Number(existingItem.quantity ?? 0) + quantity;

      const { data, error } = await supabase
        .from("cart_items")
        .update({
          quantity: newQuantity,
          title: product.title,
          price: finalPrice,
          currency: product.currency ?? "USD",
          image,
          color,
          size,
          sku,
        })
        .eq("id", existingItem.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ success: true, data });
    }

    const { data, error } = await supabase
      .from("cart_items")
      .insert({
        user_id: user.id,
        product_id: product.id,
        variant_id: variantId,
        title: product.title,
        price: finalPrice,
        currency: product.currency ?? "USD",
        quantity,
        image,
        color,
        size,
        sku,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, data });
  } catch (err: any) {
    return Response.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}
