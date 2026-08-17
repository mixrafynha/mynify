import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = params?.id;

    if (!orderId) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    const { data, error } = await supabase
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
        shipping_address,
        shipping_method,
        product_id,
        product_title,
        product_price,
        product_currency,
        product_image,
        order_items!order_items_order_id_fkey (
          id,
          order_id,
          cart_item_id,
          user_product_id,
          product_id,
          variant_id,
          title,
          quantity,
          size,
          color,
          sku,
          unit_price,
          currency,
          image,
          mockup_front,
          mockup_back,
          print_files,
          selected_variant,
          gelato_product_uid,
          created_at
        )
      `)
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    console.log("[orders-api:raw-order-items]", {
      requestedOrderId: orderId,
      rawKeys: Object.keys(data ?? {}),
      orderItemsCount: Array.isArray(data?.order_items)
        ? data.order_items.length
        : null,
      itemsCount: Array.isArray((data as any)?.items)
        ? (data as any).items.length
        : null,
      orderItemsFirst:
        Array.isArray(data?.order_items) && data.order_items[0]
          ? {
              id: data.order_items[0].id,
              order_id: data.order_items[0].order_id,
              image: data.order_items[0].image ?? null,
            }
          : null,
    });

    const items = Array.isArray(data.order_items) ? data.order_items : [];
    const firstItem = items[0] ?? null;
    const imageItem =
      items.find((item) => item?.image || item?.mockup_front || item?.mockup_back) ??
      firstItem;

    return NextResponse.json({
      data: {
        id: data.id,
        status: data.status,
        payment_status: data.payment_status,
        gelato_status: data.gelato_status,
        created_at: data.created_at,
        updated_at: data.updated_at,
        stripe_session_id: data.stripe_session_id,
        checkout_draft_id: data.checkout_draft_id,
        gelato_draft_order_id: data.gelato_draft_order_id,
        subtotal: data.subtotal,
        shipping_amount: data.shipping_amount,
        total: data.total ?? data.product_price,
        currency: data.currency ?? data.product_currency ?? "EUR",
        shipping_address: data.shipping_address,
        shipping_method: data.shipping_method,
        items,
        // Legacy shape kept for the current order detail UI.
        product_id: firstItem?.product_id ?? data.product_id,
        product: {
          title: firstItem?.title ?? data.product_title,
          price: firstItem?.unit_price ?? data.product_price,
          currency: firstItem?.currency ?? data.product_currency ?? "EUR",
          image: imageItem?.image ?? imageItem?.mockup_front ?? imageItem?.mockup_back ?? data.product_image ?? null,
        },
      },
    });
  } catch (err) {
    console.error("ORDER API ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
