import { createSupabaseServer } from "@/lib/supabase-server";
import { getAvailableVariants } from "./_variant";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CartVariantRelation = {
  id: string;
  stock: number | null;
  size: string | null;
  price: number | string | null;
  sku: string | null;
  product_color_id: string | null;
};

type CartItem = {
  id: string;
  product_id: string;
  variant_id: string | null;
  title: string | null;
  price: number | string | null;
  currency: string | null;
  quantity: number | null;
  color: string | null;
  size: string | null;
  sku: string | null;
  image: string | null;
  created_at: string | null;
  product_variants?: CartVariantRelation | CartVariantRelation[] | null;
};

type SupabaseManyResponse<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function GET() {
  try {
    const supabase = createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const { data, error } = (await supabase
      .from("cart_items")
      .select(`
        id,
        product_id,
        variant_id,
        title,
        price,
        currency,
        quantity,
        color,
        size,
        sku,
        image,
        created_at,
        product_variants!cart_items_variant_id_fkey (
          id,
          stock,
          size,
          price,
          sku,
          product_color_id
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })) as SupabaseManyResponse<CartItem>;

    if (error) {
      return Response.json({ error: error.message }, { status: 500, headers: { "Cache-Control": "no-store" } });
    }

    const items = await Promise.all(
      (data ?? []).map(async (item) => {
        const availableVariants = await getAvailableVariants(supabase, item.product_id);
        const selectedVariant = availableVariants.find((variant) => variant.id === item.variant_id) ?? null;
        const variantRelation = firstRelation(item.product_variants);

        return {
          ...item,
          product_variants: variantRelation,
          stock: variantRelation?.stock ?? selectedVariant?.stock ?? null,
          selectedVariant,
          availableVariants,
          variants: availableVariants,
        };
      }),
    );

    return Response.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: "Server error", details: message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
