import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { syncGelatoProductFamily } from "@/lib/gelato/catalog-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BATCH_SIZE = 3;

function isoNow() {
  return new Date().toISOString();
}

export async function POST(request: Request) {
  const check = await requireAdmin();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const jobId = typeof body?.jobId === "string" ? body.jobId.trim() : "";
    if (!jobId) return NextResponse.json({ ok: false, error: "Missing jobId." }, { status: 400 });

    const supabase = createSupabaseAdmin();
    const { data: job, error: jobError } = await supabase
      .from("gelato_sync_jobs")
      .select("id, product_id, catalog_uid, reference_product_uid, family_key, status, processed_variants, successful_variants, failed_variants, total_variants")
      .eq("id", jobId)
      .maybeSingle();
    if (jobError) throw new Error(jobError.message);
    if (!job) return NextResponse.json({ ok: false, error: "Job not found." }, { status: 404 });

    const { data: items, error: itemsError } = await supabase
      .from("gelato_sync_job_items")
      .select("id, gelato_product_uid, status, attempts, position")
      .eq("job_id", jobId)
      .eq("status", "pending")
      .order("position", { ascending: true })
      .limit(BATCH_SIZE);
    if (itemsError) throw new Error(itemsError.message);

    const claimed = items ?? [];
    if (claimed.length === 0) {
      const { data: remainingItems, error: remainingError } = await supabase
        .from("gelato_sync_job_items")
        .select("id")
        .eq("job_id", jobId)
        .in("status", ["pending", "processing"]);
      if (remainingError) throw new Error(remainingError.message);

      const completed = (remainingItems ?? []).length === 0;
      if (completed) {
        await supabase
          .from("gelato_sync_jobs")
          .update({
            status: "completed",
            completed_at: isoNow(),
            current_item_uid: null,
            current_error: null,
            last_processed_at: isoNow(),
          })
          .eq("id", jobId);
      }

      return NextResponse.json({
        ok: true,
        jobId,
        processed: 0,
        successful: 0,
        failed: 0,
        completed,
      });
    }

    await supabase
      .from("gelato_sync_job_items")
      .update({ status: "processing", started_at: isoNow() })
      .in("id", claimed.map((item) => item.id));

    const processingPayload: Record<string, unknown> = {
      status: "processing",
      current_item_uid: claimed[0]?.gelato_product_uid ?? null,
      current_error: null,
      last_processed_at: isoNow(),
    };
    if (job.status === "pending") {
      processingPayload.started_at = isoNow();
    }
    await supabase.from("gelato_sync_jobs").update(processingPayload).eq("id", jobId);

    let successful = 0;
    let failed = 0;
    let processed = 0;

    for (const item of claimed) {
      processed += 1;
      try {
        const result = await syncGelatoProductFamily({
          productId: String(job.product_id),
          catalogUid: String(job.catalog_uid),
          referenceProductUid: String(job.reference_product_uid),
          productUids: [item.gelato_product_uid],
          preserveFamilyState: true,
        });

        successful += 1;
        await supabase
          .from("gelato_sync_job_items")
          .update({
            status: "completed",
            completed_at: isoNow(),
            error: null,
            attempts: item.attempts + 1,
          })
          .eq("id", item.id);

        await supabase
          .from("gelato_sync_jobs")
          .update({
            processed_variants: job.processed_variants + processed,
            successful_variants: job.successful_variants + successful,
            failed_variants: job.failed_variants + failed,
            current_item_uid: item.gelato_product_uid,
            current_error: null,
            last_processed_at: isoNow(),
            total_variants: Math.max(job.total_variants, result.variantsCreated + result.variantsUpdated),
          })
          .eq("id", jobId);
      } catch (error) {
        failed += 1;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await supabase
          .from("gelato_sync_job_items")
          .update({
            status: item.attempts + 1 >= 3 ? "failed" : "pending",
            error: errorMessage,
            attempts: item.attempts + 1,
            completed_at: item.attempts + 1 >= 3 ? isoNow() : null,
          })
          .eq("id", item.id);

        await supabase
          .from("gelato_sync_jobs")
          .update({
            processed_variants: job.processed_variants + processed,
            successful_variants: job.successful_variants + successful,
            failed_variants: job.failed_variants + failed,
            current_item_uid: item.gelato_product_uid,
            current_error: errorMessage,
            last_processed_at: isoNow(),
          })
          .eq("id", jobId);
      }
    }

    const { data: remaining, error: remainingError } = await supabase
      .from("gelato_sync_job_items")
      .select("id")
      .eq("job_id", jobId)
      .eq("status", "pending");
    if (remainingError) throw new Error(remainingError.message);

    const completed = (remaining ?? []).length === 0;
    if (completed) {
      await supabase
        .from("gelato_sync_jobs")
        .update({
          status: "completed",
          completed_at: isoNow(),
          current_item_uid: null,
          current_error: null,
          last_processed_at: isoNow(),
        })
        .eq("id", jobId);
    }

    return NextResponse.json({
      ok: true,
      jobId,
      processed,
      successful,
      failed,
      completed,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to process Gelato family batch." },
      { status: 500 },
    );
  }
}
