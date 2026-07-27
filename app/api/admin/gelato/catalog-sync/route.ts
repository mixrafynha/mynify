import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { syncGelatoCatalog } from "@/lib/gelato/catalog-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const check = await requireAdmin();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const productId = new URL(request.url).searchParams.get("productId")?.trim();
  if (!productId) {
    return NextResponse.json({ error: "Missing productId." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("gelato_catalog_sync_state")
    .select("*")
    .eq("product_id", productId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ state: data ?? null });
}

export async function POST(request: Request) {
  const check = await requireAdmin();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
    const body = await request.json();
    const result = await syncGelatoCatalog({
      productId: body?.productId,
      catalogUid: body?.catalogUid,
      attributeFilters: body?.attributeFilters,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to sync Gelato catalog.",
      },
      { status: 500 },
    );
  }
}
