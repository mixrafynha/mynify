import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createGelatoColorSyncJob } from "@/lib/gelato/color-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const check = await requireAdmin();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const productId = typeof body?.productId === "string" ? body.productId.trim() : "";
    const catalogUid = typeof body?.catalogUid === "string" ? body.catalogUid.trim() : "";
    const referenceProductUid = typeof body?.referenceProductUid === "string" ? body.referenceProductUid.trim() : "";
    const dryRun = body?.dryRun !== false;
    if (!productId) return NextResponse.json({ ok: false, error: "Missing productId." }, { status: 400 });
    if (!catalogUid) return NextResponse.json({ ok: false, error: "Missing catalogUid." }, { status: 400 });
    if (!referenceProductUid) return NextResponse.json({ ok: false, error: "Missing referenceProductUid." }, { status: 400 });

    const result = await createGelatoColorSyncJob({ productId, catalogUid, referenceProductUid, dryRun });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to start color sync." }, { status: 500 });
  }
}
