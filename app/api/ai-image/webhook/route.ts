import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { uploadR2Object } from "../../../../trigger/shared/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function getServiceSupabase() {
  return createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function constantTimeMatch(expected: string, actual: string) {
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(actual);
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

async function verifyReplicateWebhook(req: Request, rawBody: string) {
  const signingSecret = getEnv("REPLICATE_WEBHOOK_SECRET").replace(/^whsec_/, "");
  const webhookId = req.headers.get("webhook-id") || "";
  const webhookTimestamp = req.headers.get("webhook-timestamp") || "";
  const webhookSignature = req.headers.get("webhook-signature") || "";

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return false;
  }

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac("sha256", Buffer.from(signingSecret, "base64"))
    .update(signedContent)
    .digest("base64");

  const match = webhookSignature.split(" ").some((entry) => {
    const signature = entry.startsWith("v1,") ? entry.slice(3) : entry;
    return constantTimeMatch(expectedSignature, signature);
  });

  const timestamp = Number(webhookTimestamp);
  const ageSeconds = Math.abs(Date.now() / 1000 - timestamp);
  return match && Number.isFinite(timestamp) && ageSeconds < 5 * 60;
}

function extractGenerationId(payload: any) {
  return String(
      "",
  ).trim();
}

function extractPredictionId(payload: any) {
  return String(payload?.id || payload?.prediction_id || "").trim();
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    if (!(await verifyReplicateWebhook(req, rawBody))) {
      return NextResponse.json({ success: false, error: "Invalid webhook signature" }, { status: 401 });
    }

    console.info("[AI_WEBHOOK_RECEIVED]");

    const payload = JSON.parse(rawBody || "{}");
    const serviceSupabase = getServiceSupabase();
    const url = new URL(req.url);
    const generationId = String(url.searchParams.get("generationId") || extractGenerationId(payload) || "").trim();
    const predictionId = extractPredictionId(payload);

    let query = serviceSupabase.from("user_generated_images").select("*");
    if (generationId && predictionId) {
      query = query.or(`generation_id.eq.${generationId},prediction_id.eq.${predictionId}`);
    } else if (generationId) {
      query = query.eq("generation_id", generationId);
    } else if (predictionId) {
      query = query.eq("prediction_id", predictionId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;

    if (!data) {
      return NextResponse.json({ success: true, ignored: true }, { status: 200 });
    }

    if (["completed", "failed", "canceled"].includes(String(data.status || ""))) {
      console.info("[AI_GENERATION_RECONCILED]", {
        generationId: data.generation_id,
        predictionId: data.prediction_id,
        status: data.status,
        source: "webhook-idempotent",
      });
      return NextResponse.json({ success: true, ignored: true }, { status: 200 });
    }

    const webhookAt = new Date().toISOString();
    const status = String(payload?.status || "").trim().toLowerCase();

    if (status === "succeeded") {
      const imageUrl = String(payload?.output || payload?.image || payload?.url || "").trim();
      if (!imageUrl) {
        throw new Error("Replicate webhook succeeded without an output URL");
      }

      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error("Could not download Replicate output");
      }

      const objectKey = data.storage_key || ["ai-images", data.user_id, `${data.generation_id || data.id}-${Date.now()}.png`].join("/");
      const publicImageUrl = await uploadR2Object({
        key: objectKey,
        body: Buffer.from(await imageResponse.arrayBuffer()),
        contentType: imageResponse.headers.get("content-type") || "image/png",
        cacheControl: "public, max-age=31536000, immutable",
      });

      await serviceSupabase
        .from("user_generated_images")
        .update({
          status: "completed",
          replicate_status: "succeeded",
          output_url: publicImageUrl,
          image_url: publicImageUrl,
          storage_key: objectKey,
          completed_at: webhookAt,
          updated_at: webhookAt,
          webhook_processed_at: webhookAt,
          replicate_output: payload?.output ?? null,
          error_message: null,
        })
        .eq("id", data.id);

      console.info("[AI_GENERATION_SUCCEEDED]", {
        generationId: data.generation_id,
        predictionId: data.prediction_id,
        source: "webhook",
      });
    } else if (status === "failed") {
      const refundedAt = data.credit_refunded_at || webhookAt;
      if (!data.credit_refunded_at) {
        await serviceSupabase.rpc("increment_ai_credits", {
          p_user_id: data.user_id,
          p_amount: 1,
        });
        console.info("[AI_CREDIT_REFUNDED]", {
          generationId: data.generation_id,
          predictionId: data.prediction_id,
          source: "webhook",
        });
      }

      await serviceSupabase
        .from("user_generated_images")
        .update({
          status: "failed",
          replicate_status: "failed",
          failed_at: webhookAt,
          updated_at: webhookAt,
          webhook_processed_at: webhookAt,
          credit_refunded_at: refundedAt,
          error_message: payload?.error || payload?.detail || "AI generation failed",
          replicate_output: payload?.output ?? null,
        })
        .eq("id", data.id);

      console.info("[AI_GENERATION_FAILED]", {
        generationId: data.generation_id,
        predictionId: data.prediction_id,
        source: "webhook",
      });
    } else if (status === "canceled") {
      await serviceSupabase
        .from("user_generated_images")
        .update({
          status: "canceled",
          replicate_status: "canceled",
          canceled_at: webhookAt,
          updated_at: webhookAt,
          webhook_processed_at: webhookAt,
          error_message: payload?.error || "AI generation canceled",
          replicate_output: payload?.output ?? null,
        })
        .eq("id", data.id);
    } else {
      await serviceSupabase
        .from("user_generated_images")
        .update({
          status,
          replicate_status: status,
          updated_at: webhookAt,
          webhook_processed_at: webhookAt,
          replicate_output: payload?.output ?? null,
        })
        .eq("id", data.id);

      console.info("[AI_GENERATION_PROCESSING]", {
        generationId: data.generation_id,
        predictionId: data.prediction_id,
        source: "webhook",
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[AI_GENERATION_FAILED]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Webhook processing failed",
      },
      { status: 500 },
    );
  }
}
