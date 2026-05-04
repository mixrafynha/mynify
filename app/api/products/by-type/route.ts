import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { type } = await req.json();

    if (!type) {
      return NextResponse.json(
        { error: "Missing category type" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        slug,
        title,
        price,
        image,
        images,
        category,
        is_active
      `)
      .eq("category", type)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("position", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}