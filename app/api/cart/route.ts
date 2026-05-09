import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ items: [] });
    }

    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        id,
        product_id,
        variant_id,
        title,
        price,
        quantity,
        color,
        size,
        image,
        product_variants!cart_items_variant_id_fkey (
          stock
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const items =
      data?.map((item: any) => ({
        ...item,
        stock: item.product_variants?.stock ?? null,
      })) ?? [];

    return Response.json({ items });
  } catch (err: any) {
    return Response.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}
