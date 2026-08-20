import crypto from "crypto";
import Replicate from "replicate";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getDurableRateLimiter } from "@/lib/server/rate-limit";
import { getServiceSupabase } from "@/app/api/ai-image/_lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

const AI_MOCKUP_TIMEOUT_MS = 50_000;
const aiMockupRateLimiter = getDurableRateLimiter({
  namespace: "ai-product-mockup",
  limit: 3,
  window: "1 m",
});

type MockupReservation = {
  created: boolean;
  job_id: string | null;
  job_status: string;
  balance: number | null;
  result_url: string | null;
};

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const id = params?.id?.trim();
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    console.error("REPLICATE_API_TOKEN_MISSING");
    return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
  }

  const supabase = createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
  }

  try {
    const rateLimit = await aiMockupRateLimiter.limit(user.id);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many AI mockup requests" },
        { status: 429 },
      );
    }
  } catch (error) {
    console.error("AI_MOCKUP_RATE_LIMIT_ERROR", {
      message: error instanceof Error ? error.message : "Unknown rate limit error",
    });
    return NextResponse.json(
      { error: "AI mockup service temporarily unavailable" },
      { status: 503 },
    );
  }

  const { data: product, error: productError } = await supabase
    .from("user_products")
    .select("id, user_id, category, title, design_image_url")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (productError) {
    console.error("AI_MOCKUP_PRODUCT_ERROR", { code: productError.code });
    return NextResponse.json({ error: "Failed to load product" }, { status: 500 });
  }

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (!product.design_image_url) {
    return NextResponse.json({ error: "Missing design_image_url" }, { status: 400 });
  }

  const isTshirt =
    product.category?.toLowerCase().includes("shirt") ||
    product.title?.toLowerCase().includes("shirt");
  const prompt = isTshirt
    ? "realistic ecommerce mockup of a white t-shirt worn by a model, front view, studio lighting, natural fabric folds, the uploaded design printed centered on the chest, premium streetwear product photo"
    : "realistic ecommerce mockup of a white hoodie worn by a model, front view, studio lighting, natural fabric folds, the uploaded design printed centered on the chest, premium streetwear product photo";

  const suppliedIdempotencyKey = req.headers.get("idempotency-key")?.trim() || "";
  if (
    suppliedIdempotencyKey &&
    (suppliedIdempotencyKey.length < 8 || suppliedIdempotencyKey.length > 128)
  ) {
    return NextResponse.json({ error: "Invalid idempotency key" }, { status: 400 });
  }

  const idempotencyKey = suppliedIdempotencyKey || crypto.randomUUID();
  const serviceSupabase = getServiceSupabase();
  const { data: reservationData, error: reservationError } = await serviceSupabase.rpc(
    "reserve_ai_mockup_credit",
    {
      p_user_id: user.id,
      p_user_product_id: id,
      p_idempotency_key: idempotencyKey,
    },
  );

  if (reservationError) {
    console.error("AI_MOCKUP_RESERVATION_ERROR", { code: reservationError.code });
    return NextResponse.json({ error: "Failed to reserve AI credit" }, { status: 500 });
  }

  const reservation = (Array.isArray(reservationData)
    ? reservationData[0]
    : reservationData) as MockupReservation | null;

  if (!reservation) {
    return NextResponse.json({ error: "Failed to reserve AI credit" }, { status: 500 });
  }

  if (!reservation.created) {
    if (reservation.job_status === "completed" && reservation.result_url) {
      redirect(`/preview/${id}`);
    }
    if (reservation.job_status === "insufficient_credits") {
      return NextResponse.json(
        { error: "You have 0 AI credits left.", credits: reservation.balance ?? 0 },
        { status: 402 },
      );
    }
    if (reservation.job_status === "not_found") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (reservation.job_status === "profile_not_found") {
      return NextResponse.json({ error: "Profile not found" }, { status: 409 });
    }
    return NextResponse.json(
      { error: "AI mockup generation already in progress" },
      { status: 409 },
    );
  }

  const jobId = reservation.job_id;
  if (!jobId) {
    return NextResponse.json({ error: "Failed to reserve AI credit" }, { status: 500 });
  }

  try {
    const replicate = new Replicate({ auth: token });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_MOCKUP_TIMEOUT_MS);
    let output: unknown;

    try {
      output = await replicate.run("black-forest-labs/flux-dev", {
        input: {
          prompt,
          image: product.design_image_url,
          num_outputs: 1,
          aspect_ratio: "4:5",
          output_format: "png",
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const aiMockupUrl = Array.isArray(output) ? output[0] : output;
    if (typeof aiMockupUrl !== "string" || !aiMockupUrl.startsWith("https://")) {
      throw new Error("Invalid AI output");
    }

    const { data: completed, error: updateError } = await serviceSupabase.rpc(
      "complete_ai_mockup_job",
      {
        p_job_id: jobId,
        p_user_id: user.id,
        p_result_url: aiMockupUrl,
      },
    );

    if (updateError || completed !== true) {
      console.error("AI_MOCKUP_UPDATE_ERROR", {
        code: updateError?.code || "completion_rejected",
      });
      throw new Error("Failed to save AI mockup");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown provider error";
    const { error: refundError } = await serviceSupabase.rpc(
      "refund_ai_mockup_credit_once",
      {
        p_job_id: jobId,
        p_user_id: user.id,
        p_error_message: message,
      },
    );

    if (refundError) {
      console.error("AI_MOCKUP_REFUND_ERROR", { code: refundError.code });
    }
    console.error("AI_MOCKUP_PROVIDER_ERROR", {
      message,
    });
    return NextResponse.json({ error: "AI mockup generation failed" }, { status: 502 });
  }

  redirect(`/preview/${id}`);
}
