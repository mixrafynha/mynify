import crypto from "crypto";
import { NextResponse } from "next/server";
import { getDurableRateLimiter, getTrustedRequestIp } from "@/lib/server/rate-limit";
import { JSON_HEADERS, MAX_BODY_BYTES, getBaseUrl, getProductionWebhookBaseUrl } from "./_lib/config";
import { getCreditBalance, refundGenerationCreditOnce, reserveGenerationAndCredit } from "./_lib/credits";
import { applyPredictionState } from "./_lib/finalize";
import { jsonError, safeErrorDetails, safePublicError } from "./_lib/http";
import { reconcileStaleGenerations, reconcileWithReplicate } from "./_lib/reconcile";
import {
  listPendingGenerations,
  loadGenerationById,
  loadGenerationByRowId,
  toResponseRow,
  updateGeneration,
} from "./_lib/repository";
import { createReplicatePrediction, normalizePredictionStatus } from "./_lib/replicate";
import { getAuthSupabase, getServiceSupabase } from "./_lib/supabase";
import { APP_PENDING_STATES } from "./_lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const aiImageRateLimiter = getDurableRateLimiter({
  namespace: "ai-image",
  limit: 5,
  window: "1 m",
});

async function requireUser() {
  const authSupabase = await getAuthSupabase();
  const { data: { user }, error } = await authSupabase.auth.getUser();
  return error || !user ? null : user;
}

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    if (!user) return jsonError(401, "Authentication required");

    const serviceSupabase = getServiceSupabase();
    const url = new URL(req.url);
    const generationId = String(url.searchParams.get("generationId") || "").trim();
    const reconcile = url.searchParams.get("reconcile") === "1";

    if (generationId) {
      let row = await loadGenerationById(serviceSupabase, generationId, user.id);
      if (!row) return jsonError(404, "Generation not found");

      // Compatibility with existing frontend. Reconciliation is DB-throttled so a
      // polling loop cannot hammer Replicate on every browser request.
      if (reconcile && row.prediction_id && APP_PENDING_STATES.includes((row.status || "") as any)) {
        await reconcileWithReplicate({ req, serviceSupabase, row, source: "poll" }).catch((error) => {
          console.error("[AI_GENERATION_RECONCILE_FAILED]", safeErrorDetails(error));
        });
        row = await loadGenerationById(serviceSupabase, generationId, user.id);
      }

      if (reconcile && row && !APP_PENDING_STATES.includes((row.status || "") as any) && row.prediction_id) {
        // Keep the endpoint tolerant for stale rows that drifted out of the local pending set.
        await reconcileWithReplicate({ req, serviceSupabase, row, source: "poll", force: true }).catch((error) => {
          console.error("[AI_GENERATION_RECONCILE_FAILED]", safeErrorDetails(error));
        });
        row = await loadGenerationById(serviceSupabase, generationId, user.id);
      }

      return NextResponse.json(
        { success: true, generation: toResponseRow(row) },
        { headers: JSON_HEADERS },
      );
    }

    if (reconcile) {
      console.info("[AI_RECONCILE_START]", { mode: "stale-sweep" });
      try {
        const results = await reconcileStaleGenerations({ req, serviceSupabase });
        console.info("[AI_RECONCILE_SUCCEEDED]", { count: results.length });
      } catch (error) {
        console.error("[AI_GENERATION_RECONCILE_FAILED]", safeErrorDetails(error));
      }
    }

    const rows = await listPendingGenerations(serviceSupabase, user.id);
    return NextResponse.json(
      { success: true, generations: rows.map(toResponseRow) },
      { headers: JSON_HEADERS },
    );
  } catch (error) {
    console.error("[AI_GENERATION_GET_FAILED]", safeErrorDetails(error));
    return jsonError(500, "Could not load AI generations", { details: safePublicError(error) });
  }
}

