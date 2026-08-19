import { uploadR2Object } from "../../../../trigger/shared/r2";
import {
  FINALIZATION_LEASE_SECONDS,
  FINALIZATION_MAX_ATTEMPTS,
  getBaseUrl,
  getFinalizationRetryDelayMs,
} from "./config";
import { refundGenerationCreditOnce } from "./credits";
import {
  claimFinalization,
  releaseFinalization,
  scheduleFinalizationRetry,
  updateGeneration,
} from "./repository";
import { extractOutputUrl, normalizePredictionStatus } from "./replicate";
import type { GenerationRow, ReplicatePrediction, ServiceSupabase } from "./types";

async function removeBackground(req: Request, imageUrl: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const internalSecret = process.env.AI_INTERNAL_SECRET;
  if (!internalSecret) throw new Error("Missing AI_INTERNAL_SECRET");
  headers["x-ai-internal-secret"] = internalSecret;

  const response = await fetch(`${getBaseUrl(req)}/api/remove-background`, {
    method: "POST",
    headers,
    body: JSON.stringify({ imageUrl }),
    cache: "no-store",
  });
  if (!response.ok) {
    const responseBodySafe = (await response.text().catch(() => "")).slice(0, 500);
    throw new Error(`Background removal failed with ${response.status}: ${responseBodySafe}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) throw new Error("Background removal returned an empty image");
  return buffer;
}

function isAuthOrConfigError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  return /401|403|AI_INTERNAL_SECRET/i.test(message);
}

function computeNextFinalizationAttempt(row: GenerationRow) {
  const attempts = Math.min((row.finalization_attempts || 0) + 1, FINALIZATION_MAX_ATTEMPTS);
  const delayMs = getFinalizationRetryDelayMs(attempts);
  return {
    attempts,
    nextRetryAt: new Date(Date.now() + delayMs).toISOString(),
  };
}

export async function finalizePrediction(args: {
  req: Request;
  serviceSupabase: ServiceSupabase;
  row: GenerationRow;
  prediction: ReplicatePrediction;
  source: "post" | "webhook" | "poll";
}) {
  const { req, serviceSupabase, prediction, source } = args;
  let row = args.row;
  // The fresh Replicate response MUST win over the persisted local snapshot.
  // Using row.replicate_status first can pin a generation forever in "starting"
  // even when Replicate has already returned "succeeded".
  const status = normalizePredictionStatus(prediction.status || row.replicate_status);

  if (status === "succeeded") {
    // Prefer the fresh remote output, but allow recovery from a previously
    // persisted succeeded output without creating another prediction.
    const persistedPrediction: ReplicatePrediction = { output: row.replicate_output };
    const outputUrl = extractOutputUrl(prediction) || extractOutputUrl(persistedPrediction);
    if (!outputUrl) throw new Error("Replicate succeeded without an image output");

    // Persist remote success before expensive post-processing. If this process dies,
    // webhook/poll reconciliation can safely retry finalization later.
    row = await updateGeneration(serviceSupabase, row.id, {
      replicate_status: "succeeded",
      status: row.status === "completed" ? "completed" : "finalizing",
      replicate_output: prediction.output ?? row.replicate_output ?? null,
      error_message: null,
    });

    if (row.status === "completed" && row.image_url) {
      return { status: "completed", imageUrl: row.image_url };
    }

    const currentAttempts = row.finalization_attempts || 0;
    if (currentAttempts >= FINALIZATION_MAX_ATTEMPTS) {
      console.warn("[AI_GENERATION_FINALIZATION_BACKOFF]", {
        generationId: row.generation_id,
        predictionId: row.prediction_id,
        attempts: currentAttempts,
        source,
      });
    }

    const claimed = await claimFinalization(serviceSupabase, row, FINALIZATION_LEASE_SECONDS);
    if (!claimed) return { status: "finalizing" };
    row = claimed;

    try {
      const pngBuffer = await removeBackground(req, outputUrl);
      const objectKey = row.storage_key || [
        "ai-images",
        row.user_id,
        `${row.generation_id || row.id}.png`,
      ].join("/");
      const publicImageUrl = await uploadR2Object({
        key: objectKey,
        body: pngBuffer,
        contentType: "image/png",
        cacheControl: "public, max-age=31536000, immutable",
      });
      const completedAt = new Date().toISOString();
      await updateGeneration(serviceSupabase, row.id, {
        status: "completed",
        replicate_status: "succeeded",
        output_url: publicImageUrl,
        image_url: publicImageUrl,
        storage_key: objectKey,
        completed_at: completedAt,
        webhook_processed_at: source === "webhook" ? completedAt : row.webhook_processed_at ?? null,
        finalization_lock_until: null,
        error_message: null,
        is_saved: false,
        replicate_output: prediction.output ?? row.replicate_output ?? null,
      });
      console.info("[AI_GENERATION_FINALIZED]", {
        generationId: row.generation_id,
        predictionId: row.prediction_id,
        source,
        status: "succeeded",
      });
      return { status: "completed", imageUrl: publicImageUrl };
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI finalization failed";
      console.error("[AI_REMOVE_BG_FAILED]", {
        generationId: row.generation_id,
        predictionId: row.prediction_id,
        status: row.status,
        responseBodySafe: message.slice(0, 500),
      });
      if (isAuthOrConfigError(error)) {
        const nextRetry = computeNextFinalizationAttempt(row);
        await scheduleFinalizationRetry(serviceSupabase, row.id, nextRetry.nextRetryAt, message).catch(() => undefined);
        console.info("[AI_GENERATION_FINALIZATION_BACKOFF]", {
          generationId: row.generation_id,
          predictionId: row.prediction_id,
          attempts: nextRetry.attempts,
          nextRetryAt: nextRetry.nextRetryAt,
          source,
        });
      } else {
        await releaseFinalization(serviceSupabase, row.id, message).catch(() => undefined);
      }
      throw error;
    }
  }

  if (status === "failed") {
    const refund = await refundGenerationCreditOnce(serviceSupabase, row.id);
    if (refund.refunded) {
      console.info("[AI_CREDIT_REFUNDED]", {
        generationId: row.generation_id,
        predictionId: row.prediction_id,
        source,
      });
    }
    const failedAt = new Date().toISOString();
    await updateGeneration(serviceSupabase, row.id, {
      status: "failed",
      replicate_status: "failed",
      failed_at: failedAt,
      error_message: String(prediction.error || prediction.detail || "AI generation failed"),
      replicate_output: prediction.output ?? row.replicate_output ?? null,
      finalization_lock_until: null,
    });
      console.info("[AI_GENERATION_FINALIZED]", {
        generationId: row.generation_id,
        predictionId: row.prediction_id,
        source,
        status: "failed",
      });
      return { status: "failed" };
  }

  if (status === "canceled") {
    const canceledAt = new Date().toISOString();
    await updateGeneration(serviceSupabase, row.id, {
      status: "canceled",
      replicate_status: "canceled",
      canceled_at: canceledAt,
      error_message: String(prediction.error || "AI generation canceled"),
      replicate_output: prediction.output ?? row.replicate_output ?? null,
      finalization_lock_until: null,
    });
    console.info("[AI_GENERATION_FINALIZED]", {
      generationId: row.generation_id,
      predictionId: row.prediction_id,
      status,
      source,
    });
    return { status: "canceled" };
  }

  // Unknown remote values stay non-terminal instead of poisoning the local state.
  const localStatus = status === "queued" ? "queued" : status === "starting" ? "starting" : "processing";
  await updateGeneration(serviceSupabase, row.id, {
    status: localStatus,
    replicate_status: status,
    replicate_output: prediction.output ?? row.replicate_output ?? null,
  });
  console.info(status === "starting" ? "[AI_GENERATION_STARTING]" : "[AI_GENERATION_PROCESSING]", {
    generationId: row.generation_id,
    predictionId: row.prediction_id,
    source,
    replicateStatus: status,
  });
  return { status: localStatus };
}

export const applyPredictionState = finalizePrediction;
