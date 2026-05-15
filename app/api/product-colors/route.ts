import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // agora recebe UUID REAL do produto
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        {
          colors: [],
        },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();

    // buscar cores diretamente pelo product_id
    const { data, error } = await supabase
      .from("product_colors")
      .select("id, color, color_hex, position")
      .eq("product_id", productId)
      .order("position", { ascending: true });

    if (error) {
      console.error("SUPABASE ERROR:", error);

      return NextResponse.json(
        {
          error: error.message,
          colors: [],
        },
        { status: 500 }
      );
    }

    const colors = Array.from(
      new Map(
        (data || []).map((item: any) => [
          String(item.color).toLowerCase(),
          {
            id: item.id,
            name: item.color,
            hex: item.color_hex || "#cccccc",
          },
        ])
      ).values()
    );

    return NextResponse.json({ colors });
  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      {
        error: err.message,
        colors: [],
      },
      { status: 500 }
    );
  }
}