import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Product id missing" },
        { status: 400 }
      );
    }

    const auth = req.headers.get("authorization");

    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = auth.split(" ")[1];

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, title, price, currency")
      .eq("id", id)
      .single();

    if (productError || !product) {
      console.error("PRODUCT ERROR:", productError);

      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (!product.title || product.price == null) {
      return NextResponse.json(
        { error: "Product data missing" },
        { status: 400 }
      );
    }

    const unitAmount = Math.round(Number(product.price) * 100);

    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid product price" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    const { data: existing } = await supabase
      .from("orders")
      .select("id, stripe_session_id")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existing?.stripe_session_id) {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(
          existing.stripe_session_id
        );

        if (existingSession.url) {
          return NextResponse.json({
            url: existingSession.url,
            reused: true,
          });
        }
      } catch (stripeError) {
        console.error("STRIPE SESSION RETRIEVE ERROR:", stripeError);
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: product.currency || "eur",
            product_data: {
              name: product.title,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        product_id: product.id,
      },
      success_url: `${baseUrl}/success`,
      cancel_url: `${baseUrl}/cancel`,
    });

    const { error: insertError } = await supabase.from("orders").insert({
      user_id: user.id,
      product_id: product.id,
      product_title: product.title,
      product_price: product.price,
      product_currency: product.currency || "eur",
      status: "pending",
      stripe_session_id: session.id,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("ORDER INSERT ERROR:", insertError);

      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: session.url,
      reused: false,
    });
  } catch (err) {
    console.error("CHECKOUT ERROR:", err);

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
