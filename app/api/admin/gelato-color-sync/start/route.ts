import { NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
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
    const dryRun = typeof body?.dryRun === "boolean" ? body.dryRun : null;
    if (!productId) return NextResponse.json({ ok: false, error: "Missing productId." }, { status: 400 });
    if (!catalogUid) return NextResponse.json({ ok: false, error: "Missing catalogUid." }, { status: 400 });
    if (!referenceProductUid) return NextResponse.json({ ok: false, error: "Missing referenceProductUid." }, { status: 400 });
    if (dryRun === null) return NextResponse.json({ ok: false, error: "Missing dryRun." }, { status: 400 });

    const result = await createGelatoColorSyncJob({ productId, catalogUid, referenceProductUid, dryRun });
    if (!result.jobId) {
      return NextResponse.json({ ok: false, error: "Failed to create color sync job." }, { status: 500 });
    }

    const triggerPayload = {
      productId,
      jobId: result.jobId,
      dryRun,
    };

    await tasks.trigger("gelato-color-sync", triggerPayload);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to start color sync." }, { status: 500 });
  }
}
