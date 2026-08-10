import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import {
  createFamilySyncPerfContext,
  prepareGelatoFamilySyncContext,
  logFamilySyncPerf,
  refreshProductVariantSellingPrices,
  syncSingleGelatoFamilyVariant,
  type FamilySyncPerfContext,
} from "@/lib/gelato/catalog-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BATCH_SIZE = 3;
const TEMPORARY_ERROR_CODES = [408, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524];

type ClaimedGelatoSyncJobItem = {
  id: string;
  gelato_product_uid: string;
  attempts: number;
  position: number;
};

type SupabaseErrorLogContext = {
  jobId: string | null;
  operation: string;
  table: string | null;
  code: string | number | null | undefined;
  message: string | null | undefined;
  details: unknown;
  hint: unknown;
  status: number | null | undefined;
  elapsedMs: number | null | undefined;
};

type SupabaseAnnotatedError = Error & {
  supabaseErrorContext?: SupabaseErrorLogContext;
};

function logSupabaseError(context: SupabaseErrorLogContext) {
  console.error("[gelato-family-sync:supabase-error]", context);
}

function annotateSupabaseError(error: unknown, context: SupabaseErrorLogContext): SupabaseAnnotatedError {
  const original = error instanceof Error ? error : new Error(String(error ?? "Unknown Supabase error."));
  logSupabaseError(context);
  const annotated = original as SupabaseAnnotatedError;
  annotated.supabaseErrorContext = context;
  return annotated;
}

function getSupabaseErrorStatus(error: unknown): number | null | undefined {
  return (error as { status?: number | null } | null | undefined)?.status ?? null;
}

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

async function getJobCounts(supabase: ReturnType<typeof createSupabaseAdmin>, jobId: string, perf?: FamilySyncPerfContext | null) {
  const startedAt = Date.now();
  const { data: items, error } = await supabase
    .from("gelato_sync_job_items")
    .select("status")
    .eq("job_id", jobId);

  if (error) {
    throw annotateSupabaseError(error, {
      jobId,
      operation: "select",
      table: "gelato_sync_job_items",
      code: error.code ?? null,
      message: error.message ?? null,
      details: error.details ?? null,
      hint: error.hint ?? null,
      status: getSupabaseErrorStatus(error),
      elapsedMs: Date.now() - startedAt,
    });
  }
  if (perf) {
    perf.metrics.supabaseReads += 1;
    perf.metrics.countersMs += Date.now() - startedAt;
  }

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
  perf?: FamilySyncPerfContext | null,
) {
  const counts = await getJobCounts(supabase, jobId, perf);
  const startedAt = Date.now();
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
  if (error) {
    throw annotateSupabaseError(error, {
      jobId,
      operation: "update",
      table: "gelato_sync_jobs",
      code: error.code ?? null,
      message: error.message ?? null,
      details: error.details ?? null,
      hint: error.hint ?? null,
      status: getSupabaseErrorStatus(error),
      elapsedMs: Date.now() - startedAt,
    });
  }
  if (perf) {
    perf.metrics.supabaseWrites += 1;
    perf.metrics.countersMs += Date.now() - startedAt;
  }
  return counts;
}

async function claimGelatoSyncJobItems(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  jobId: string,
  batchSize: number,
  perf?: FamilySyncPerfContext | null,
) {
  const startedAt = Date.now();
  const { data, error } = await supabase.rpc("claim_gelato_sync_job_items", {
    batch_size: batchSize,
    target_job_id: jobId,
  });

  if (error) {
    console.error("[gelato-family-sync:claim-rpc-failed]", {
      jobId,
      batchSize,
      code: error.code ?? null,
      message: error.message,
      details: error.details ?? null,
      hint: error.hint ?? null,
    });
    throw annotateSupabaseError(error, {
      jobId,
      operation: "rpc",
      table: "claim_gelato_sync_job_items",
      code: error.code ?? null,
      message: error.message ?? null,
      details: error.details ?? null,
      hint: error.hint ?? null,
      status: getSupabaseErrorStatus(error),
      elapsedMs: Date.now() - startedAt,
    });
  }
  if (perf) perf.metrics.supabaseWrites += 1;
  if (perf) perf.metrics.claimMs += Date.now() - startedAt;

  const claimedItems = (data ?? []) as Array<{
    id: unknown;
    gelato_product_uid: unknown;
    attempts: unknown;
    position: unknown;
  }>;

  return claimedItems.map((item) => ({
    id: String(item.id),
    gelato_product_uid: String(item.gelato_product_uid),
    attempts: Number(item.attempts ?? 0),
    position: Number(item.position ?? 0),
  })) satisfies ClaimedGelatoSyncJobItem[];
}

