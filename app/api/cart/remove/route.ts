import { createSupabaseServer } from "@/lib/supabase-server";

export async function DELETE(req: Request) {
  try {
    const supabase = createSupabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Missing id" }, { status: 400 });
    }

    const { error } = await supabase
      .from("carts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id); // 🔐 segurança SaaS

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}