import { createSupabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getVariantDetails(supabase: any, variantId: string) {
  const { data: variant, error: variantError } = await supabase
    .from("product_variants")
    .select("id, size, stock, price, sku, product_color_id")
    .eq("id", variantId)
    .maybeSingle();

  if (variantError || !variant) return null;

  const { data: color } = await supabase
    .from("product_colors")
    .select("id, product_id, color, color_hex, image")
    .eq("id", variant.product_color_id)
    .maybeSingle();

  return {
    id: variant.id,
    size: variant.size ?? null,
    stock: variant.stock ?? null,
    price: variant.price === null || variant.price === undefined ? null : Number(variant.price),
    sku: variant.sku ?? null,
    color: color?.color ?? null,
    image: color?.image ?? null,
    product_color_product_id: color?.product_id ?? null,
  };
}

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
    const id = String(body.id ?? body.itemId ?? body.item_id ?? "").trim();

    if (!id) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { data: cartItem, error: cartError } = await supabase
      .from("cart_items")
      .select("id, user_id, product_id, variant_id, quantity, image")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (cartError || !cartItem) {
      return Response.json({ error: "Cart item not found" }, { status: 404 });
    }

    const patch: Record<string, any> = {};
    let quantityToValidate = Number(cartItem.quantity ?? 1);

    if (body.quantity !== undefined) {
      const quantity = Number(body.quantity ?? 0);
      if (!Number.isFinite(quantity) || quantity < 1) {
        return Response.json({ error: "Invalid quantity" }, { status: 400 });
      }
      quantityToValidate = quantity;
      patch.quantity = quantity;
    }

    const incomingVariantId = body.variantId ?? body.variant_id;

    if (incomingVariantId !== undefined && incomingVariantId !== null && String(incomingVariantId).trim()) {
      const selectedVariant = await getVariantDetails(supabase, String(incomingVariantId));

      if (!selectedVariant) {
        return Response.json({ error: "Variant not found" }, { status: 404 });
      }

      if (
        selectedVariant.stock !== null &&
        selectedVariant.stock !== undefined &&
        quantityToValidate > Number(selectedVariant.stock)
      ) {
        return Response.json({ error: "Not enough stock", stock: selectedVariant.stock }, { status: 400 });
      }

      patch.variant_id = selectedVariant.id;
      patch.color = selectedVariant.color;
      patch.size = selectedVariant.size;
      patch.sku = selectedVariant.sku;

      if (selectedVariant.price !== null && selectedVariant.price > 0) {
        patch.price = selectedVariant.price;
      }

      if (selectedVariant.image) {
        patch.image = selectedVariant.image;
      }
    } else if (cartItem.variant_id && patch.quantity !== undefined) {
      const selectedVariant = await getVariantDetails(supabase, String(cartItem.variant_id));

      if (!selectedVariant) {
        return Response.json({ error: "Variant not found" }, { status: 404 });
      }

      if (
        selectedVariant.stock !== null &&
        selectedVariant.stock !== undefined &&
        quantityToValidate > Number(selectedVariant.stock)
      ) {
        return Response.json({ error: "Not enough stock", stock: selectedVariant.stock }, { status: 400 });
      }
    }

    if (Object.keys(patch).length === 0) {
      return Response.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("cart_items")
      .update(patch)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, data });
  } catch (err: any) {
    return Response.json({ error: "Server error", details: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
