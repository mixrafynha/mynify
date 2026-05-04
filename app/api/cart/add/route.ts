import { createSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.product_id || !body.title || !body.price) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { data, error } = await supabase.from("carts").insert({
      user_id: user.id,
      product_id: body.product_id,
      title: body.title,
      price: body.price,
      quantity: body.quantity ?? 1,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, data });
  } catch (err: any) {
    return Response.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}