import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createSupabaseServer();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      payment_status,
      gelato_status,
      created_at,
      updated_at,
      stripe_session_id,
      checkout_draft_id,
      gelato_draft_order_id,
      subtotal,
      shipping_amount,
      total,
      currency,
      product_id,
      product_title,
      product_price,
      product_currency,
      product_image,
      order_items (
        id,
        product_id,
        variant_id,
        user_product_id,
        title,
        quantity,
        unit_price,
        currency,
        size,
        color,
        sku,
        image,
        gelato_product_uid
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (ordersError) {
    return NextResponse.json(
      { error: ordersError.message },
      { status: 500 },
    );
  }

  const enriched = (orders ?? []).map((order) => {
    const items = Array.isArray(order.order_items) ? order.order_items : [];
    const firstItem = items[0] ?? null;

    return {
      id: order.id,
      status: order.status,
      payment_status: order.payment_status,
      gelato_status: order.gelato_status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      stripe_session_id: order.stripe_session_id,
      checkout_draft_id: order.checkout_draft_id,
      gelato_draft_order_id: order.gelato_draft_order_id,
      subtotal: order.subtotal,
      shipping_amount: order.shipping_amount,
      total: order.total ?? order.product_price,
      currency: order.currency ?? order.product_currency ?? "EUR",
      items,
      // Legacy shape kept so the current dashboard does not break.
      product_id: firstItem?.product_id ?? order.product_id,
      product: {
        title: firstItem?.title ?? order.product_title,
        price: firstItem?.unit_price ?? order.product_price,
        currency: firstItem?.currency ?? order.product_currency ?? "EUR",
        image: firstItem?.image ?? order.product_image ?? null,
      },
    };
  });

  return NextResponse.json({ data: enriched });
}