export async function POST(req: Request) {
  const serviceSupabase = getServiceSupabase();
  let generationId: string | null = null;
  let predictionId: string | null = null;
  let reserved = false;

  try {
    const user = await requireUser();
    if (!user) return jsonError(401, "Create a free account and get 3 AI credits.");

    try {
      const rateLimit = await aiImageRateLimiter.limit(`${user.id}:${getTrustedRequestIp(req)}`);
      if (!rateLimit.success) return jsonError(429, "Too many AI image requests");
    } catch (error) {
      console.error("[ai-image:rate-limit-error]", safeErrorDetails(error));
      return jsonError(503, "AI image service is temporarily unavailable");
    }

    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return jsonError(413, "Request body too large");
    }

    const rawBody = await req.text().catch(() => "");
    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) return jsonError(413, "Request body too large");

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody || "{}") as Record<string, unknown>;
    } catch {
      return jsonError(400, "Invalid request body");
    }

    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) return jsonError(400, "Prompt required");

    const idempotencyKey =
      String(body.idempotencyKey || body.idempotency_key || req.headers.get("idempotency-key") || "").trim() ||
      crypto.randomUUID();
    generationId = crypto.randomUUID();

    const reserve = await reserveGenerationAndCredit({
      serviceSupabase,
      userId: user.id,
      generationId,
      idempotencyKey,
      prompt,
      originalPrompt: String(body.originalPrompt || body.original_prompt || prompt).trim(),
      requestPayload: body,
    });

    if (!reserve.created) {
      if (!reserve.rowId) {
        return jsonError(402, "You have 0 AI credits left.", {
          credits: reserve.credits,
          balance: reserve.credits,
          aiCredits: reserve.credits,
          credit_balance: reserve.credits,
        });
      }
      const existing = await loadGenerationByRowId(serviceSupabase, reserve.rowId);
      console.info("[AI_GENERATION_RECONCILED]", {
        generationId: existing?.generation_id,
        predictionId: existing?.prediction_id,
        source: "idempotency",
      });
      return NextResponse.json(
        {
          success: true,
          generation: toResponseRow(existing),
          credits: reserve.credits,
          balance: reserve.credits,
          aiCredits: reserve.credits,
          credit_balance: reserve.credits,
        },
        { status: existing?.status === "completed" ? 200 : 202, headers: JSON_HEADERS },
      );
    }

    reserved = true;
    generationId = reserve.generationId || generationId;
    console.info("[AI_GENERATION_CREATED]", { generationId, idempotencyKey });
    console.info("[AI_CREDIT_RESERVED]", {
      userId: user.id,
      balance: reserve.credits,
      idempotencyKey,
      generationId,
    });

    const row = await loadGenerationByRowId(serviceSupabase, reserve.rowId!);
    if (!row) throw new Error("Generation row disappeared after reservation");

    const prediction = await createReplicatePrediction({
      prompt,
      replicateWebhookUrl: `${getProductionWebhookBaseUrl(req)}/api/ai-image/webhook?generationId=${encodeURIComponent(generationId)}`,
    });
    predictionId = String(prediction.id || "").trim();

    let updatedRow = await updateGeneration(serviceSupabase, row.id, {
      prediction_id: predictionId,
      status: "replicate_prediction_created",
      replicate_status: normalizePredictionStatus(prediction.status),
      replicate_prediction: prediction,
      error_message: null,
    });

    const remoteStatus = normalizePredictionStatus(prediction.status);
    if (["succeeded", "failed", "canceled"].includes(remoteStatus)) {
      try {
        await applyPredictionState({ req, serviceSupabase, row: updatedRow, prediction, source: "post" });
      } catch (error) {
        // Prediction exists and may already be billable/succeeded. Never refund here.
        console.error("[AI_GENERATION_FINALIZE_DEFERRED]", safeErrorDetails(error));
      }
      updatedRow = (await loadGenerationById(serviceSupabase, generationId, user.id)) || updatedRow;
    } else {
      const localStatus = remoteStatus === "queued" ? "queued" : remoteStatus === "starting" ? "starting" : "processing";
      updatedRow = await updateGeneration(serviceSupabase, row.id, {
        status: localStatus,
        replicate_status: remoteStatus,
      });
      console.info(remoteStatus === "starting" ? "[AI_GENERATION_STARTING]" : "[AI_GENERATION_PROCESSING]", {
        generationId,
        predictionId,
      });
    }

    return NextResponse.json(
      {
        success: true,
        generation: toResponseRow(updatedRow),
        credits: reserve.credits,
        balance: reserve.credits,
        aiCredits: reserve.credits,
        credit_balance: reserve.credits,
      },
      { status: updatedRow.status === "completed" ? 200 : 202, headers: JSON_HEADERS },
    );
  } catch (error) {
    console.error("[AI_GENERATION_FAILED]", safeErrorDetails(error));

    // Refund only when no Replicate prediction exists. Once Replicate accepted the
    // prediction, the webhook/reconciliation path owns the terminal outcome.
    if (reserved && generationId && !predictionId) {
      try {
        const refund = await refundGenerationCreditOnce(serviceSupabase, generationId);
        if (refund.refunded) {
          console.info("[AI_CREDIT_REFUNDED]", {
            generationId,
            predictionId: null,
            source: "post-create-failure",
          });
        }
        const row = await loadGenerationById(serviceSupabase, generationId);
        if (row) {
          await updateGeneration(serviceSupabase, row.id, {
            status: "failed",
            replicate_status: "not_created",
            failed_at: new Date().toISOString(),
            error_message: safePublicError(error),
          }).catch(() => undefined);
        }
      } catch (refundError) {
        console.error("[AI_CREDIT_REFUND_FAILED]", safeErrorDetails(refundError));
      }
    }

    // If Replicate already accepted the job, return an async acknowledgement rather
    // than telling the browser it failed. The webhook carries generationId and can
    // recover a missing prediction_id from the payload.
    if (generationId && predictionId) {
      const row = await loadGenerationById(serviceSupabase, generationId).catch(() => null);
      return NextResponse.json(
        {
          success: true,
          generation: toResponseRow(row),
          pending: true,
          warning: "Generation accepted and will continue asynchronously",
        },
        { status: 202, headers: JSON_HEADERS },
      );
    }

    return jsonError(500, "Internal AI image error", { details: safePublicError(error) });
  }
}
