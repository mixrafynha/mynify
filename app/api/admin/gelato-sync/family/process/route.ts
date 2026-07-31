import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { syncGelatoProductFamily } from "@/lib/gelato/catalog-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BATCH_SIZE = 3;
const TEMPORARY_ERROR_CODES = [408, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524];

function isoNow() {
  return new Date().toISOString();
}

function isTemporaryUpstreamError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();

  return (
    TEMPORARY_ERROR_CODES.some((code) => normalized.includes(String(code))) ||
    normalized.includes("connection timed out") ||
    normalized.includes("timeout") ||
    normalized.includes("fetch failed") ||
    normalized.includes("network") ||
    normalized.includes("cloudflare")
  );
}

async function getJobCounts(supabase: ReturnType<typeof createSupabaseAdmin>, jobId: string) {
  const { data: items, error } = await supabase
    .from("gelato_sync_job_items")
    .select("status")
    .eq("job_id", jobId);

  if (error) throw new Error(error.message);

  const rows = items ?? [];
  const completedItems = rows.filter((item) => item.status === "completed").length;
  const failedItems = rows.filter((item) => item.status === "failed").length;
  const pendingItems = rows.filter((item) => item.status === "pending").length;
  const processingItems = rows.filter((item) => item.status === "processing").length;

  return {
    totalItems: rows.length,
    completedItems,
    failedItems,
    pendingItems,
    processingItems,
    finishedItems: completedItems + failedItems,
  };
}

async function refreshGelatoSyncJobCounters(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  jobId: string,
) {
  const counts = await getJobCounts(supabase, jobId);
  const { error } = await supabase
    .from("gelato_sync_jobs")
    .update({
      total_variants: counts.totalItems,
      processed_variants: counts.completedItems + counts.failedItems,
      successful_variants: counts.completedItems,
      failed_variants: counts.failedItems,
      updated_at: isoNow(),
    })
    .eq("id", jobId);
  if (error) throw new Error(error.message);
  return counts;
}

async function claimGelatoSyncJobItems(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  jobId: string,
  batchSize: number,
) {
  const fallbackResult = await supabase
    .from("gelato_sync_job_items")
    .select("id, gelato_product_uid, attempts, position")
    .eq("job_id", jobId)
    .eq("status", "pending")
    .order("position", { ascending: true })
    .limit(batchSize);

  if (fallbackResult.error) throw new Error(fallbackResult.error.message);

  const claimed = (fallbackResult.data ?? []) as Array<{
    id: string;
    gelato_product_uid: string;
    attempts: number;
    position: number;
  }>;

  if (claimed.length === 0) return [];

  const { error: claimUpdateError } = await supabase
    .from("gelato_sync_job_items")
    .update({ status: "processing", started_at: isoNow(), updated_at: isoNow() })
    .in("id", claimed.map((item) => item.id))
    .eq("status", "pending");
  if (claimUpdateError) throw new Error(claimUpdateError.message);

  return claimed;
}

async function releaseProcessingItems(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  itemIds: string[],
) {
  if (itemIds.length === 0) return;

  const { error } = await supabase
    .from("gelato_sync_job_items")
    .update({ status: "pending", updated_at: isoNow() })
    .in("id", itemIds)
    .eq("status", "processing");

  if (error) throw new Error(error.message);
}

function retryableProcessResponse(jobId: string) {
  return NextResponse.json(
    {
      ok: false,
      retryable: true,
      status: "processing",
      code: "TEMPORARY_UPSTREAM_ERROR",
      message: "Erro temporario de ligacao ao Supabase. A sincronizacao sera retomada.",
      jobId,
    },
    { status: 503 },
  );
}

async function finalizeJobIfReady(supabase: ReturnType<typeof createSupabaseAdmin>, jobId: string) {
  const counters = await refreshGelatoSyncJobCounters(supabase, jobId);
  const { data: job, error: jobError } = await supabase
    .from("gelato_sync_jobs")
    .select("id, total_variants, processed_variants, successful_variants, failed_variants")
    .eq("id", jobId)
    .maybeSingle();
  if (jobError) throw new Error(jobError.message);
  if (!job) throw new Error("Job not found.");

  if (job.total_variants > 0 && counters.totalItems === 0) {
    await supabase
      .from("gelato_sync_jobs")
      .update({
        status: "failed",
        current_error: "Job initialization incomplete: variants were discovered but no job items were created.",
      })
      .eq("id", jobId);
    return { completed: false, inconsistent: true };
  }

  const canComplete =
    Number(job.total_variants ?? 0) > 0 &&
    counters.totalItems === Number(job.total_variants ?? 0) &&
    counters.completedItems + counters.failedItems === Number(job.total_variants ?? 0) &&
    counters.pendingItems === 0 &&
    counters.processingItems === 0;

  if (!canComplete) {
    if (counters.totalItems !== Number(job.total_variants ?? 0)) {
      await supabase
        .from("gelato_sync_jobs")
        .update({
          status: "failed",
          current_error: `Job item count mismatch: expected ${job.total_variants}, found ${counters.totalItems}.`,
        })
        .eq("id", jobId);
      return { completed: false, inconsistent: true };
    }
    return { completed: false, inconsistent: false };
  }

  const finalStatus = counters.failedItems > 0 ? "completed_with_errors" : "completed";

  await supabase
    .from("gelato_sync_jobs")
    .update({
      status: finalStatus,
      completed_at: isoNow(),
      current_item_uid: null,
      current_error: null,
      processed_variants: counters.completedItems + counters.failedItems,
      successful_variants: counters.completedItems,
      failed_variants: counters.failedItems,
      last_processed_at: isoNow(),
    })
    .eq("id", jobId);

  return { completed: true, inconsistent: false, finalStatus };
}

