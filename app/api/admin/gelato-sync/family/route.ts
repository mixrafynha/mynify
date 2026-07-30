import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { syncGelatoProductFamily } from "@/lib/gelato/catalog-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const check = await requireAdmin();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const result = await syncGelatoProductFamily({
      productId: typeof body?.productId === "string" ? body.productId.trim() : "",
      catalogUid: typeof body?.catalogUid === "string" ? body.catalogUid.trim() : "",
      referenceProductUid:
        typeof body?.referenceProductUid === "string" ? body.referenceProductUid.trim() : "",
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to sync Gelato family.",
      },
      { status: 500 },
    );
  }
}
