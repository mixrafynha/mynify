import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getDurableRateLimiter, getTrustedRequestIp } from "@/lib/server/rate-limit";
import { uploadR2Object } from "../../../trigger/shared/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const jsonHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

const MAX_BODY_BYTES = 16 * 1024;
const POLL_STATES = ["queued", "starting", "processing", "credit_reserved", "replicate_prediction_created"] as const;
const TERMINAL_STATES = ["succeeded", "failed", "canceled"] as const;
const aiImageRateLimiter = getDurableRateLimiter({
  namespace: "ai-image",
  limit: 5,
  window: "1 m",
});

type ProfileCreditRow = {
  credits: number | string | null;
};

type GenerationRow = {
  id: string;
  user_id: string;
  generation_id: string | null;
  idempotency_key: string | null;
  prediction_id: string | null;
  prompt: string | null;
  original_prompt: string | null;
  image_url: string | null;
  storage_key: string | null;
  output_url: string | null;
  status: string | null;
  replicate_status: string | null;
  error_message: string | null;
  is_saved: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function safeInt(value: unknown, fallback = 0) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.floor(next);
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (Array.isArray(value)) {
      const found = firstString(...value);
      if (found) return found;
    }
    if (value && typeof value === "object" && !(value instanceof ReadableStream)) {
      const record = value as Record<string, unknown>;
      const found = firstString(record.url, record.image, record.src, record.output);
      if (found) return found;
    }
  }

  return null;
}

async function firstImageBuffer(value: unknown): Promise<Buffer | null> {
  if (value instanceof ReadableStream) {
    return Buffer.from(await new Response(value).arrayBuffer());
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = await firstImageBuffer(item);
      if (found) return found;
    }
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      (await firstImageBuffer(record.output)) ||
      (await firstImageBuffer(record.image)) ||
      (await firstImageBuffer(record.url))
    );
  }

  return null;
}

async function getAuthSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {}
        },
      },
    },
  );
}