export async function POST(request: Request) {
  const check = await requireAdmin();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  let supabase: ReturnType<typeof createSupabaseAdmin> | null = null;
  let jobId = "";
  let claimedItemIds: string[] = [];

  try {
    const body = await request.json().catch(() => ({}));
    jobId = typeof body?.jobId === "string" ? body.jobId.trim() : "";
    if (!jobId) return NextResponse.json({ ok: false, error: "Missing jobId." }, { status: 400 });

    supabase = createSupabaseAdmin();
    const { data: job, error: jobError } = await supabase
      .from("gelato_sync_jobs")
      .select("id, product_id, catalog_uid, reference_product_uid, family_key, status, processed_variants, successful_variants, failed_variants, total_variants")
      .eq("id", jobId)
      .maybeSingle();
    if (jobError) throw new Error(jobError.message);
    if (!job) return NextResponse.json({ ok: false, error: "Job not found." }, { status: 404 });

    const claimed = await claimGelatoSyncJobItems(supabase, jobId, BATCH_SIZE);
    claimedItemIds = claimed.map((item) => item.id);
    if (claimed.length === 0) {
      const finalizeResult = await finalizeJobIfReady(supabase, jobId);
      return NextResponse.json({
        ok: !finalizeResult.inconsistent,
        jobId,
        processed: 0,
        successful: 0,
        failed: 0,
        completed: finalizeResult.completed,
        inconsistent: finalizeResult.inconsistent,
      }, finalizeResult.inconsistent ? { status: 500 } : undefined);
    }

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
        await syncGelatoProductFamily({
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
          .eq("id", item.id)
          .eq("status", "processing");

        await refreshGelatoSyncJobCounters(supabase, jobId);
      } catch (error) {
        if (isTemporaryUpstreamError(error)) {
          await releaseProcessingItems(supabase, claimedItemIds);
          await supabase
            .from("gelato_sync_jobs")
            .update({
              status: "processing",
              current_error: "Erro temporario de ligacao ao Supabase. A sincronizacao sera retomada.",
              last_processed_at: isoNow(),
            })
            .eq("id", jobId);
          await refreshGelatoSyncJobCounters(supabase, jobId);
          return retryableProcessResponse(jobId);
        }

        failed += 1;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const finalFailure = item.attempts + 1 >= 3;
        await supabase
          .from("gelato_sync_job_items")
          .update({
            status: finalFailure ? "failed" : "pending",
            error: errorMessage,
            attempts: item.attempts + 1,
            completed_at: finalFailure ? isoNow() : null,
          })
          .eq("id", item.id)
          .eq("status", "processing");

        await supabase
          .from("gelato_sync_jobs")
          .update({
            current_item_uid: item.gelato_product_uid,
            current_error: errorMessage,
            last_processed_at: isoNow(),
          })
          .eq("id", jobId);

        await refreshGelatoSyncJobCounters(supabase, jobId);
      }
    }

    const finalizeResult = await finalizeJobIfReady(supabase, jobId);

    return NextResponse.json({
      ok: true,
      jobId,
      processed,
      successful,
      failed,
      completed: finalizeResult.completed,
      inconsistent: finalizeResult.inconsistent,
      finalStatus: (finalizeResult as { finalStatus?: string }).finalStatus ?? null,
    });
  } catch (error) {
    if (jobId && supabase && isTemporaryUpstreamError(error)) {
      try {
        await releaseProcessingItems(supabase, claimedItemIds);
        await supabase
          .from("gelato_sync_jobs")
          .update({
            status: "processing",
            current_error: "Erro temporario de ligacao ao Supabase. A sincronizacao sera retomada.",
            last_processed_at: isoNow(),
          })
          .eq("id", jobId);
        await refreshGelatoSyncJobCounters(supabase, jobId);
      } catch {}

      return retryableProcessResponse(jobId);
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to process Gelato family batch." },
      { status: 500 },
    );
  }
}
