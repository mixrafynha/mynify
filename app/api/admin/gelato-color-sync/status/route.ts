import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { readGelatoColorSyncJob } from "@/lib/gelato/color-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const check = await requireAdmin();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
    const url = new URL(request.url);
    const jobId = url.searchParams.get("jobId")?.trim() ?? "";
    if (!jobId) return NextResponse.json({ ok: false, error: "Missing jobId." }, { status: 400 });
    const job = await readGelatoColorSyncJob(jobId);
    return NextResponse.json({ ok: true, job });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to read color sync status." }, { status: 500 });
  }
}
