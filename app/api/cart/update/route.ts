import { createSupabaseServer } from "@/lib/supabase-server";

export async function PATCH(req: Request) {
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

    const id = String(body.id ?? "");
    const quantity = Number(body.quantity ?? 0);

    if (!id || quantity < 1) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { data: cartItem, error: cartError } = await supabase
      .from("cart_items")
      .select("id, user_id, variant_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (cartError || !cartItem) {
      return Response.json({ error: "Cart item not found" }, { status: 404 });
    }

    if (cartItem.variant_id) {
      const { data: variant, error: variantError } = await supabase
        .from("product_variants")
        .select("stock")
        .eq("id", cartItem.variant_id)
        .single();

      if (variantError || !variant) {
        return Response.json({ error: "Variant not found" }, { status: 404 });
      }

      if (quantity > Number(variant.stock)) {
        return Response.json(
          { error: "Not enough stock", stock: variant.stock },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, quantity")
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
