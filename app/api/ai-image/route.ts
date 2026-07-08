import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import Replicate from "replicate";
import { uploadR2Object } from "../../../trigger/shared/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const jsonHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

type ProfileCreditRow = {
  credits: number | string | null;
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

async function getCreditBalance(
  serviceSupabase: ReturnType<typeof getServiceSupabase>,
  userId: string,
) {
  const { data, error } = await serviceSupabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single<ProfileCreditRow>();

  if (error) {
    throw new Error(error.message);
  }

  return Math.max(0, safeInt(data?.credits));
}

async function consumeCredit(
  serviceSupabase: ReturnType<typeof getServiceSupabase>,
  userId: string,
) {
  const { data, error } = await serviceSupabase.rpc("consume_ai_credit", {
    p_user_id: userId,
    p_amount: 1,
  });

  if (error) {
    throw new Error(error.message);
  }

  const result = Array.isArray(data) ? data[0] : data;

  return {
    consumed: Boolean(result?.consumed),
    balance: Math.max(0, safeInt(result?.credits)),
  };
}

async function refundCredit(
  serviceSupabase: ReturnType<typeof getServiceSupabase>,
  userId: string,
) {
  const { error } = await serviceSupabase.rpc("increment_ai_credits", {
    p_user_id: userId,
    p_amount: 1,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function POST(req: Request) {
  let serviceSupabase: ReturnType<typeof getServiceSupabase> | null = null;
  let userId: string | null = null;
  let creditConsumed = false;

  async function refundIfNeeded() {
    if (!serviceSupabase || !userId || !creditConsumed) {
      return;
    }

    try {
      await refundCredit(serviceSupabase, userId);
      creditConsumed = false;
      console.log("AI_IMAGE_REFUND_OK");
    } catch (error) {
      console.error("AI_IMAGE_REFUND_ERROR:", error);
    }
  }

  try {
    console.log("AI_IMAGE_START");

    const replicateToken = getEnv("REPLICATE_API_TOKEN");

    if (!process.env.REMOVE_BG_API_KEY) {
      console.error("AI_IMAGE_MISSING_REMOVE_BG_API_KEY");
      return jsonError(500, "AI image service is not configured");
    }

    const authSupabase = await getAuthSupabase();
    serviceSupabase = getServiceSupabase();

    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      console.error("AI_IMAGE_AUTH_ERROR:", authError);
      return jsonError(401, "Create a free account and get 3 AI credits.");
    }

    userId = user.id;
    console.log("AI_IMAGE_USER:", user.id);

    const body = await req.json().catch(() => ({}));
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      console.error("AI_IMAGE_EMPTY_PROMPT");
      return jsonError(400, "Prompt required");
    }

    const creditResult = await consumeCredit(serviceSupabase, user.id);
    console.log("AI_IMAGE_CREDIT_RESULT:", creditResult);

    if (!creditResult.consumed) {
      return jsonError(402, "You have 0 AI credits left.", {
        credits: creditResult.balance,
        balance: creditResult.balance,
        aiCredits: creditResult.balance,
        credit_balance: creditResult.balance,
      });
    }

    creditConsumed = true;

    const replicate = new Replicate({ auth: replicateToken });
    const fluxModel = process.env.REPLICATE_FLUX_MODEL || "black-forest-labs/flux-dev";

    let fluxOutput: unknown;

    try {
      console.log("AI_IMAGE_REPLICATE_START:", fluxModel);

      fluxOutput = await replicate.run(fluxModel as any, {
        input: {
          prompt: buildQualityPrompt(prompt),
          aspect_ratio: "1:1",
          num_outputs: 1,
          output_format: "png",
          output_quality: 100,
          num_inference_steps: 40,
          guidance_scale: 5,
        },
      });

      console.log("AI_IMAGE_REPLICATE_OK:", fluxOutput);
    } catch (error) {
      console.error("AI_IMAGE_REPLICATE_ERROR:", error);
      throw error;
    }

    const imageUrl = firstString(fluxOutput);
    const generatedImageBuffer = imageUrl ? null : await firstImageBuffer(fluxOutput);

    console.log("AI_IMAGE_OUTPUT_PARSED:", {
      hasImageUrl: Boolean(imageUrl),
      hasGeneratedBuffer: Boolean(generatedImageBuffer),
    });

    if (!imageUrl && !generatedImageBuffer) {
      await refundIfNeeded();
      return jsonError(500, "AI image generation failed");
    }

    console.log("AI_IMAGE_REMOVE_BG_START");

    const removeBgResponse = await fetch(`${getBaseUrl(req)}/api/remove-background`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        generatedImageBuffer
          ? { imageBase64: generatedImageBuffer.toString("base64") }
          : { imageUrl },
      ),
    });

    console.log("AI_IMAGE_REMOVE_BG_STATUS:", {
      status: removeBgResponse.status,
      statusText: removeBgResponse.statusText,
    });

    if (!removeBgResponse.ok) {
      await refundIfNeeded();
      return jsonError(500, "Image generated but background removal failed", {
        originalImageUrl: imageUrl,
        removeBgStatus: removeBgResponse.status,
      });
    }

    const pngBuffer = Buffer.from(await removeBgResponse.arrayBuffer());

    console.log("AI_IMAGE_PNG_SIZE:", pngBuffer.length);

    if (!pngBuffer.length) {
      await refundIfNeeded();
      return jsonError(500, "Background removal returned an empty image", {
        originalImageUrl: imageUrl,
      });
    }

    const generationId = crypto.randomUUID();
    const objectKey = ["ai-images", user.id, `${generationId}-${Date.now()}.png`].join("/");

    let publicImageUrl: string;

    try {
      console.log("AI_IMAGE_R2_UPLOAD_START:", objectKey);

      publicImageUrl = await uploadR2Object({
        key: objectKey,
        body: pngBuffer,
        contentType: "image/png",
        cacheControl: "public, max-age=31536000, immutable",
      });

      console.log("AI_IMAGE_R2_UPLOAD_OK:", publicImageUrl);
    } catch (error) {
      console.error("AI_IMAGE_R2_UPLOAD_ERROR:", error);
      await refundIfNeeded();
      return jsonError(500, "Image generated but upload failed", {
        originalImageUrl: imageUrl,
      });
    }

    creditConsumed = false;

    const nextBalance = await getCreditBalance(serviceSupabase, user.id);

    console.log("AI_IMAGE_SUCCESS:", {
      generationId,
      nextBalance,
    });

    return NextResponse.json(
      {
        success: true,
        imageUrl: publicImageUrl,
        src: publicImageUrl,
        url: publicImageUrl,
        image: publicImageUrl,
        printUrl: publicImageUrl,
        r2Key: objectKey,
        originalImageUrl: imageUrl,
        generationId,
        credits: nextBalance,
        balance: nextBalance,
        aiCredits: nextBalance,
        credit_balance: nextBalance,
      },
      { headers: jsonHeaders },
    );
  } catch (error) {
    await refundIfNeeded();

    console.error("AI_IMAGE_ERROR:", error);

    return jsonError(500, "Internal AI image error", {
      details: error instanceof Error ? error.message : String(error),
    });
  }
}