async function releaseProcessingItems(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  itemIds: string[],
  perf?: FamilySyncPerfContext | null,
) {
  if (itemIds.length === 0) return;

  const { error } = await supabase
    .from("gelato_sync_job_items")
    .update({ status: "pending", updated_at: isoNow() })
    .in("id", itemIds)
    .eq("status", "processing");

  if (error) {
    throw annotateSupabaseError(error, {
      jobId: null,
      operation: "update",
      table: "gelato_sync_job_items",
      code: error.code ?? null,
      message: error.message ?? null,
      details: error.details ?? null,
      hint: error.hint ?? null,
      status: getSupabaseErrorStatus(error),
      elapsedMs: 0,
    });
  }
  if (perf) perf.metrics.supabaseWrites += 1;
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

async function finalizeJobIfReady(supabase: ReturnType<typeof createSupabaseAdmin>, jobId: string, perf?: FamilySyncPerfContext | null) {
  const counters = await refreshGelatoSyncJobCounters(supabase, jobId, perf);
  const { data: job, error: jobError } = await supabase
    .from("gelato_sync_jobs")
    .select("id, total_variants, processed_variants, successful_variants, failed_variants")
    .eq("id", jobId)
    .maybeSingle();
  if (jobError) {
    throw annotateSupabaseError(jobError, {
      jobId,
      operation: "select",
      table: "gelato_sync_jobs",
      code: jobError.code ?? null,
      message: jobError.message ?? null,
      details: jobError.details ?? null,
      hint: jobError.hint ?? null,
      status: getSupabaseErrorStatus(jobError),
      elapsedMs: 0,
    });
  }
  if (!job) throw new Error("Job not found.");
  if (perf) perf.metrics.supabaseReads += 1;

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
  if (perf) perf.metrics.supabaseWrites += 1;

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
  const perf = createFamilySyncPerfContext();
  const totalStartedAt = Date.now();

  try {
    const body = await request.json().catch(() => ({}));
    jobId = typeof body?.jobId === "string" ? body.jobId.trim() : "";
    if (!jobId) return NextResponse.json({ ok: false, error: "Missing jobId." }, { status: 400 });

    supabase = createSupabaseAdmin();
    const jobSelectStartedAt = Date.now();
    const { data: job, error: jobError } = await supabase
      .from("gelato_sync_jobs")
      .select("id, product_id, catalog_uid, reference_product_uid, family_key, status, processed_variants, successful_variants, failed_variants, total_variants")
      .eq("id", jobId)
      .maybeSingle();
    if (jobError) {
      throw annotateSupabaseError(jobError, {
        jobId,
        operation: "select",
        table: "gelato_sync_jobs",
        code: jobError.code ?? null,
        message: jobError.message ?? null,
        details: jobError.details ?? null,
        hint: jobError.hint ?? null,
        status: getSupabaseErrorStatus(jobError),
        elapsedMs: Date.now() - jobSelectStartedAt,
      });
    }
    if (!job) return NextResponse.json({ ok: false, error: "Job not found." }, { status: 404 });
    perf.metrics.supabaseReads += 1;
    perf.metrics.detailsMs += Date.now() - jobSelectStartedAt;

    perf.metrics.batchSize = BATCH_SIZE;
    perf.metrics.jobId = jobId;
    const claimed = await claimGelatoSyncJobItems(supabase, jobId, BATCH_SIZE, perf);
    claimedItemIds = claimed.map((item) => item.id);
    if (claimed.length === 0) {
      const finalizeResult = await finalizeJobIfReady(supabase, jobId, perf);
      perf.metrics.totalMs += Date.now() - totalStartedAt;
      logFamilySyncPerf(perf);
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
    const processingUpdateStartedAt = Date.now();
    if (job.status === "pending") {
      processingPayload.started_at = isoNow();
    }
    await supabase.from("gelato_sync_jobs").update(processingPayload).eq("id", jobId);
    perf.metrics.supabaseWrites += 1;
    perf.metrics.countersMs += Date.now() - processingUpdateStartedAt;

    const familyContext = await prepareGelatoFamilySyncContext({
      productId: String(job.product_id),
      catalogUid: String(job.catalog_uid),
      referenceProductUid: String(job.reference_product_uid),
      perf,
    });

    let successful = 0;
    let failed = 0;
    let processed = 0;

    for (const item of claimed) {
      processed += 1;
      try {
        await syncSingleGelatoFamilyVariant({
          context: familyContext,
          gelatoProductUid: item.gelato_product_uid,
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
        perf.metrics.supabaseWrites += 1;
      } catch (error) {
        if (isTemporaryUpstreamError(error)) {
          const originalContext = error instanceof Error ? (error as SupabaseAnnotatedError).supabaseErrorContext ?? null : null;
          if (originalContext) {
            console.error("[gelato-family-sync:temporary-error]", {
              jobId,
              originalCode: originalContext.code ?? null,
              originalMessage: originalContext.message ?? null,
              operation: originalContext.operation,
              table: originalContext.table,
            });
          }
          await releaseProcessingItems(supabase, claimedItemIds, perf);
          await supabase
            .from("gelato_sync_jobs")
            .update({
              status: "processing",
              current_error: "Erro temporario de ligacao ao Supabase. A sincronizacao sera retomada.",
              last_processed_at: isoNow(),
            })
            .eq("id", jobId);
          perf.metrics.supabaseWrites += 1;
          await refreshGelatoSyncJobCounters(supabase, jobId, perf);
          perf.metrics.totalMs += Date.now() - totalStartedAt;
          logFamilySyncPerf(perf);
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
        perf.metrics.supabaseWrites += 1;

        await supabase
          .from("gelato_sync_jobs")
          .update({
            current_item_uid: item.gelato_product_uid,
            current_error: errorMessage,
            last_processed_at: isoNow(),
          })
          .eq("id", jobId);
        perf.metrics.supabaseWrites += 1;
      }
    }

    await refreshProductVariantSellingPrices(String(job.product_id), perf);
    const finalizeResult = await finalizeJobIfReady(supabase, jobId, perf);
    perf.metrics.totalMs += Date.now() - totalStartedAt;
    logFamilySyncPerf(perf);

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
      const originalContext = error instanceof Error ? (error as SupabaseAnnotatedError).supabaseErrorContext ?? null : null;
      if (originalContext) {
        console.error("[gelato-family-sync:temporary-error]", {
          jobId,
          originalCode: originalContext.code ?? null,
          originalMessage: originalContext.message ?? null,
          operation: originalContext.operation,
          table: originalContext.table,
        });
      }
      try {
        await releaseProcessingItems(supabase, claimedItemIds, perf);
        await supabase
          .from("gelato_sync_jobs")
          .update({
            status: "processing",
            current_error: "Erro temporario de ligacao ao Supabase. A sincronizacao sera retomada.",
            last_processed_at: isoNow(),
          })
          .eq("id", jobId);
        perf.metrics.supabaseWrites += 1;
        await refreshGelatoSyncJobCounters(supabase, jobId, perf);
      } catch {}

      perf.metrics.totalMs += Date.now() - totalStartedAt;
      logFamilySyncPerf(perf);
      return retryableProcessResponse(jobId);
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to process Gelato family batch." },
      { status: 500 },
    );
  }
}
