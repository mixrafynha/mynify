import { createSupabaseServer } from "@/lib/supabase-server";
import { resolveVariantById } from "../_variant";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CartItem = {
  id: string;
  user_id: string;
  product_id: string;
  user_product_id: string | null;
  variant_id: string | null;
  quantity: number | null;
  image: string | null;
  price: number | null;
};

type SupabaseSingleResponse<T> = {
  data: T | null;
  error: { message: string } | null;
};

type UpdateCartBody = {
  id?: unknown;
  itemId?: unknown;
  item_id?: unknown;
  quantity?: unknown;
  variantId?: unknown;
  variant_id?: unknown;
};

type CartPatch = {
  quantity?: number;
  variant_id?: string;
  color?: string | null;
  size?: string | null;
  sku?: string | null;
  price?: number;
  image?: string | null;
};

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const parsed = String(value).trim();
  return parsed ? parsed : null;
}

function hasVisibleDesign(elements: unknown) {
  return Array.isArray(elements) && elements.some((element) => {
    if (!element || typeof element !== "object") return false;
    const value = element as { type?: unknown; meta?: { hidden?: unknown } };
    return (
      value.meta?.hidden !== true &&
      ["image", "text", "shape"].includes(String(value.type || ""))
    );
  });
}

async function getSecondPrintCharge(
  supabase: ReturnType<typeof createSupabaseServer>,
  userProductId: string,
) {
  const { data } = await supabase
    .from("user_products")
    .select("design_front, design_back")
    .eq("id", userProductId)
    .maybeSingle();

  return hasVisibleDesign(data?.design_front) &&
    hasVisibleDesign(data?.design_back)
    ? 6
    : 0;
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

    const body = (await req.json()) as UpdateCartBody;
    const id = nullableString(body.id ?? body.itemId ?? body.item_id);

    if (!id) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { data: cartItem, error: cartError } = (await supabase
      .from("cart_items")
      .select("id, user_id, product_id, user_product_id, variant_id, quantity, image, price")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle()) as SupabaseSingleResponse<CartItem>;

    if (cartError || !cartItem) {
      return Response.json({ error: "Cart item not found" }, { status: 404 });
    }

    const patch: CartPatch = {};
    let quantityToValidate = Number(cartItem.quantity ?? 1);

    if (body.quantity !== undefined) {
      const quantity = Number(body.quantity ?? 0);

      if (!Number.isFinite(quantity) || quantity < 1) {
        return Response.json({ error: "Invalid quantity" }, { status: 400 });
      }

      quantityToValidate = Math.floor(quantity);
      patch.quantity = quantityToValidate;
    }

    const incomingVariantId = nullableString(body.variantId ?? body.variant_id);

    if (incomingVariantId) {
      const selectedVariant = await resolveVariantById(supabase, incomingVariantId);

      if (!selectedVariant) {
        return Response.json({ error: "Variant not found" }, { status: 404 });
      }

      if (selectedVariant.stock !== null && quantityToValidate > selectedVariant.stock) {
        return Response.json({ error: "Not enough stock", stock: selectedVariant.stock }, { status: 400 });
      }

      patch.variant_id = selectedVariant.id;
      patch.color = selectedVariant.color;
      patch.size = selectedVariant.size;
      patch.sku = selectedVariant.sku;
      if (!cartItem.user_product_id) {
        patch.image = selectedVariant.image ?? cartItem.image ?? null;

        if (selectedVariant.price !== null && selectedVariant.price > 0) {
          patch.price = selectedVariant.price;
        }
      } else if (selectedVariant.price !== null && selectedVariant.price > 0) {
        const secondPrintCharge = await getSecondPrintCharge(
          supabase,
          cartItem.user_product_id,
        );
        patch.price = selectedVariant.price + secondPrintCharge;
      }
    } else if (cartItem.variant_id && patch.quantity !== undefined) {
      const selectedVariant = await resolveVariantById(supabase, cartItem.variant_id);

      if (!selectedVariant) {
        return Response.json({ error: "Variant not found" }, { status: 404 });
      }

      if (selectedVariant.stock !== null && quantityToValidate > selectedVariant.stock) {
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: "Server error", details: message }, { status: 500 });
  }
}
