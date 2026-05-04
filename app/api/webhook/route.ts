import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const body = Buffer.from(await req.arrayBuffer());

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    const orderId = session.metadata?.order_id;
    if (!orderId) {
      return NextResponse.json({ received: true });
    }

    // 🔥 update only if pending
    await supabase
      .from("orders")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("status", "pending");

    return NextResponse.json({ received: true });

  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}