function getServiceSupabase() {
  return createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

function getBaseUrl(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (appUrl) return appUrl;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return new URL(req.url).origin;
}

function jsonError(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json(
    { success: false, error, ...(extra || {}) },
    { status, headers: jsonHeaders },
  );
}

function buildQualityPrompt(userPrompt: string) {
  return `${userPrompt}

Create ONE premium apparel graphic only.

Professional luxury streetwear illustration.
Tattoo-quality artwork.
Extremely detailed.
Fill approximately 90% of the canvas.
Large central composition.
No empty transparent borders.
Leave only a tiny safety margin around the artwork.
Aggressive high-impact composition.
Rich textures.
Layered details.
Deep shadows.
Cinematic lighting.
Ultra sharp edges.
Bold clean outlines.
Crisp line art.
High contrast.
Vibrant colors.
Highly readable silhouette.
Vector-inspired professional illustration.
Premium commercial apparel artwork.
Professional DTG print.
Professional DTF print.
Screen-print friendly design.
Award-winning merch illustration.

If text or lettering is requested, make it clean, bold, readable, correctly spelled, and integrated into the artwork.

STRICT NEGATIVE RULES:
No t-shirt.
No hoodie.
No sweatshirt.
No clothing.
No product mockup.
No person.
No model.
No mannequin.
No hands.
No body.
No room.
No wall.
No table.
No hanger.
No frame.
No watermark.
No logo mockup.
No product photo.
No background scene.
No huge empty transparent border.

Generate only the isolated printable artwork, centered, fully visible, sharp, detailed, high contrast, vibrant, and print-ready.`;
}

async function getCreditBalance(serviceSupabase: ReturnType<typeof getServiceSupabase>, userId: string) {
  const { data, error } = await serviceSupabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single<ProfileCreditRow>();

  if (error) throw new Error(error.message);

  return Math.max(0, safeInt(data?.credits));
}

async function consumeCredit(serviceSupabase: ReturnType<typeof getServiceSupabase>, userId: string) {
  const { data, error } = await serviceSupabase.rpc("consume_ai_credit", {
    p_user_id: userId,
    p_amount: 1,
  });

  if (error) throw new Error(error.message);

  const result = Array.isArray(data) ? data[0] : data;
  return {
    consumed: Boolean(result?.consumed),
    balance: Math.max(0, safeInt(result?.credits)),
  };
}

async function refundCredit(serviceSupabase: ReturnType<typeof getServiceSupabase>, userId: string) {
  const { error } = await serviceSupabase.rpc("increment_ai_credits", {
    p_user_id: userId,
    p_amount: 1,
  });
  if (error) throw new Error(error.message);
}

function normalizePredictionStatus(value: unknown) {
  const status = String(value || "").trim().toLowerCase();
  if (!status) return "unknown";
  return status;
}

function extractOutputUrl(prediction: any) {
  return firstString(prediction?.output, prediction?.image, prediction?.images, prediction?.urls);
}

async function finalizePrediction(params: {
  req: Request;
  serviceSupabase: ReturnType<typeof getServiceSupabase>;
  row: GenerationRow;
  prediction: any;
  source: "post" | "webhook" | "poll";
}) {
  const { req, serviceSupabase, row, prediction, source } = params;
  const status = normalizePredictionStatus(prediction?.status || row.replicate_status);
  const outputUrl = extractOutputUrl(prediction);

  if (status === "succeeded") {
    console.info("[AI_GENERATION_SUCCEEDED]", {
      generationId: row.generation_id,
      predictionId: row.prediction_id,
      source,
    });

    const imageUrl = outputUrl;
    const generatedImageBuffer = imageUrl ? null : await firstImageBuffer(prediction?.output);

    if (!imageUrl && !generatedImageBuffer) {
      throw new Error("Replicate succeeded without an image output");
    }

    const removeBgResponse = await fetch(`${getBaseUrl(req)}/api/remove-background`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.get("cookie") ?? "",
      },
      body: JSON.stringify(
        generatedImageBuffer
          ? { imageBase64: generatedImageBuffer.toString("base64") }
          : { imageUrl },
      ),
    });

    if (!removeBgResponse.ok) {
      throw new Error(`Background removal failed with ${removeBgResponse.status}`);
    }

    const pngBuffer = Buffer.from(await removeBgResponse.arrayBuffer());
    if (!pngBuffer.length) {
      throw new Error("Background removal returned an empty image");
    }

    const objectKey = row.storage_key || ["ai-images", row.user_id, `${row.generation_id || row.id}-${Date.now()}.png`].join("/");
    const publicImageUrl = await uploadR2Object({
      key: objectKey,
      body: pngBuffer,
      contentType: "image/png",
      cacheControl: "public, max-age=31536000, immutable",
    });

    const completedAt = new Date().toISOString();
    const update = {
      status: "completed",
      replicate_status: status,
      output_url: publicImageUrl,
      image_url: publicImageUrl,
      storage_key: objectKey,
      completed_at: completedAt,
      updated_at: completedAt,
      error_message: null,
      is_saved: false,
      webhook_processed_at: completedAt,
      replicate_output: prediction?.output ?? null,
    } as Record<string, unknown>;

    const { error } = await serviceSupabase.from("user_generated_images").update(update).eq("id", row.id);
    if (error) throw error;

    return { status: "completed", imageUrl: publicImageUrl };
  }

  if (status === "failed") {
    console.info("[AI_GENERATION_FAILED]", {
      generationId: row.generation_id,
      predictionId: row.prediction_id,
      source,
    });

    const failedAt = new Date().toISOString();
    const { data: refreshed, error: refreshError } = await serviceSupabase
      .from("user_generated_images")
      .select("id,status,credit_refunded_at,user_id,generation_id,prediction_id")
      .eq("id", row.id)
      .maybeSingle();
    if (refreshError) throw refreshError;

    let refunded = false;
    if (refreshed && !refreshed.credit_refunded_at) {
      await refundCredit(serviceSupabase, row.user_id);
      refunded = true;
      console.info("[AI_CREDIT_REFUNDED]", {
        generationId: row.generation_id,
        predictionId: row.prediction_id,
        source,
      });
    }

    const { error } = await serviceSupabase
      .from("user_generated_images")
      .update({
        status: "failed",
        replicate_status: status,
        failed_at: failedAt,
        updated_at: failedAt,
        error_message: prediction?.error || prediction?.detail || "AI generation failed",
        credit_refunded_at: refunded ? failedAt : refreshed?.credit_refunded_at ?? null,
        replicate_output: prediction?.output ?? null,
      })
      .eq("id", row.id);
    if (error) throw error;

    return { status: "failed" };
  }

  if (status === "canceled") {
    const canceledAt = new Date().toISOString();
    const { error } = await serviceSupabase
      .from("user_generated_images")
      .update({
        status: "canceled",
        replicate_status: status,
        canceled_at: canceledAt,
        updated_at: canceledAt,
        error_message: prediction?.error || "AI generation canceled",
        replicate_output: prediction?.output ?? null,
      })
      .eq("id", row.id);
    if (error) throw error;

    console.info("[AI_GENERATION_RECONCILED]", {
      generationId: row.generation_id,
      predictionId: row.prediction_id,
      status,
      source,
    });

    return { status: "canceled" };
  }

  const pendingAt = new Date().toISOString();
  const { error } = await serviceSupabase
    .from("user_generated_images")
    .update({
      status: status === "queued" ? "queued" : status === "starting" ? "starting" : "processing",
      replicate_status: status,
      updated_at: pendingAt,
      replicate_output: prediction?.output ?? null,
    })
    .eq("id", row.id);
  if (error) throw error;

  console.info(
    status === "starting" ? "[AI_GENERATION_STARTING]" : "[AI_GENERATION_PROCESSING]",
    {
      generationId: row.generation_id,
      predictionId: row.prediction_id,
      source,
    },
  );

  return { status };
}

