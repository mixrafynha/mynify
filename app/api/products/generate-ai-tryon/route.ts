import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  garmentImage?: string;
  productType?: string;
  category?: string;
  side?: "front" | "back" | string;
  modelImages?: string[];
  poses?: string[];
};

function json(data: any, status = 200) {
  return NextResponse.json(data, status ? { status } : undefined);
}

function absoluteUrl(req: Request, value: string) {
  if (!value) return value;
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:image")
  ) {
    return value;
  }

  const origin = new URL(req.url).origin;
  return `${origin}${value.startsWith("/") ? value : `/${value}`}`;
}

function normalizeOutput(output: any): string[] {
  if (!output) return [];

  if (typeof output === "string") {
    return output ? [output] : [];
  }

  if (Array.isArray(output)) {
    return output.flatMap(normalizeOutput).filter(Boolean);
  }

  if (typeof output === "object") {
    return normalizeOutput(
      output.url ||
        output.image ||
        output.images ||
        output.output ||
        output.data ||
        output.result
    );
  }

  return [];
}

async function createPrediction(args: {
  modelRef: string;
  garmentImage: string;
  garmentDescription: string;
}) {
  const token = process.env.REPLICATE_API_TOKEN;
  const model = process.env.REPLICATE_MODEL || "cuuupid/idm-vton";

  if (!token) throw new Error("Missing REPLICATE_API_TOKEN");

  const [owner, name] = model.split("/");
  if (!owner || !name) {
    throw new Error("Invalid REPLICATE_MODEL. Use owner/model.");
  }

  const response = await fetch(
    `https://api.replicate.com/v1/models/${owner}/${name}/predictions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        input: {
          human_img: args.modelRef,
          garm_img: args.garmentImage,
          garment_des: args.garmentDescription,
          category: "upper_body",
          crop: false,
          seed: Math.floor(Math.random() * 999999),
        },
      }),
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.detail || data?.error || "Replicate prediction failed");
  }

  return data;
}

async function waitPrediction(id: string) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("Missing REPLICATE_API_TOKEN");

  for (let i = 0; i < 60; i += 1) {
    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );

    const data = await response.json().catch(() => null);

    if (data?.status === "succeeded") return data;

    if (data?.status === "failed" || data?.status === "canceled") {
      throw new Error(data?.error || "AI try-on failed");
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  throw new Error("AI try-on timeout");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;

    if (!body.garmentImage || !String(body.garmentImage).startsWith("data:image")) {
      return json({
        success: false,
        skipped: true,
        reason: "Missing garmentImage",
      });
    }

    const modelImages = (Array.isArray(body.modelImages) ? body.modelImages : [])
      .map((item) => absoluteUrl(req, item))
      .filter(
        (item) =>
          item &&
          (item.startsWith("http://") ||
            item.startsWith("https://") ||
            item.startsWith("data:image"))
      )
      .slice(0, 6);

    if (!modelImages.length) {
      return json({
        success: false,
        skipped: true,
        reason: "No public modelImages supplied.",
      });
    }

    const productType = body.productType || body.category || "hoodie";

    const garmentDescription = `${productType} with exact printed artwork, photorealistic ecommerce try-on`;

    const images: string[] = [];

    for (const modelRef of modelImages) {
      try {
        const prediction = await createPrediction({
          modelRef,
          garmentImage: body.garmentImage,
          garmentDescription,
        });

        const completed =
          prediction?.status === "succeeded"
            ? prediction
            : await waitPrediction(prediction.id);

        images.push(...normalizeOutput(completed.output));
      } catch (error: any) {
        console.error("AI TRYON POSE FAILED:", modelRef, error?.message || error);
      }
    }

    const unique = images
      .filter(Boolean)
      .filter((img, index, arr) => arr.indexOf(img) === index);

    if (!unique.length) {
      return json({
        success: false,
        skipped: true,
        reason: "AI returned no images.",
      });
    }

    return json({
      success: true,
      provider: "replicate-ai-tryon",

      aiMockupImages: unique,
      aiImages: unique,

      count: unique.length,
      isAi: true,
    });
  } catch (error: any) {
    console.error("AI TRYON ERROR FULL:", {
      message: error?.message,
      stack: error?.stack,
    });

    return json({
      success: false,
      skipped: true,
      reason: error?.message || "AI try-on skipped",
    });
  }
}