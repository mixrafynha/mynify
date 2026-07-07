import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Replicate from "replicate";
import { uploadR2Object } from "../../../trigger/shared/r2";

export const runtime = "nodejs";

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

async function getSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
          } catch {
            // Server Components can ignore cookie set failures.
          }
        },
      },
    },
  );
}

function getBaseUrl(req: Request) {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return new URL(req.url).origin;
}

function buildQualityPrompt(prompt: string) {
  return `${prompt}

Create one premium print-ready apparel design asset.
It must look like a professional Leonardo-style streetwear graphic with rich details, strong shape language, readable composition, and high commercial quality.
If text/lettering is requested, make it clean, bold, readable, and integrated into the artwork.
Do not generate a t-shirt, hoodie, product mockup, person, model, room, wall, hanger, frame, watermark, logo mockup, or product photo.
Generate only the isolated printable artwork, centered, fully visible, sharp, detailed, high contrast, vibrant, DTG/DTF ready.`;
}

export async function POST(req: Request) {
  let supabase: Awaited<ReturnType<typeof getSupabase>> | null = null;
  let creditConsumed = false;

  async function refundCredit() {
    if (!supabase || !creditConsumed) return;

    try {
      await supabase.rpc("refund_ai_credit");
      creditConsumed = false;
    } catch (refundError) {
      console.error("AI IMAGE CREDIT REFUND ERROR:", refundError);
    }
  }

  try {
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    const fluxModel = process.env.REPLICATE_FLUX_MODEL || "black-forest-labs/flux-dev";

    if (!replicateToken) {
      return NextResponse.json({ success: false, error: "Missing REPLICATE_API_TOKEN" }, { status: 500 });
    }

    if (!process.env.REMOVE_BG_API_KEY) {
      return NextResponse.json({ success: false, error: "Missing REMOVE_BG_API_KEY" }, { status: 500 });
    }

    supabase = await getSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Create a free account and get 3 AI credits." },
        { status: 401 },
      );
    }

    const { data: consumed, error: creditError } = await supabase.rpc("consume_ai_credit");

    if (creditError) {
      return NextResponse.json(
        { success: false, error: "Error checking credits", details: creditError.message },
        { status: 500 },
      );
    }

    if (!consumed) {
      return NextResponse.json({ success: false, error: "You have 0 AI credits left." }, { status: 402 });
    }

    creditConsumed = true;

    const body = await req.json();
    const prompt = body?.prompt;

    if (!prompt || typeof prompt !== "string") {
      await refundCredit();
      return NextResponse.json({ success: false, error: "Prompt required" }, { status: 400 });
    }

    const replicate = new Replicate({ auth: replicateToken });

    console.log("AI IMAGE: Starting FLUX DEV generation", {
      model: fluxModel,
      userId: user.id,
    });

    const fluxOutput = await replicate.run(fluxModel as any, {
      input: {
        prompt: buildQualityPrompt(prompt),
        aspect_ratio: "1:1",
        num_outputs: 1,
        output_format: "png",
        output_quality: 100,
        num_inference_steps: 32,
        guidance_scale: 3.5,
      },
    });

    const imageUrl = firstString(fluxOutput);
    const generatedImageBuffer = imageUrl ? null : await firstImageBuffer(fluxOutput);

    if (!imageUrl && !generatedImageBuffer) {
      await refundCredit();
      console.error("AI IMAGE FLUX ERROR: FLUX did not return URL or stream", fluxOutput);
      return NextResponse.json(
        { success: false, error: "FLUX did not return an image URL or image stream" },
        { status: 500 },
      );
    }

    const removeBgResponse = await fetch(`${getBaseUrl(req)}/api/remove-background`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        generatedImageBuffer
          ? { imageBase64: generatedImageBuffer.toString("base64") }
          : { imageUrl },
      ),
    });

    if (!removeBgResponse.ok) {
      await refundCredit();
      const details = await removeBgResponse.text();

      console.error("AI IMAGE REMOVE BACKGROUND ERROR:", {
        status: removeBgResponse.status,
        statusText: removeBgResponse.statusText,
        details,
        originalImageUrl: imageUrl,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Image generated but remove background failed",
          originalImageUrl: imageUrl,
          details,
        },
        { status: 500 },
      );
    }

    const pngBuffer = Buffer.from(await removeBgResponse.arrayBuffer());

    if (!pngBuffer.length) {
      await refundCredit();
      return NextResponse.json(
        { success: false, error: "Remove background returned an empty image", originalImageUrl: imageUrl },
        { status: 500 },
      );
    }

    const generationId = crypto.randomUUID();
    const objectKey = ["ai-images", user.id, `${generationId}-${Date.now()}.png`].join("/");

    let publicImageUrl: string;

    try {
      publicImageUrl = await uploadR2Object({
        key: objectKey,
        body: pngBuffer,
        contentType: "image/png",
        cacheControl: "public, max-age=31536000, immutable",
      });
    } catch (uploadError: any) {
      await refundCredit();

      console.error("AI IMAGE R2 UPLOAD ERROR:", {
        message: uploadError?.message,
        name: uploadError?.name,
        stack: uploadError?.stack,
        objectKey,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Image generated but R2 upload failed",
          originalImageUrl: imageUrl,
          details: uploadError?.message || "Unknown R2 upload error",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: publicImageUrl,
      src: publicImageUrl,
      url: publicImageUrl,
      image: publicImageUrl,
      printUrl: publicImageUrl,
      r2Key: objectKey,
      originalImageUrl: imageUrl,
      generationId,
    });
  } catch (error: any) {
    await refundCredit();

    console.error("AI IMAGE ERROR:", {
      message: error?.message,
      name: error?.name,
      status: error?.status,
      cause: error?.cause,
      stack: error?.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal AI image error",
        details: error?.cause ?? null,
      },
      { status: 500 },
    );
  }
}