async function createReplicatePrediction(args: {
  req: Request;
  generationId: string;
  prompt: string;
  replicateWebhookUrl: string;
}) {
  const token = getEnv("REPLICATE_API_TOKEN");
  const model = process.env.REPLICATE_FLUX_MODEL || "black-forest-labs/flux-dev";
  const [owner, name] = model.split("/");
  if (!owner || !name) {
    throw new Error("Invalid REPLICATE_FLUX_MODEL. Use owner/model.");
  }

  const response = await fetch(
    `https://api.replicate.com/v1/models/${owner}/${name}/predictions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          prompt: buildQualityPrompt(args.prompt),
          aspect_ratio: "1:1",
          num_outputs: 1,
          output_format: "png",
          output_quality: 100,
          num_inference_steps: 40,
          guidance_scale: 5,
        },
        webhook: args.replicateWebhookUrl,
        webhook_events_filter: ["completed"],
      }),
    },
  );

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.detail || data?.error || "Replicate prediction failed");
  }

  return data;
}

async function loadGenerationById(serviceSupabase: ReturnType<typeof getServiceSupabase>, generationId: string, userId: string) {
  const { data, error } = await serviceSupabase
    .from("user_generated_images")
    .select("*")
    .eq("generation_id", generationId)
    .eq("user_id", userId)
    .maybeSingle<GenerationRow>();

  if (error) throw error;
  return data;
}

async function reconcileWithReplicate(args: {
  req: Request;
  serviceSupabase: ReturnType<typeof getServiceSupabase>;
  row: GenerationRow;
  source: "post" | "webhook" | "poll";
}) {
  const token = getEnv("REPLICATE_API_TOKEN");
  const { row } = args;
  const predictionId = row.prediction_id;
  if (!predictionId) return { status: row.status || "pending" };

  const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const prediction = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(prediction?.detail || prediction?.error || "Could not reconcile prediction");
  }

  return finalizePrediction({
    req: args.req,
    serviceSupabase: args.serviceSupabase,
    row: args.row,
    prediction,
    source: args.source,
  });
}

function toResponseRow(row: GenerationRow | null) {
  if (!row) return null;
  return {
    generationId: row.generation_id,
    predictionId: row.prediction_id,
    status: row.status,
    replicateStatus: row.replicate_status,
    imageUrl: row.image_url,
    outputUrl: row.output_url,
    error: row.error_message,
    prompt: row.prompt,
    originalPrompt: row.original_prompt,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(req: Request) {
  try {
    const authSupabase = await getAuthSupabase();
    const serviceSupabase = getServiceSupabase();

    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return jsonError(401, "Authentication required");
    }

    const url = new URL(req.url);
    const generationId = String(url.searchParams.get("generationId") || "").trim();
    const reconcile = String(url.searchParams.get("reconcile") || "").trim() === "1";

    if (generationId) {
      const row = await loadGenerationById(serviceSupabase, generationId, user.id);
      if (!row) return jsonError(404, "Generation not found");

      if (reconcile && row.prediction_id && POLL_STATES.includes((row.status || "") as any)) {
        await reconcileWithReplicate({ req, serviceSupabase, row, source: "poll" });
      }

      const nextRow = await loadGenerationById(serviceSupabase, generationId, user.id);
      return NextResponse.json(
        {
          success: true,
          generation: toResponseRow(nextRow),
        },
        { headers: jsonHeaders },
      );
    }

    const { data, error } = await serviceSupabase
      .from("user_generated_images")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_saved", false)
      .in("status", [...POLL_STATES, "pending"])
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      return jsonError(500, "Could not load AI generations");
    }

    return NextResponse.json(
      {
        success: true,
        generations: (data || []).map(toResponseRow),
      },
      { headers: jsonHeaders },
    );
  } catch (error) {
    return jsonError(500, "Could not load AI generations", {
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function POST(req: Request) {
  let serviceSupabase: ReturnType<typeof getServiceSupabase> | null = null;
  let userId: string | null = null;
  let creditConsumed = false;
  let currentGenerationId: string | null = null;
  let currentPredictionId: string | null = null;

  async function refundIfNeeded(generationId?: string | null, predictionId?: string | null) {
    if (!serviceSupabase || !userId || !creditConsumed) return;

    try {
      await refundCredit(serviceSupabase, userId);
      creditConsumed = false;
      console.info("[AI_CREDIT_REFUNDED]", {
        generationId: generationId ?? currentGenerationId,
        predictionId: predictionId ?? currentPredictionId,
        source: "post-refund",
      });
    } catch (error) {
      console.error("AI_IMAGE_REFUND_ERROR:", error);
    }
  }

  try {
    console.info("[AI_GENERATION_CREATED]");

    const authSupabase = await getAuthSupabase();
    serviceSupabase = getServiceSupabase();

    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return jsonError(401, "Create a free account and get 3 AI credits.");
    }

    userId = user.id;

    try {
      const rateLimit = await aiImageRateLimiter.limit(`${user.id}:${getTrustedRequestIp(req)}`);
      if (!rateLimit.success) {
        return jsonError(429, "Too many AI image requests");
      }
    } catch (error) {
      console.error("[ai-image:rate-limit-error]", {
        message: error instanceof Error ? error.message : String(error),
      });
      return jsonError(503, "AI image service is temporarily unavailable");
    }

    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return jsonError(413, "Request body too large");
    }

    const rawBody = await req.text().catch(() => "");
    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return jsonError(413, "Request body too large");
    }

    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(rawBody || "{}") as Record<string, unknown>;
    } catch {
      return jsonError(400, "Invalid request body");
    }

    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) {
      return jsonError(400, "Prompt required");
    }

    const idempotencyKey =
      String(body?.idempotencyKey || body?.idempotency_key || req.headers.get("idempotency-key") || "").trim() ||
      crypto.randomUUID();

    const existingByIdempotency = await serviceSupabase
      .from("user_generated_images")
      .select("*")
      .eq("user_id", user.id)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle<GenerationRow>();
    if (existingByIdempotency.error) throw existingByIdempotency.error;

    if (existingByIdempotency.data) {
      console.info("[AI_GENERATION_RECONCILED]", {
        generationId: existingByIdempotency.data.generation_id,
        predictionId: existingByIdempotency.data.prediction_id,
        source: "idempotency",
      });
      return NextResponse.json(
        {
          success: true,
          generation: toResponseRow(existingByIdempotency.data),
        },
        { status: existingByIdempotency.data.status === "completed" ? 200 : 202, headers: jsonHeaders },
      );
    }

    const creditResult = await consumeCredit(serviceSupabase, user.id);
    if (!creditResult.consumed) {
      return jsonError(402, "You have 0 AI credits left.", {
        credits: creditResult.balance,
        balance: creditResult.balance,
        aiCredits: creditResult.balance,
        credit_balance: creditResult.balance,
      });
    }

    creditConsumed = true;
    console.info("[AI_CREDIT_RESERVED]", {
      userId: user.id,
      balance: creditResult.balance,
      idempotencyKey,
    });

    const generationId = crypto.randomUUID();
    currentGenerationId = generationId;
    const now = new Date().toISOString();
    const baseRow = {
      user_id: user.id,
      generation_id: generationId,
      idempotency_key: idempotencyKey,
      prompt,
      original_prompt: String(body?.originalPrompt || body?.original_prompt || prompt).trim(),
      status: "credit_reserved",
      replicate_status: "credit_reserved",
      is_saved: false,
      created_at: now,
      updated_at: now,
      credit_reserved_at: now,
      request_payload: body,
    };

    const { data: insertedRow, error: insertError } = await serviceSupabase
      .from("user_generated_images")
      .insert(baseRow)
      .select("*")
      .single<GenerationRow>();
    if (insertError) throw insertError;

    console.info("[AI_GENERATION_STARTING]", {
      generationId,
      source: "create-row",
    });

    const prediction = await createReplicatePrediction({
      req,
      generationId,
      prompt,
      replicateWebhookUrl: `${getBaseUrl(req)}/api/ai-image/webhook?generationId=${encodeURIComponent(generationId)}`,
    });

    const predictionId = String(prediction?.id || "").trim();
    currentPredictionId = predictionId || null;
    const predictionStatus = normalizePredictionStatus(prediction?.status);

    const updatePayload: Record<string, unknown> = {
      prediction_id: predictionId || null,
      status: predictionStatus === "succeeded" ? "processing" : predictionStatus,
      replicate_status: predictionStatus,
      replicate_prediction: prediction ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedRow, error: updateError } = await serviceSupabase
      .from("user_generated_images")
      .update(updatePayload)
      .eq("id", insertedRow.id)
      .select("*")
      .single<GenerationRow>();
    if (updateError) throw updateError;

    if (predictionStatus === "succeeded" || predictionStatus === "failed" || predictionStatus === "canceled") {
      await finalizePrediction({
        req,
        serviceSupabase,
        row: updatedRow,
        prediction,
        source: "post",
      });

      const finalRow = await loadGenerationById(serviceSupabase, generationId, user.id);
      const balance = await getCreditBalance(serviceSupabase, user.id);

      return NextResponse.json(
        {
          success: finalRow?.status === "completed",
          generation: toResponseRow(finalRow),
          credits: balance,
          balance,
          aiCredits: balance,
          credit_balance: balance,
        },
        { status: finalRow?.status === "completed" ? 200 : 202, headers: jsonHeaders },
      );
    }

    console.info(
      predictionStatus === "starting" ? "[AI_GENERATION_STARTING]" : "[AI_GENERATION_PROCESSING]",
      {
        generationId,
        predictionId,
      },
    );

    const balance = await getCreditBalance(serviceSupabase, user.id);
    return NextResponse.json(
      {
        success: true,
        generation: toResponseRow(updatedRow),
        credits: balance,
        balance,
        aiCredits: balance,
        credit_balance: balance,
      },
      { status: 202, headers: jsonHeaders },
    );
  } catch (error) {
    const shouldRefund = creditConsumed && !currentPredictionId;
    if (shouldRefund) {
      await refundIfNeeded(currentGenerationId, currentPredictionId);
    }

    console.error("[AI_GENERATION_FAILED]", error);

    return jsonError(500, "Internal AI image error", {
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
