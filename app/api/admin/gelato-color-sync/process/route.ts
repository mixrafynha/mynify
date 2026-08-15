import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { processGelatoColorSyncJob } from "@/lib/gelato/color-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const check = await requireAdmin();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const jobId = typeof body?.jobId === "string" ? body.jobId.trim() : "";
    if (!jobId) return NextResponse.json({ ok: false, error: "Missing jobId." }, { status: 400 });
    const result = await processGelatoColorSyncJob(jobId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to process color sync." }, { status: 500 });
  }
}
