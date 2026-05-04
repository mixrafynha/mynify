import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const orderId = params?.id;

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        status,
        created_at,
        stripe_session_id,
        product_id,
        product_title,
        product_price,
        product_currency,
        product_image
      `)
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id: data.id,
        status: data.status,
        created_at: data.created_at,
        stripe_session_id: data.stripe_session_id,
        product_id: data.product_id,
        product: {
          title: data.product_title,
          price: data.product_price,
          currency: data.product_currency,
          image: data.product_image,
        },
      },
    });

  } catch (err) {
    console.error("ORDER API ERROR:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}