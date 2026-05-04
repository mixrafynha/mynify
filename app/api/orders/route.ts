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

  // 🔥 ORDERS (usando snapshot)
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      created_at,
      stripe_session_id,
      product_id,
      product_title,
      product_price,
      product_currency
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (ordersError) {
    return NextResponse.json(
      { error: ordersError.message },
      { status: 500 }
    );
  }

  if (!orders?.length) {
    return NextResponse.json({ data: [] });
  }

  // 🔥 MAP FINAL (SEM products table)
  const enriched = orders.map((order) => ({
    id: order.id,
    status: order.status,
    created_at: order.created_at,
    stripe_session_id: order.stripe_session_id,
    product_id: order.product_id,

    product: {
      title: order.product_title,
      price: order.product_price,
      currency: order.product_currency,
    },
  }));

  return NextResponse.json({ data: enriched });
}