import crypto from "crypto";
import { NextResponse } from "next/server";
import { getEnv } from "../_lib/config";
import { applyPredictionState } from "../_lib/finalize";
import { safeErrorDetails } from "../_lib/http";
import { loadGenerationForWebhook, updateGeneration } from "../_lib/repository";
import { getServiceSupabase } from "../_lib/supabase";
import type { ReplicatePrediction } from "../_lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function constantTimeMatch(expected: string, actual: string) {
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(actual);
  return expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);
}

async function verifyReplicateWebhook(req: Request, rawBody: string) {
  const signingSecret = getEnv("REPLICATE_WEBHOOK_SECRET").replace(/^whsec_/, "");
  const webhookId = req.headers.get("webhook-id") || "";
  const webhookTimestamp = req.headers.get("webhook-timestamp") || "";
  const webhookSignature = req.headers.get("webhook-signature") || "";
  if (!webhookId || !webhookTimestamp || !webhookSignature) return false;

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac("sha256", Buffer.from(signingSecret, "base64"))
    .update(signedContent)
    .digest("base64");
  const signatureMatches = webhookSignature.split(" ").some((entry) => {
    const signature = entry.startsWith("v1,") ? entry.slice(3) : entry;
    return constantTimeMatch(expectedSignature, signature);
  });
  const timestamp = Number(webhookTimestamp);
  const ageSeconds = Math.abs(Date.now() / 1000 - timestamp);
  return signatureMatches && Number.isFinite(timestamp) && ageSeconds < 5 * 60;
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    if (!(await verifyReplicateWebhook(req, rawBody))) {
      return NextResponse.json({ success: false, error: "Invalid webhook signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody || "{}") as ReplicatePrediction;
    const generationId = String(new URL(req.url).searchParams.get("generationId") || "").trim() || null;
    const predictionId = String(payload.id || "").trim() || null;
    const serviceSupabase = getServiceSupabase();
    let row = await loadGenerationForWebhook(serviceSupabase, generationId, predictionId);

    console.info("[AI_WEBHOOK_RECEIVED]", { generationId, predictionId, status: payload.status });
    if (!row) return NextResponse.json({ success: true, ignored: true }, { status: 200 });
    if (row.status === "completed" || row.status === "failed" || row.status === "canceled") {
      return NextResponse.json({ success: true, ignored: true }, { status: 200 });
    }

    if (!row.prediction_id && predictionId) {
      row = await updateGeneration(serviceSupabase, row.id, { prediction_id: predictionId });
    }

    await applyPredictionState({ req, serviceSupabase, row, prediction: payload, source: "webhook" });
    await updateGeneration(serviceSupabase, row.id, { webhook_processed_at: new Date().toISOString() }).catch(() => undefined);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[AI_WEBHOOK_FAILED]", safeErrorDetails(error));
    // Return 500 so Replicate can retry transient finalization failures.
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 500 },
    );
  }
}
