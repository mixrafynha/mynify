import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const check = await requireAdmin();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId")?.trim() ?? "";
    if (!jobId) return NextResponse.json({ ok: false, error: "Missing jobId." }, { status: 400 });

    const supabase = createSupabaseAdmin();
    const { data: job, error: jobError } = await supabase
      .from("gelato_sync_jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();
    if (jobError) throw new Error(jobError.message);
    if (!job) return NextResponse.json({ ok: false, error: "Job not found." }, { status: 404 });

    const { data: items, error: itemsError } = await supabase
      .from("gelato_sync_job_items")
      .select("id, gelato_product_uid, color, size, position, status, attempts, error, started_at, completed_at")
      .eq("job_id", jobId)
      .order("position", { ascending: true });
    if (itemsError) throw new Error(itemsError.message);

    const total = (items ?? []).length || Number(job.total_variants ?? 0);
    const completed = (items ?? []).filter((item) => item.status === "completed").length;
    const failed = (items ?? []).filter((item) => item.status === "failed").length;
    const pending = (items ?? []).filter((item) => item.status === "pending").length;
    const processing = (items ?? []).filter((item) => item.status === "processing").length;

    return NextResponse.json({
      ok: true,
      job: {
        ...job,
        total_variants: total,
        completed_variants: completed,
        failed_items: failed,
        pending_items: pending,
        processing_items: processing,
      },
      items: items ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to read Gelato family sync status." },
      { status: 500 },
    );
  }
}
