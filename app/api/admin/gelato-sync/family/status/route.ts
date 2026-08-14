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
      .select("id, product_id, catalog_uid, reference_product_uid, family_key, status, total_variants, processed_variants, successful_variants, failed_variants, current_item_uid, current_error, started_at, last_processed_at, completed_at, created_at, updated_at")
      .eq("id", jobId)
      .maybeSingle();
    if (jobError) throw new Error(jobError.message);
    if (!job) return NextResponse.json({ ok: false, error: "Job not found." }, { status: 404 });

    const total = Number(job.total_variants ?? 0);
    const processed = Number(job.processed_variants ?? 0);
    const successful = Number(job.successful_variants ?? 0);
    const failed = Number(job.failed_variants ?? 0);
    const pending = Math.max(total - processed, 0);
    const processing = job.status === "processing" && pending > 0 ? 1 : 0;
    const canComplete =
      total > 0 &&
      processed === total &&
      pending === 0 &&
      processing === 0 &&
      (job.status === "completed" || job.status === "completed_with_errors");
    const inconsistent = Number(job.total_variants ?? 0) > 0 && processed === 0 && job.status === "failed";

    return NextResponse.json({
      ok: true,
      job: {
        ...job,
        total_variants: total,
        processed_variants: processed,
        successful_variants: successful,
        failed_variants: failed,
        completed_variants: successful,
        failed_items: failed,
        pending_items: pending,
        processing_items: processing,
        can_complete: canComplete,
        inconsistent,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to read Gelato family sync status." },
      { status: 500 },
    );
  }
}
