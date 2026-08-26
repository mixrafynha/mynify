import { uploadR2Object } from "../../../../trigger/shared/r2";
import { getBaseUrl } from "./config";
import { refundGenerationCreditOnce } from "./credits";
import { updateGeneration } from "./repository";
import { createReplicatePredictionForModel, extractOutputUrl, normalizePredictionStatus } from "./replicate";
import type { GenerationRow, ReplicatePrediction, ServiceSupabase } from "./types";

async function fetchImageBuffer(imageUrl: string) {
  const response = await fetch(imageUrl, { cache: "no-store" });
  if (!response.ok) {
    const responseBodySafe = (await response.text().catch(() => "")).slice(0, 500);
    throw new Error(`Image download failed with ${response.status}: ${responseBodySafe}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) throw new Error("Downloaded image was empty");
  return buffer;
}

async function uploadR2Image(args: { key: string; body: Buffer; contentType: string }) {
  return uploadR2Object({
    key: args.key,
    body: args.body,
    contentType: args.contentType,
    cacheControl: "public, max-age=31536000, immutable",
  });
}

async function storeOriginalImage(args: {
  serviceSupabase: ServiceSupabase;
  row: GenerationRow;
  outputUrl: string;
}) {
  const originalBuffer = await fetchImageBuffer(args.outputUrl);
  const originalKey = args.row.original_storage_key || [
    "ai-images",
    args.row.user_id,
    "original",
    `${args.row.generation_id || args.row.id}.png`,
  ].join("/");

  const originalImageUrl = await uploadR2Image({
    key: originalKey,
    body: originalBuffer,
    contentType: "image/png",
  });

  const completedAt = new Date().toISOString();
  const updated = await updateGeneration(args.serviceSupabase, args.row.id, {
    status: "completed",
    replicate_status: "succeeded",
    output_url: originalImageUrl,
    image_url: originalImageUrl,
    original_image_url: originalImageUrl,
    storage_key: originalKey,
    original_storage_key: originalKey,
    completed_at: completedAt,
    webhook_processed_at: completedAt,
    finalization_lock_until: null,
    error_message: null,
    is_saved: false,
    replicate_output: args.row.replicate_output ?? null,
  });

  return updated;
}

async function uploadTransparentImage(args: {
  serviceSupabase: ServiceSupabase;
  row: GenerationRow;
  transparentOutputUrl: string;
  prediction: ReplicatePrediction;
}) {
  const transparentBuffer = await fetchImageBuffer(args.transparentOutputUrl);
  const transparentKey = args.row.original_storage_key
    ? args.row.original_storage_key.replace(/\/original\/([^/]+)$/, "/transparent/$1")
    : [
        "ai-images",
        args.row.user_id,
        "transparent",
        `${args.row.generation_id || args.row.id}.png`,
      ].join("/");

  const transparentImageUrl = await uploadR2Image({
    key: transparentKey,
    body: transparentBuffer,
    contentType: "image/png",
  });

  const completedAt = new Date().toISOString();
  await updateGeneration(args.serviceSupabase, args.row.id, {
    status: "completed",
    replicate_status: "succeeded",
    image_url: transparentImageUrl,
    output_url: transparentImageUrl,
    storage_key: transparentKey,
    background_removal_status: "succeeded",
    background_removal_error: null,
    completed_at: completedAt,
    finalization_lock_until: null,
    replicate_output: args.prediction.output ?? args.row.replicate_output ?? null,
  });

  return transparentImageUrl;
}

export async function processBackgroundRemovalPrediction(args: {
  serviceSupabase: ServiceSupabase;
  row: GenerationRow;
  prediction: ReplicatePrediction;
  source: "poll" | "webhook" | "post";
}) {
  const remoteStatus = normalizePredictionStatus(args.prediction.status || args.row.background_removal_status);
  if (!["queued", "starting", "processing", "succeeded", "failed", "canceled"].includes(remoteStatus)) {
    return { status: remoteStatus };
  }

  await updateGeneration(args.serviceSupabase, args.row.id, {
    background_removal_prediction_id: args.prediction.id || args.row.background_removal_prediction_id || null,
    background_removal_status: remoteStatus,
    background_removal_error: null,
  });

  if (remoteStatus === "succeeded") {
    const transparentOutputUrl = extractOutputUrl(args.prediction);
    if (!transparentOutputUrl) throw new Error("Background remover succeeded without an image output");
    const imageUrl = await uploadTransparentImage({
      serviceSupabase: args.serviceSupabase,
      row: args.row,
      transparentOutputUrl,
      prediction: args.prediction,
    });
    return { status: "completed", imageUrl };
  }

  if (remoteStatus === "failed" || remoteStatus === "canceled") {
    await updateGeneration(args.serviceSupabase, args.row.id, {
      background_removal_status: "failed",
      background_removal_error: String(args.prediction.error || args.prediction.detail || "Background removal failed"),
      status: "completed",
      replicate_status: "succeeded",
      image_url: args.row.original_image_url || args.row.image_url,
      output_url: args.row.original_image_url || args.row.output_url,
      finalization_lock_until: null,
    });
    return { status: "completed", imageUrl: args.row.original_image_url || args.row.image_url };
  }

  return { status: remoteStatus };
}

async function triggerBackgroundRemoval(args: {
  req: Request;
  serviceSupabase: ServiceSupabase;
  row: GenerationRow;
}) {
  const webhookUrl = `${getBaseUrl(args.req)}/api/ai-image/webhook?generationId=${encodeURIComponent(
    args.row.generation_id || "",
  )}&stage=background-removal`;
  const prediction = await createReplicatePredictionForModel({
    model: "851-labs/background-remover",
    input: {
      image: args.row.original_image_url || "",
      threshold: 0,
      background_type: "rgba",
      format: "png",
    },
    replicateWebhookUrl: webhookUrl,
  });

  const remoteStatus = normalizePredictionStatus(prediction.status);
  await updateGeneration(args.serviceSupabase, args.row.id, {
    background_removal_prediction_id: prediction.id || args.row.background_removal_prediction_id || null,
    background_removal_status: remoteStatus,
    background_removal_error: null,
  });

  if (remoteStatus === "succeeded") {
    return processBackgroundRemovalPrediction({
      serviceSupabase: args.serviceSupabase,
      row: args.row,
      prediction,
      source: "post",
    });
  }

  return { status: remoteStatus };
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
    row = await storeOriginalImage({ serviceSupabase, row, outputUrl });
    const backgroundRemovalPromise = triggerBackgroundRemoval({
      req,
      serviceSupabase,
      row,
    }).catch((error) => {
      const message = error instanceof Error ? error.message : "Background removal failed";
      console.warn("[AI_BACKGROUND_REMOVAL_DEFERRED]", {
        generationId: row.generation_id,
        predictionId: row.prediction_id,
        responseBodySafe: message.slice(0, 500),
      });
      return null;
    });
    void backgroundRemovalPromise;
    return { status: "completed", imageUrl: row.image_url };
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
