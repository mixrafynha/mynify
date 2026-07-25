import Replicate from "replicate";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 60;

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

export async function POST(
  _req: Request,
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

  try {
    const replicate = new Replicate({ auth: token });
    const output = await replicate.run("black-forest-labs/flux-dev", {
      input: {
        prompt,
        image: product.design_image_url,
        num_outputs: 1,
        aspect_ratio: "4:5",
        output_format: "png",
      },
    });

    const aiMockupUrl = Array.isArray(output) ? output[0] : output;
    if (typeof aiMockupUrl !== "string" || !aiMockupUrl.startsWith("https://")) {
      return NextResponse.json({ error: "Invalid AI output" }, { status: 502 });
    }

    const { error: updateError } = await supabase
      .from("user_products")
      .update({ ai_mockup_url: aiMockupUrl })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("AI_MOCKUP_UPDATE_ERROR", { code: updateError.code });
      return NextResponse.json({ error: "Failed to save AI mockup" }, { status: 500 });
    }
  } catch (error) {
    console.error("AI_MOCKUP_PROVIDER_ERROR", {
      message: error instanceof Error ? error.message : "Unknown provider error",
    });
    return NextResponse.json({ error: "AI mockup generation failed" }, { status: 502 });
  }

  redirect(`/preview/${id}`);
}
